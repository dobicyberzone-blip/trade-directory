/**
 * Authentication utilities for token management
 */

export const clearAuthData = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');

  }
};

export const setUserData = (user: unknown) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('user', JSON.stringify(user));

    } catch (error) {

    }
  }
};

export const getUserData = (): unknown | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    return JSON.parse(userStr);
  } catch (error) {

    return null;
  }
};

export const hasValidToken = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const token = localStorage.getItem('auth_token');
  if (!token) return false;
  
  try {
    // Basic JWT structure check (header.payload.signature)
    const parts = token.split('.');
    if (parts.length !== 3) {

      clearAuthData();
      return false;
    }
    
    // Decode payload to check expiration
    const payload = JSON.parse(atob(parts[1]));
    const now = Math.floor(Date.now() / 1000);
    
    if (payload.exp && payload.exp < now) {

      clearAuthData();
      return false;
    }
    
    // Check if token is about to expire (within 1 hour)
    if (payload.exp && (payload.exp - now) < 3600) {

    }
    
    return true;
  } catch (error) {

    clearAuthData();
    return false;
  }
};

export const getTokenInfo = () => {
  if (typeof window === 'undefined') return null;
  
  const token = localStorage.getItem('auth_token');
  if (!token) return null;
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    return {
      userId: payload.userId,
      exp: payload.exp,
      iat: payload.iat,
      isExpired: payload.exp ? payload.exp < Math.floor(Date.now() / 1000) : false
    };
  } catch {
    return null;
  }
};

// Server-side token verification
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

export interface TokenPayload {
  userId: string;
  email: string;
  role: 'ADMIN' | 'EXPORTER' | 'BUYER' | 'PARTNER' | 'SUPER_ADMIN';
  iat?: number;
  exp?: number;
}

export async function verifyToken(request: NextRequest): Promise<TokenPayload | null> {
  try {
    // Try Authorization header first (standard)
    let token: string | null = null;
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    // Fallback: x-auth-token header (in case nginx strips Authorization)
    if (!token) {
      const xAuthToken = request.headers.get('x-auth-token');
      if (xAuthToken) token = xAuthToken;
    }

    // Fallback: cookie (for SSR or when headers are stripped)
    if (!token) {
      const cookieToken = request.cookies.get('auth_token')?.value;
      if (cookieToken) token = cookieToken;
    }

    if (!token) {
      return null;
    }
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {

      return null;
    }

    // Check if JWT_SECRET is still the placeholder value
    if (jwtSecret.includes('change-this') || jwtSecret === 'your-super-secret-jwt-key-change-this-in-production') {

      return null;
    }

    const decoded = jwt.verify(token, jwtSecret) as TokenPayload;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {

    } else if (error instanceof jwt.TokenExpiredError) {

    } else {

    }
    return null;
  }
}

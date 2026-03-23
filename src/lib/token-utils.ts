/**
 * Token validation utilities
 */

interface DecodedToken {
  userId: string;
  email: string;
  role: string;
  exp: number;
  iat: number;
}

/**
 * Decode JWT token without verification (client-side check only)
 */
export function decodeToken(token: string): DecodedToken | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    
    const payload = parts[1];
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return true;
  }
  
  // exp is in seconds, Date.now() is in milliseconds
  const now = Date.now() / 1000;
  return decoded.exp < now;
}

/**
 * Get token from localStorage and validate it
 */
export function getValidToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  const token = localStorage.getItem('auth_token');
  if (!token) {
    return null;
  }
  
  if (isTokenExpired(token)) {
    // Clear expired token
    localStorage.removeItem('auth_token');
    return null;
  }
  
  return token;
}

/**
 * Clear authentication data
 */
export function clearAuth(): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
}

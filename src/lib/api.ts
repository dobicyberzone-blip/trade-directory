// Auto-detect API base URL for both local and production
const getApiBaseUrl = () => {
  // Always use environment variable if set
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // In production (Vercel), use the same domain for API
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const port = window.location.port;
    
    // If on Vercel or production domain, use same domain for API
    if (hostname.includes('vercel.app') || hostname.includes('keproba.com') || process.env.NODE_ENV === 'production') {
      return `${protocol}//${hostname}/api`;
    }
    
    // For local development, use the same host and port as the frontend
    const portSuffix = port ? `:${port}` : '';
    return `${protocol}//${hostname}${portSuffix}/api`;
  }
  
  // Server-side: use relative path
  return '/api';
};

const API_BASE_URL = getApiBaseUrl();

// Map technical error messages to user-friendly messages while keeping debug info in console
function getUserFriendlyError(errorMessage: string, status?: number): string {
  // Map of technical messages to user-friendly messages
  const errorMappings: Record<string, string> = {
    'User ID required': 'Your session has expired. Please log in again.',
    'Invalid credentials': 'Incorrect email or password. Please check your credentials.',
    'Invalid or expired OTP code': 'The verification code has expired or is invalid. Please request a new one.',
    'Invalid OTP code': 'The verification code you entered is incorrect.',
    'OTP expired': 'Your verification code has expired. Please request a new one.',
    'OTP code expired': 'Your verification code has expired. Please request a new one.',
    'Invalid verification code': 'The verification code you entered is incorrect.',
    'User not found': 'No account found with this email. Please check or create a new account.',
    'Email already exists': 'An account with this email already exists.',
    'Failed to fetch': 'Cannot connect to the server. Please check your internet connection.',
    'NetworkError': 'Cannot connect to the server. Please check your internet connection.',
  };

  // Check for specific error messages
  for (const [technical, friendly] of Object.entries(errorMappings)) {
    if (errorMessage.includes(technical)) {
      return friendly;
    }
  }

  // Handle HTTP status codes
  if (status === 401) {
    return 'Your session has expired. Please log in again.';
  }
  if (status === 403) {
    return 'You do not have permission to perform this action.';
  }
  if (status === 404) {
    return 'The requested resource was not found.';
  }
  if (status === 429) {
    return 'Too many requests. Please wait a moment and try again.';
  }
  if (status && status >= 500) {
    return 'Server error. Please try again later.';
  }

  // Default to a generic user-friendly message
  return 'An error occurred. Please try again.';
}

export interface LogEntry {
  id: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  category: string;
  message: string;
  userId?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
  createdAt: string;
}

export interface LogStats {
  totalLogs: number;
  byLevel: Record<string, number>;
  byCategory: Record<string, number>;
  recentErrors: number;
  [key: string]: unknown;
}

// Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'EXPORTER' | 'BUYER' | 'PARTNER' | 'SUPER_ADMIN';
  partnerType?: string;
  avatar?: string;
  phoneNumber?: string;
  phone?: string;
  phoneVerified?: boolean;
  totpEnabled?: boolean;
  preferredOtpMethod?: 'EMAIL' | 'SMS' | 'TOTP';
  emailVerified?: boolean;
  suspended?: boolean;
  location?: string;
  bio?: string;
  company?: string;
  position?: string;
  website?: string;
  linkedIn?: string;
  twitter?: string;
  profileImage?: string;
  createdAt: string;
  updatedAt?: string;
  business?: Business;
}

export interface Business {
  id: string;
  name: string;
  description?: string;
  location: string;
  county?: string;              // For filtering by county
  town?: string;                // For filtering by town
  coordinates?: string;         // JSON string for lat/lng
  sector: string;
  
  // Contact Information
  contactEmail: string;
  contactPhone?: string;
  companyEmail?: string;        // Alternative company email
  companyPhoneNumber?: string;
  mobileNumber?: string;
  whatsappNumber?: string;
  website?: string;
  physicalAddress?: string;
  
  // Business Details
  typeOfBusiness?: string;      // kept for legacy data display only
  businessUserOrganisation?: string;
  companySize?: string;
  numberOfEmployees?: string;
  dateOfIncorporation?: string; // from registration form
  
  // Registration & Compliance
  kenyanNationalId?: string;
  nationalId?: string;
  registrationNumber?: string;
  licenceNumber?: string;
  kraPin?: string;
  exportLicense?: string;
  registrationCertificateUrl?: string;
  pinCertificateUrl?: string;
  
  // Export Information
  exportVolumePast3Years?: string;
  currentExportMarkets?: string; // Current export markets
  productionCapacityPast3?: string;
  companyStory?: string;        // Company story/about section
  industry?: string;
  productHsCode?: string;
  serviceOffering?: string;
  
  // Media & Branding
  logoUrl?: string;
  twitterUrl?: string;
  instagramUrl?: string;
  
  // Status & Ratings
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  profileComplete: boolean;
  rating?: number;
  featured?: boolean;
  featuredAt?: string;
  featuredBy?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt?: string;
  
  // Relations
  ownerId?: string;
  owner?: User;
  products?: Product[];
  certifications?: BusinessCertification[];
  
  // Computed fields (from API)
  isFavorited?: boolean;
  userRating?: number;
  averageRating?: number;
  totalRatings?: number;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  category: string;
  imageUrl?: string;
  price?: number;
  unit?: string;
  minOrder?: number;
  availability: boolean;
  createdAt: string;
  business?: Business;
  user?: User;
}

export interface BusinessCertification {
  id: string;
  name: string;
  issuer: string;
  imageUrl?: string;
  logoUrl?: string;
  validUntil?: string;
  createdAt: string;
  certificationId?: string;
}

// CMS Types
export interface ContentSection {
  id: string;
  sectionKey: string;
  title?: string;
  subtitle?: string;
  content?: string;
  imageUrl?: string;
  backgroundColor?: string;
  textColor?: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface ContentItem {
  id: string;
  sectionKey: string;
  type: string;
  title?: string;
  subtitle?: string;
  content?: string;
  imageUrl?: string;
  iconName?: string;
  linkUrl?: string;
  linkText?: string;
  backgroundColor?: string;
  textColor?: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface SiteSettings {
  id: string;
  settingKey: string;
  settingValue: string;
  description?: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface MediaLibrary {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  alt?: string;
  caption?: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface Favorite {
  id: string;
  userId: string;
  businessId: string;
  createdAt: string;
  business?: Business;
}

export interface Rating {
  id: string;
  userId: string;
  businessId: string;
  rating: number; // 1-5 stars
  review?: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
  business?: Business;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'ACCOUNT_REGISTRATION' | 'BUSINESS_VERIFICATION' | 'PRODUCT_INQUIRY' | 'SYSTEM_UPDATE' | 'CHAT_MESSAGE';
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  read: boolean;
  createdAt: string;
}

// API Client Class
class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    // Load token from localStorage if available
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    suppressAuthErrors: boolean = false,
    allow404: boolean = false
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Always check for token in localStorage before making request
    // This ensures token is available even if ApiClient was instantiated before login
    if (typeof window !== 'undefined' && !this.token) {
      this.token = localStorage.getItem('auth_token');
    }
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { 
          Authorization: `Bearer ${this.token}`,
          'x-auth-token': this.token,
        }),
        ...options.headers,
      },
      ...options,
    };

    try {

      if (this.token) {

      }
      
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        
        // Return null for 404s if allowed (for optional settings)
        if (allow404 && response.status === 404) {
          return null as T;
        }
        
        // Handle token expiration/invalid token
        if (response.status === 401 || response.status === 403) {
          // Check if the error is specifically about the token being invalid
          const isTokenError = errorMessage.includes('Unauthorized') || 
                              errorMessage.includes('Invalid token') ||
                              errorMessage.includes('Token expired') ||
                              errorMessage.includes('session has expired') ||
                              errorMessage.includes('Authentication required') ||
                              errorMessage.includes('invalid signature');
          
          // Only clear token if it's actually a token problem, not a permission issue
          if (isTokenError && !suppressAuthErrors) {
            this.clearToken();
          } else if (!suppressAuthErrors) {
            // Log but don't clear token for permission errors (user doesn't have access)
          }
        }
        
        // Don't log certain expected errors (not bugs, just user input issues)
        const suppressedErrors = [
          'Setting not found', // Expected on first load before CMS is configured
          'Failed to fetch public media library', // Media library feature disabled
          'Invalid credentials', // User login error
          'Invalid or expired OTP code', // User input error during registration
          'Invalid OTP code',
          'OTP expired',
          'OTP code expired',
          'Invalid verification code',
        ];
        
        const shouldSuppress = suppressedErrors.some(err => errorMessage.includes(err)) || 
                              (suppressAuthErrors && (response.status === 401 || response.status === 403));
        
        // Handle 404 errors more gracefully - log as warning instead of error
        // since 404s are expected during auth checks when endpoints may not be configured
        if (response.status === 404) {
          if (!shouldSuppress) {

          }
        } else if (!shouldSuppress) {
          // Log detailed error for debugging (keeps technical details for devs)

        }
        
        // Throw user-friendly error message
        const userFriendlyMessage = getUserFriendlyError(errorMessage, response.status);
        throw new Error(userFriendlyMessage);
      }

      const data = await response.json();

      return data;
    } catch (error: unknown) {
      // Enhanced error logging for debugging
      if (error instanceof Error && error.name === 'TypeError' && error.message === 'Failed to fetch') {
        // Only log network errors if not suppressed
        if (!suppressAuthErrors) {

        }
        // Use user-friendly message for network errors
        throw new Error(getUserFriendlyError('Failed to fetch'));
      }
      
      // Log for debugging (suppress if flag is set)
      if (!suppressAuthErrors) {

      }
      
      // If error was already thrown from the try block above (line 403),
      // it's already user-friendly, so just re-throw it without transforming again
      if (error instanceof Error) {
        throw error;
      }
      
      // For unexpected error types, provide a generic message
      throw new Error('An unexpected error occurred');
    }
  }

  // Auth methods
  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
      // Also set as cookie so it survives nginx Authorization header stripping
      document.cookie = `auth_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      // Clear cookie too
      document.cookie = 'auth_token=; path=/; max-age=0; SameSite=Lax';
    }
  }

  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    role?: 'ADMIN' | 'EXPORTER' | 'BUYER' | 'PARTNER';
    businessName?: string;
    businessLocation?: string;
    productCategory?: string;
    partnerType?: string;
  }): Promise<{ user: User; token: string }> {
    const response = await this.request<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    this.setToken(response.token);
    return response;
  }

  async login(email: string, password: string, otpCode?: string, otpMethod?: 'EMAIL' | 'SMS' | 'TOTP'): Promise<{ user: User; token: string } | { requiresOtp: true; email: string; otpMethod?: string; message?: string; phoneNumber?: string }> {
    // For login, we don't want to clear the token on 401 since that's expected for wrong credentials
    // We'll handle the request manually without using the generic request method's auth error handling
    const url = `${this.baseURL}/auth/login`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, otpCode, otpMethod }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        
        // For login failures, throw user-friendly error without clearing existing tokens
        throw new Error(getUserFriendlyError(errorMessage, response.status));
      }
      
      const data = await response.json();
      
      if ('token' in data) {
        this.setToken(data.token);
      }
      
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Login failed. Please try again.');
    }
  }

  async requestOtp(email: string, method: 'EMAIL' | 'SMS' = 'EMAIL', phoneNumber?: string): Promise<{ message: string; email: string; method: string }> {
    return this.request<{ message: string; email: string; method: string }>('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email, method, type: 'LOGIN', phoneNumber }),
    });
  }

  async verifyOtp(email: string, otpCode: string, method?: 'EMAIL' | 'SMS' | 'TOTP'): Promise<{ user: User; token: string }> {
    // For OTP verification, we don't want to clear existing tokens on failure
    const url = `${this.baseURL}/auth/verify-otp`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code: otpCode, method }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(getUserFriendlyError(errorMessage, response.status));
      }
      
      const data = await response.json();
      this.setToken(data.token);
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('OTP verification failed. Please try again.');
    }
  }

  async getCurrentUser(): Promise<{ user: User } | null> {
    return this.request<{ user: User } | null>('/auth/me', {}, false, true);
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  }

  async setupTotp(): Promise<{ secret: string; qrCodeUrl: string; backupCodes: string[] }> {
    return this.request<{ secret: string; qrCodeUrl: string; backupCodes: string[] }>('/auth/setup-totp', {
      method: 'POST',
    });
  }

  async enableTotp(token: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/enable-totp', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async disableTotp(): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/disable-totp', {
      method: 'POST',
    });
  }

  async updatePhoneNumber(phoneNumber: string): Promise<{ message: string; phoneNumber: string }> {
    return this.request<{ message: string; phoneNumber: string }>('/auth/update-phone', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber }),
    });
  }

  async updateOtpMethod(method: 'EMAIL' | 'SMS' | 'TOTP'): Promise<{ message: string; method: string }> {
    return this.request<{ message: string; method: string }>('/auth/update-otp-method', {
      method: 'POST',
      body: JSON.stringify({ method }),
    });
  }

  logout() {
    this.clearToken();
  }

  // Business methods
  async getBusinesses(params?: {
    verified?: boolean;
    featured?: boolean;
    sector?: string;
    location?: string;
    page?: number;
    limit?: number;
    search?: string;
    filters?: Record<string, string[]>;
  }): Promise<{ businesses: Business[]; pagination?: { total: number; page: number; limit: number; totalPages: number; hasMore: boolean } }> {
    const searchParams = new URLSearchParams();
    if (params?.verified) searchParams.set('verified', 'true');
    if (params?.featured) searchParams.set('featured', 'true');
    if (params?.sector) searchParams.set('sector', params.sector);
    if (params?.location) searchParams.set('location', params.location);
    if (params?.page !== undefined) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.search) searchParams.set('search', params.search);
    
    // Handle filters - encode as JSON string
    if (params?.filters && Object.keys(params.filters).length > 0) {
      searchParams.set('filters', JSON.stringify(params.filters));
    }
    
    const query = searchParams.toString();
    return this.request<{ businesses: Business[]; pagination?: { total: number; page: number; limit: number; totalPages: number; hasMore: boolean } }>(`/businesses${query ? `?${query}` : ''}`);
  }

  async getBusiness(id: string, params?: {
    includeProducts?: boolean;
    includeCertifications?: boolean;
    limit?: number;
  }): Promise<{ business: Business }> {
    const searchParams = new URLSearchParams();
    if (params?.includeProducts === false) searchParams.set('includeProducts', 'false');
    if (params?.includeCertifications === false) searchParams.set('includeCertifications', 'false');
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    
    const query = searchParams.toString();
    return this.request<{ business: Business }>(`/businesses/${id}${query ? `?${query}` : ''}`);
  }

  async createBusiness(data: Partial<Business>): Promise<{ business: Business }> {
    return this.request<{ business: Business }>('/businesses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBusiness(id: string, data: Partial<Business>): Promise<{ business: Business; requiresReverification?: boolean; message?: string }> {
    return this.request<{ business: Business; requiresReverification?: boolean; message?: string }>(`/businesses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async toggleBusinessFeatured(id: string, featured: boolean): Promise<{ business: Business }> {
    return this.request<{ business: Business }>(`/businesses/${id}/feature`, {
      method: 'PATCH',
      body: JSON.stringify({ featured }),
    });
  }

  async getBusinessesNeedingVerification(): Promise<{ businesses: Business[] }> {
    return this.request<{ businesses: Business[] }>('/businesses/pending-verification');
  }

  async updateBusinessVerification(id: string, data: { status: 'VERIFIED' | 'REJECTED'; notes?: string }): Promise<{ business: Business }> {
    return this.request<{ business: Business }>(`/businesses/${id}/verify`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Alias for convenience
  async verifyBusiness(id: string, status: 'VERIFIED' | 'REJECTED', notes?: string): Promise<{ business: Business }> {
    return this.updateBusinessVerification(id, { status, notes });
  }

  // Business Certification methods
  async getBusinessCertifications(businessId: string): Promise<{ certifications: BusinessCertification[] }> {
    return this.request<{ certifications: BusinessCertification[] }>(`/businesses/${businessId}/certifications`);
  }

  async addBusinessCertification(businessId: string, data: {
    name: string;
    issuer: string;
    imageUrl?: string;
    logoUrl?: string;
    validUntil?: string;
    certificationId?: string;
  }): Promise<{ certification: BusinessCertification }> {
    return this.request<{ certification: BusinessCertification }>(`/businesses/${businessId}/certifications`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteBusinessCertification(businessId: string, certificationId: string): Promise<void> {
    await this.request(`/businesses/${businessId}/certifications/${certificationId}`, {
      method: 'DELETE',
    });
  }

  // Product methods
  async getProducts(params?: {
    category?: string;
    businessId?: string;
    available?: boolean;
  }): Promise<{ products: Product[] }> {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.set('category', params.category);
    if (params?.businessId) searchParams.set('businessId', params.businessId);
    if (params?.available !== undefined) searchParams.set('available', params.available.toString());
    
    const query = searchParams.toString();
    return this.request<{ products: Product[] }>(`/products${query ? `?${query}` : ''}`);
  }

  async getProduct(id: string): Promise<{ product: Product }> {
    return this.request<{ product: Product }>(`/products/${id}`);
  }

  async createProduct(data: Partial<Product>): Promise<{ product: Product }> {
    return this.request<{ product: Product }>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProduct(id: string, data: Partial<Product>): Promise<{ product: Product }> {
    return this.request<{ product: Product }>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProduct(id: string): Promise<void> {
    await this.request(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  // Inquiry methods
  async getInquiries(params?: { status?: string; productId?: string }): Promise<{ inquiries: Inquiry[] }> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.productId) searchParams.set('productId', params.productId);
    
    const query = searchParams.toString();
    return this.request<{ inquiries: Inquiry[] }>(`/inquiries${query ? `?${query}` : ''}`);
  }

  async getInquiry(id: string): Promise<{ inquiry: Inquiry }> {
    return this.request<{ inquiry: Inquiry }>(`/inquiries/${id}`);
  }

  async updateInquiryStatus(id: string, status: 'RESPONDED' | 'CLOSED'): Promise<{ inquiry: Inquiry }> {
    return this.request<{ inquiry: Inquiry }>(`/inquiries/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Send inquiry to a business (creates conversation and first message)
  async sendInquiry(data: {
    exporterId: string;
    message: string;
    businessName: string;
    businessId: string;
  }): Promise<{ success: boolean; conversationId: string; conversation?: unknown }> {
    return this.request<{ success: boolean; conversationId: string; conversation?: unknown }>('/inquiries/send', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Get all inquiry conversations for current user
  async getInquiryConversations(): Promise<{ conversations: unknown[] }> {
    return this.request<{ conversations: unknown[] }>('/chat/conversations');
  }

  // Get a specific conversation with messages
  async getConversation(conversationId: string): Promise<{ conversation: unknown }> {
    return this.request<{ conversation: unknown }>(`/chat/conversations/${conversationId}`);
  }

  // Send a reply to a conversation
  async sendReply(conversationId: string, message: string): Promise<{ success: boolean; message: string; chatMessage?: unknown }> {
    // Get current user ID from token
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) {
      throw new Error('Authentication required');
    }
    
    // Decode token to get user ID (simple base64 decode of JWT payload)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const senderId = payload.userId;
    
    return this.request<{ success: boolean; message: string; chatMessage?: unknown }>(`/chat/messages`, {
      method: 'POST',
      body: JSON.stringify({ 
        conversationId, 
        senderId,
        message,
        messageType: 'TEXT'
      }),
    });
  }

  // Update conversation status (archive/close)
  async updateConversationStatus(conversationId: string, status: string): Promise<{ success: boolean; conversation?: unknown }> {
    return this.request<{ success: boolean; conversation?: unknown }>(`/chat/conversations/${conversationId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async createNotification(data: {
    userId?: string;
    userIds?: string[];
    title: string;
    message: string;
    type: string;
    urgency?: string;
  }): Promise<{ success: boolean; message: string }> {
    return this.request("/notifications/create", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // User methods

  async getUsers(): Promise<{ users: User[] }> {
    // Suppress auth errors for this endpoint since it's admin-only
    // and will naturally fail for non-admin users
    const response = await this.request<{ users: User[], data: User[], total: number }>('/admin/users', {}, true);
    // API returns both `users` and `data` keys — prefer `users`, fall back to `data`
    return { users: response.users ?? response.data ?? [] };
  }

  async getUser(id: string): Promise<{ user: User }> {
    return this.request<{ user: User }>(`/users/${id}`);
  }

  async updateUser(id: string, data: Partial<User>): Promise<{ user: User }> {
    return this.request<{ user: User }>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateUserProfile(id: string, data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    location?: string;
    bio?: string;
    company?: string;
    position?: string;
    website?: string;
    linkedIn?: string;
    twitter?: string;
    profileImage?: string;
  }): Promise<{ user: User }> {
    return this.request<{ user: User }>(`/users/${id}/profile`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: string): Promise<void> {
    await this.request(`/admin/users/${id}`, {
      method: 'DELETE',
    });
  }

  async createUser(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: 'ADMIN' | 'EXPORTER' | 'BUYER';
    phoneNumber?: string;
  }): Promise<{ user: User; message: string }> {
    return this.request<{ user: User; message: string }>('/admin/users/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async suspendUser(id: string, suspended: boolean): Promise<{ user: User; message: string }> {
    return this.request<{ user: User; message: string }>(`/admin/users/${id}/suspend`, {
      method: 'PATCH',
      body: JSON.stringify({ suspended }),
    });
  }

  async bulkDeleteUsers(ids: string[]): Promise<{ message: string; count: number }> {
    return this.request<{ message: string; count: number }>('/admin/users/bulk', {
      method: 'POST',
      body: JSON.stringify({ action: 'delete', ids }),
    });
  }

  // ============================================
  // CMS METHODS
  // ============================================

  // Content Sections
  async getContentSections(): Promise<{ sections: ContentSection[] }> {
    return this.request<{ sections: ContentSection[] }>('/cms/sections');
  }

  async getContentSection(sectionKey: string): Promise<{ section: ContentSection }> {
    return this.request<{ section: ContentSection }>(`/cms/sections/${sectionKey}`);
  }

  async saveContentSection(data: Partial<ContentSection>): Promise<{ section: ContentSection }> {
    return this.request<{ section: ContentSection }>('/cms/sections', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteContentSection(sectionKey: string): Promise<void> {
    await this.request(`/cms/sections/${sectionKey}`, {
      method: 'DELETE',
    });
  }

  // Content Items
  async getContentItems(sectionKey: string): Promise<{ items: ContentItem[] }> {
    return this.request<{ items: ContentItem[] }>(`/cms/items/${sectionKey}`);
  }

  async createContentItem(data: Partial<ContentItem>): Promise<{ item: ContentItem }> {
    return this.request<{ item: ContentItem }>('/cms/items', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateContentItem(id: string, data: Partial<ContentItem>): Promise<{ item: ContentItem }> {
    return this.request<{ item: ContentItem }>(`/cms/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteContentItem(id: string): Promise<void> {
    await this.request(`/cms/items/${id}`, {
      method: 'DELETE',
    });
  }

  // Site Settings
  async getSiteSettings(category?: string): Promise<{ settings: SiteSettings[] }> {
    const query = category ? `?category=${category}` : '';
    return this.request<{ settings: SiteSettings[] }>(`/cms/settings${query}`);
  }

  async getSiteSetting(settingKey: string): Promise<{ setting: SiteSettings }> {
    return this.request<{ setting: SiteSettings }>(`/cms/settings/${settingKey}`);
  }

  async getSiteSettingOptional(settingKey: string): Promise<{ setting: SiteSettings | null }> {
    const result = await this.request<{ setting: SiteSettings } | null>(
      `/cms/settings/${settingKey}`,
      {},
      false,
      true // allow404
    );
    return result || { setting: null };
  }

  async saveSiteSetting(data: Partial<SiteSettings>): Promise<{ setting: SiteSettings }> {
    return this.request<{ setting: SiteSettings }>('/cms/settings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Media Library
  async getMediaLibrary(category?: string): Promise<{ media: MediaLibrary[] }> {
    const query = category ? `?category=${category}` : '';
    return this.request<{ media: MediaLibrary[] }>(`/cms/media${query}`);
  }

  async getPublicMediaLibrary(category?: string): Promise<{ media: MediaLibrary[] }> {
    const query = category ? `?category=${category}` : '';
    return this.request<{ media: MediaLibrary[] }>(`/cms/media/public${query}`, {}, true); // true = suppress auth errors
  }

  async createMediaItem(data: Partial<MediaLibrary>): Promise<{ media: MediaLibrary }> {
    return this.request<{ media: MediaLibrary }>('/cms/media', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteMediaItem(id: string): Promise<void> {
    await this.request(`/cms/media/${id}`, {
      method: 'DELETE',
    });
  }

  // Bulk Operations
  async getHomeContent(): Promise<{ 
    sections: ContentSection[], 
    items: Record<string, ContentItem[]>, 
    settings: SiteSettings[] 
  }> {
    return this.request<{ 
      sections: ContentSection[], 
      items: Record<string, ContentItem[]>, 
      settings: SiteSettings[] 
    }>('/cms/home-content');
  }

  // Logs methods (Admin only)
  async getLogs(params?: {
    level?: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
    category?: string;
    startDate?: string;
    endDate?: string;
    userId?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: LogEntry[]; total: number }> {
    const searchParams = new URLSearchParams();
    if (params?.level) searchParams.set('level', params.level);
    if (params?.category) searchParams.set('category', params.category);
    if (params?.startDate) searchParams.set('startDate', params.startDate);
    if (params?.endDate) searchParams.set('endDate', params.endDate);
    if (params?.userId) searchParams.set('userId', params.userId);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    
    const query = searchParams.toString();
    return this.request<{ logs: LogEntry[]; total: number }>(`/logs${query ? `?${query}` : ''}`);
  }

  async getLogStats(days?: number): Promise<{ stats: LogStats }> {
    const query = days ? `?days=${days}` : '';
    return this.request<{ stats: LogStats }>(`/logs/stats${query}`);
  }

  // Product verification methods (Admin only)
  async verifyProduct(id: string, status: 'VERIFIED' | 'REJECTED', notes?: string): Promise<{ product: Product }> {
    return this.request<{ product: Product }>(`/products/${id}/verify`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
  }

  // Get products pending verification (Admin only)
  async getProductsForVerification(): Promise<{ products: Product[] }> {
    return this.request<{ products: Product[] }>('/products?verified=false');
  }

  // Favorites methods
  async getFavorites(): Promise<{ favorites: Favorite[] }> {
    return this.request<{ favorites: Favorite[] }>('/favorites');
  }

  async addToFavorites(businessId: string): Promise<{ favorite: Favorite }> {
    return this.request<{ favorite: Favorite }>('/favorites', {
      method: 'POST',
      body: JSON.stringify({ businessId }),
    });
  }

  async removeFromFavorites(businessId: string): Promise<void> {
    await this.request(`/favorites/${businessId}`, {
      method: 'DELETE',
    });
  }

  async checkFavoriteStatus(businessId: string): Promise<{ isFavorited: boolean }> {
    return this.request<{ isFavorited: boolean }>(
      `/favorites/check/${businessId}`,
      {},
      true // suppressAuthErrors - don't spam console when not logged in
    );
  }

  // Ratings methods
  async getRatings(businessId?: string): Promise<{ ratings: Rating[] }> {
    const query = businessId ? `?businessId=${businessId}` : '';
    return this.request<{ ratings: Rating[] }>(`/ratings${query}`);
  }

  async addRating(data: {
    businessId: string;
    rating: number;
    review?: string;
  }): Promise<{ rating: Rating }> {
    return this.request<{ rating: Rating }>('/ratings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRating(businessId: string, data: {
    rating: number;
    review?: string;
  }): Promise<{ rating: Rating }> {
    // Use POST endpoint which handles both create and update
    return this.request<{ rating: Rating }>('/ratings', {
      method: 'POST',
      body: JSON.stringify({ businessId, ...data }),
    });
  }

  async deleteRating(businessId: string): Promise<void> {
    await this.request(`/ratings/${businessId}`, {
      method: 'DELETE',
    });
  }

  async getUserRating(businessId: string): Promise<{ rating: Rating | null }> {
    return this.request<{ rating: Rating | null }>(`/ratings/business/${businessId}/user`);
  }

  async getBusinessRatingStats(businessId: string): Promise<{ 
    averageRating: number; 
    totalRatings: number; 
    ratingDistribution: { [key: number]: number } 
  }> {
    return this.request<{ 
      averageRating: number; 
      totalRatings: number; 
      ratingDistribution: { [key: number]: number } 
    }>(`/ratings/stats/${businessId}`);
  }

  // Success Story methods
  async getSuccessStories(featured?: boolean, limit?: number): Promise<{ stories: SuccessStory[] }> {
    const params = new URLSearchParams();
    if (featured) params.append('featured', 'true');
    if (limit) params.append('limit', limit.toString());
    
    const query = params.toString();
    return this.request<{ stories: SuccessStory[] }>(`/success-stories${query ? `?${query}` : ''}`);
  }

  async getSuccessStory(id: string): Promise<{ story: SuccessStory }> {
    return this.request<{ story: SuccessStory }>(`/success-stories/${id}`);
  }

  async createSuccessStory(data: Partial<SuccessStory>): Promise<{ story: SuccessStory; message: string }> {
    return this.request<{ story: SuccessStory; message: string }>('/success-stories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getUserSuccessStories(): Promise<{ stories: SuccessStory[] }> {
    return this.request<{ stories: SuccessStory[] }>('/success-stories/user/my-stories');
  }

  async updateSuccessStory(id: string, data: Partial<SuccessStory>): Promise<{ story: SuccessStory; message: string }> {
    return this.request<{ story: SuccessStory; message: string }>(`/success-stories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteSuccessStory(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/success-stories/${id}`, {
      method: 'DELETE',
    });
  }

  // Admin success story methods
  async getAdminSuccessStories(status?: 'pending' | 'approved'): Promise<{ stories: SuccessStory[] }> {
    const query = status ? `?status=${status}` : '';
    return this.request<{ stories: SuccessStory[] }>(`/success-stories/admin/all${query}`);
  }

  async updateSuccessStoryStatus(id: string, isApproved?: boolean, isFeatured?: boolean): Promise<{ story: SuccessStory; message: string }> {
    return this.request<{ story: SuccessStory; message: string }>(`/success-stories/admin/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isApproved, isFeatured }),
    });
  }

  // Public method for making generic requests (for admin features)
  async makeRequest<T = unknown>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, options);
  }

  // Statistics methods
  async getStatistics(): Promise<{ statistics: {
    verifiedExporters: number;
    productCategories: number;
    countriesReached: number;
    tradeInquiries: number;
    totalUsers: number;
    totalProducts: number;
    totalBusinesses: number;
    successStories: number;
  } }> {
    return this.request<{ statistics: {
      verifiedExporters: number;
      productCategories: number;
      countriesReached: number;
      tradeInquiries: number;
      totalUsers: number;
      totalProducts: number;
      totalBusinesses: number;
      successStories: number;
    } }>('/statistics');
  }

  // Sectors methods
  async getSectors(): Promise<{ sectors: ExportSector[] }> {
    return this.request<{ sectors: ExportSector[] }>('/sectors');
  }

  // Device management methods
  async getUserSessions(): Promise<{ sessions: UserSession[] }> {
    return this.request<{ sessions: UserSession[] }>('/devices/sessions');
  }

  async getUserActivities(page: number = 1, limit: number = 20): Promise<{ 
    activities: UserActivity[]; 
    pagination: { page: number; limit: number; total: number; pages: number } 
  }> {
    return this.request<{ 
      activities: UserActivity[]; 
      pagination: { page: number; limit: number; total: number; pages: number } 
    }>(`/devices/activities?page=${page}&limit=${limit}`);
  }

  async revokeSession(sessionId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/devices/sessions/${sessionId}`, {
      method: 'DELETE'
    });
  }

  async revokeAllOtherSessions(): Promise<{ message: string; revokedCount: number }> {
    return this.request<{ message: string; revokedCount: number }>('/devices/sessions', {
      method: 'DELETE'
    });
  }

  async logActivity(action: string, description?: string, metadata?: Record<string, unknown>): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/devices/activities', {
      method: 'POST',
      body: JSON.stringify({ action, description, metadata })
    });
  }

  async updateSessionActivity(): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/devices/sessions/activity', {
      method: 'PATCH'
    });
  }

  async getSectorDetails(sectorId: string): Promise<{ 
    sector: string;
    businesses: Business[];
    stats: {
      totalBusinesses: number;
      totalProducts: number;
      averageRating: number;
    };
  }> {
    return this.request<{ 
      sector: string;
      businesses: Business[];
      stats: {
        totalBusinesses: number;
        totalProducts: number;
        averageRating: number;
      };
    }>(`/sectors/${sectorId}`);
  }

  // Chat methods
  async getConversations(userId: string): Promise<{ conversations: unknown[] }> {
    return this.request<{ conversations: unknown[] }>(`/chat/conversations?userId=${userId}`);
  }

  async getUnreadCount(): Promise<{ unreadCount: number }> {
    return this.request<{ unreadCount: number }>('/chat/unread-count');
  }

  async sendMessage(data: {
    conversationId: string;
    senderId: string;
    message: string;
    messageType?: string;
    attachmentUrl?: string;
  }): Promise<{ message: unknown; success: boolean }> {
    return this.request<{ message: unknown; success: boolean }>('/chat/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createInquiry(data: { productId: string; message: string; quantity?: string }): Promise<{ message: string; inquiry: Inquiry }> {
    return this.request<{ message: string; inquiry: Inquiry }>('/inquiries', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Notification methods
  async getNotifications(): Promise<{ notifications: Notification[]; unreadCount: number }> {
    return this.request<{ notifications: Notification[]; unreadCount: number }>(
      '/notifications',
      {},
      true // suppressAuthErrors - don't spam console when not logged in
    );
  }

  async markNotificationAsRead(notificationId: string): Promise<{ notification: Notification }> {
    return this.request<{ notification: Notification }>(`/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
  }

  async markAllNotificationsAsRead(): Promise<{ message: string }> {
    return this.request<{ message: string }>('/notifications/mark-all-read', {
      method: 'POST',
    });
  }

  // Buyer statistics methods
  async getBuyerStatistics(): Promise<{
    statistics: {
      totalSearches: number;
      totalFavorites: number;
      totalInquiries: number;
      businessesViewed: number;
      searchGrowth: number;
      favoriteGrowth: number;
      inquiryGrowth: number;
      viewsGrowth: number;
      activeConversations: number;
      responseRate: number;
      avgResponseTime: string;
    };
    monthlyData: Array<{
      month: string;
      searches: number;
      inquiries: number;
      favorites: number;
    }>;
    categoryData: Array<{
      name: string;
      value: number;
    }>;
  }> {
    return this.request<{
      statistics: {
        totalSearches: number;
        totalFavorites: number;
        totalInquiries: number;
        businessesViewed: number;
        searchGrowth: number;
        favoriteGrowth: number;
        inquiryGrowth: number;
        viewsGrowth: number;
        activeConversations: number;
        responseRate: number;
        avgResponseTime: string;
      };
      monthlyData: Array<{
        month: string;
        searches: number;
        inquiries: number;
        favorites: number;
      }>;
      categoryData: Array<{
        name: string;
        value: number;
      }>;
    }>('/buyer/statistics');
  }

  // Exporter statistics methods
  async getExporterStatistics(): Promise<{
    statistics: {
      totalProducts: number;
      totalInquiries: number;
      totalProfileViews: number;
      totalFavorites: number;
      totalRatings: number;
      averageRating: number;
      responseRate: number;
      inquiryGrowth: number;
      viewsGrowth: number;
      favoritesGrowth: number;
    };
    monthlyData: Array<{
      month: string;
      inquiries: number;
      views: number;
      favorites: number;
    }>;
    topProducts: Array<{
      name: string;
      category: string;
      inquiries: number;
    }>;
    inquirySourceData: Array<{
      name: string;
      category: string;
      value: number;
    }>;
  }> {
    return this.request<{
      statistics: {
        totalProducts: number;
        totalInquiries: number;
        totalProfileViews: number;
        totalFavorites: number;
        totalRatings: number;
        averageRating: number;
        responseRate: number;
        inquiryGrowth: number;
        viewsGrowth: number;
        favoritesGrowth: number;
      };
      monthlyData: Array<{
        month: string;
        inquiries: number;
        views: number;
        favorites: number;
      }>;
      topProducts: Array<{
        name: string;
        category: string;
        inquiries: number;
      }>;
      inquirySourceData: Array<{
        name: string;
        category: string;
        value: number;
      }>;
    }>('/exporter/statistics');
  }
}

export interface SuccessStory {
  id: string;
  title: string;
  story: string;
  companyName: string;
  buyerName: string;
  buyerTitle?: string;
  exporterName: string;
  productCategory: string;
  exportValue?: string;
  exportDestination: string;
  imageUrl?: string;
  isApproved: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
  user?: User;
}

export interface ExportSector {
  id: string;
  name: string;
  icon: string;
  description: string;
  exporters: number;
  products: string;
  productCategories: string[];
  sampleBusinesses?: string[];
  isActive?: boolean;
  order?: number;
}

export interface UserSession {
  id: string;
  deviceInfo: {
    browser: { name?: string; version?: string };
    os: { name?: string; version?: string };
    device: { type?: string; model?: string; vendor?: string };
    displayName?: string;
    riskLevel?: 'low' | 'medium' | 'high';
    isRecognized?: boolean;
  };
  ipAddress?: string;
  location?: string;
  lastActivity: string;
  createdAt: string;
  isCurrent: boolean;
  sessionDuration?: number;
}

export interface UserActivity {
  id: string;
  action: string;
  description?: string;
  ipAddress?: string;
  location?: string;
  deviceInfo?: {
    browser: { name?: string; version?: string };
    os: { name?: string; version?: string };
    device: { type?: string; model?: string; vendor?: string };
  };
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface Inquiry {
  id: string;
  productId: string;
  buyerId: string;
  message: string;
  quantity?: string;
  status: 'PENDING' | 'RESPONDED' | 'CLOSED';
  createdAt: string;
  updatedAt?: string;
  product?: {
    id: string;
    name: string;
    category: string;
    imageUrl?: string;
    price?: number;
    unit?: string;
    userId: string;
    business?: {
      id: string;
      name: string;
      location?: string;
    };
  };
  buyer?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

// Create and export API client instance
export const apiClient = new ApiClient(API_BASE_URL);

// Export API client class for testing
export { ApiClient };

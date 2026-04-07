import { api } from "@/lib/api/axios";

// User type (duplicated here to avoid circular import)
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "admin" | "teacher" | "student";
  avatar?: string;
}

// Response types
interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

interface RefreshResponse {
  token: string;
  refreshToken?: string;
}

// Request types
interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: "student" | "teacher";
}

// Auth Service
export const authService = {
  /**
   * Login user with email and password
   */
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    return api.post<AuthResponse>("/auth/login", credentials);
  },

  /**
   * Register a new user
   */
  register: async (userData: RegisterRequest): Promise<AuthResponse> => {
    return api.post<AuthResponse>("/auth/register", userData);
  },

  /**
   * Logout current user
   */
  logout: async (): Promise<void> => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Ignore errors on logout - clear local state anyway
    }
  },

  /**
   * Refresh access token using refresh token
   */
  refreshToken: async (refreshToken: string): Promise<RefreshResponse> => {
    return api.post<RefreshResponse>("/auth/refresh", { refreshToken });
  },

  /**
   * Get current user profile
   */
  getProfile: async (): Promise<User> => {
    return api.get<User>("/auth/me");
  },

  /**
   * Update user profile
   */
  updateProfile: async (data: Partial<User>): Promise<User> => {
    return api.patch<User>("/auth/me", data);
  },

  /**
   * Change password
   */
  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<void> => {
    return api.post("/auth/change-password", data);
  },

  /**
   * Request password reset
   */
  forgotPassword: async (email: string): Promise<void> => {
    return api.post("/auth/forgot-password", { email });
  },

  /**
   * Reset password with token
   */
  resetPassword: async (data: {
    token: string;
    password: string;
  }): Promise<void> => {
    return api.post("/auth/reset-password", data);
  },

  /**
   * Verify email with token
   */
  verifyEmail: async (token: string): Promise<void> => {
    return api.post("/auth/verify-email", { token });
  },

  /**
   * Resend verification email
   */
  resendVerification: async (): Promise<void> => {
    return api.post("/auth/resend-verification");
  },
};

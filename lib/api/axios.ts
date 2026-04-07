import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from "axios";

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";
const API_TIMEOUT = 30000; // 30 seconds

// Custom error interface
export interface ApiError {
  message: string;
  code: string;
  status: number;
  errors?: Record<string, string[]>;
}

// Token getter function - will be set by the store
let getAuthToken: (() => string | null) | null = null;
let clearAuthCredentials: (() => void) | null = null;

// Function to set the token getter (called from redux provider)
export const setAuthHelpers = (
  tokenGetter: () => string | null,
  credentialsClearer: () => void
) => {
  getAuthToken = tokenGetter;
  clearAuthCredentials = credentialsClearer;
};

// Create Axios instance with default configuration
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true, // Enable cookies for cross-origin requests
});

// Request interceptor for adding auth token
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token using the getter function
    const token = getAuthToken?.();

    // Add Authorization header if token exists
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request timestamp for debugging
    config.headers["X-Request-Time"] = new Date().toISOString();

    return config;
  },
  (error: AxiosError) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    // Transform successful responses if needed
    return response;
  },
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Handle 401 Unauthorized - clear credentials and redirect
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Clear credentials and redirect to login
      clearAuthCredentials?.();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }

    // Handle other error responses
    const apiError: ApiError = {
      message: error.response?.data?.message || error.message || "An error occurred",
      code: error.response?.data?.code || "UNKNOWN_ERROR",
      status: error.response?.status || 500,
      errors: error.response?.data?.errors,
    };

    // Log errors in development
    if (process.env.NODE_ENV === "development") {
      console.error("API Error:", {
        url: originalRequest?.url,
        method: originalRequest?.method,
        status: apiError.status,
        message: apiError.message,
      });
    }

    return Promise.reject(apiError);
  }
);

// Export the configured instance
export default axiosInstance;

// Export helper methods for common HTTP operations
export const api = {
  get: <T>(url: string, config?: Record<string, unknown>) =>
    axiosInstance.get<T>(url, config).then((res) => res.data),

  post: <T>(url: string, data?: unknown, config?: Record<string, unknown>) =>
    axiosInstance.post<T>(url, data, config).then((res) => res.data),

  put: <T>(url: string, data?: unknown, config?: Record<string, unknown>) =>
    axiosInstance.put<T>(url, data, config).then((res) => res.data),

  patch: <T>(url: string, data?: unknown, config?: Record<string, unknown>) =>
    axiosInstance.patch<T>(url, data, config).then((res) => res.data),

  delete: <T>(url: string, config?: Record<string, unknown>) =>
    axiosInstance.delete<T>(url, config).then((res) => res.data),
};

import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from "axios";

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";
const API_TIMEOUT = 30000; // 30 seconds

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second base delay
const retryCount = new Map<string, number>();

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
  credentialsClearer: () => void,
) => {
  getAuthToken = tokenGetter;
  clearAuthCredentials = credentialsClearer;
};

// Create Axios instance with default configuration
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    Accept: "application/json",
    // Note: Content-Type is NOT set here - axios will auto-detect:
    // - application/json for regular objects
    // - multipart/form-data for FormData (with proper boundary)
  },
});

// Request interceptor for adding auth token and retry tracking
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token using the getter function (from Redux store)
    let token = getAuthToken?.();

    // Fallback to localStorage/sessionStorage if Redux doesn't have it yet
    if (!token && typeof window !== "undefined") {
      token = localStorage.getItem("token") || sessionStorage.getItem("token");
    }

    // Add Authorization header if token exists
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Create unique request key for retry tracking
    const requestKey = `${config.method}:${config.url}`;
    if (!retryCount.has(requestKey)) {
      retryCount.set(requestKey, 0);
    }

    return config;
  },
  (error: AxiosError) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  },
);

// Response interceptor for handling errors and retries
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    // Clear retry count on success
    const requestKey = `${response.config.method}:${response.config.url}`;
    retryCount.delete(requestKey);

    return response;
  },
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const requestKey = `${originalRequest.method}:${originalRequest.url}`;
    const currentRetry = retryCount.get(requestKey) || 0;

    // Retry conditions: network errors, 5xx, 429 rate limit, 408 timeout
    const shouldRetry =
      !error.response ||
      (error.response?.status && error.response.status >= 500) ||
      error.response?.status === 429 ||
      error.response?.status === 408;

    if (shouldRetry && currentRetry < MAX_RETRIES) {
      retryCount.set(requestKey, currentRetry + 1);

      // Exponential backoff: delay = baseDelay * 2^retryCount
      const delay = RETRY_DELAY * Math.pow(2, currentRetry);

      if (process.env.NODE_ENV === "development") {
        console.warn(
          `[Axios Retry] Retrying ${requestKey} (attempt ${currentRetry + 1}/${MAX_RETRIES}) after ${delay}ms`,
        );
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
      return axiosInstance(originalRequest);
    }

    // Max retries reached or non-retryable error
    retryCount.delete(requestKey);

    // Handle specific error statuses
    if (error.response) {
      const { status } = error.response;

      // 401 Unauthorized - clear credentials and redirect
      if (status === 401) {
        clearAuthCredentials?.();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(
          new Error("Session expired. Please login again."),
        );
      }

      // 501 Session Timeout - clear credentials and redirect
      if (status === 501) {
        clearAuthCredentials?.();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(
          new Error("Session timeout. Please login to continue."),
        );
      }

      // 403 Forbidden
      if (status === 403) {
        return Promise.reject(
          new Error("Access denied. You don't have permission."),
        );
      }

      // 404 Not Found
      if (status === 404) {
        return Promise.reject(new Error("Resource not found."));
      }
    }

    // Handle other error responses
    const apiError: ApiError = {
      message:
        error.response?.data?.message || error.message || "An error occurred",
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
  },
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

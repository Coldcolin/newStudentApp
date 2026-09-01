import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { getStoredToken } from "@/lib/auth-storage";

// Types
export interface User {
  id: string;
  email: string;
  fullName: string;
  role: "admin" | "teacher" | "student";
  avatar?: string;
  stack?: string;
  bio?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Initialize auth from localStorage/sessionStorage
export const initializeAuth = createAsyncThunk("auth/initialize", async () => {
  if (typeof window === "undefined") {
    return null;
  }

  // Get token from storage (localStorage takes precedence)
  const token = getStoredToken();

  if (!token) {
    return null;
  }

  // Return token to be set in state
  return { token };
});

// Async thunks - These are placeholder thunks for demonstration
// In production, import authService dynamically or use RTK Query
export const loginUser = createAsyncThunk(
  "auth/login",
  async (
    credentials: { email: string; password: string },
    { rejectWithValue },
  ) => {
    try {
      // Simulated API call - replace with actual authService call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Demo response
      return {
        user: {
          id: "1",
          email: credentials.email,
          fullName: "Demo User",
          role: "admin" as const,
        },
        token: "demo-token",
        refreshToken: "demo-refresh",
      };
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("Login failed");
    }
  },
);

export const registerUser = createAsyncThunk(
  "auth/register",
  async (
    userData: {
      email: string;
      password: string;
      fullName: string;
      // lastName: string;
      role: "student" | "teacher";
    },
    { rejectWithValue },
  ) => {
    try {
      // Simulated API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return {
        user: {
          id: "1",
          email: userData.email,
          fullName: userData.fullName,
          role: userData.role as "admin" | "teacher" | "student",
        },
        token: "demo-token",
        refreshToken: "demo-refresh",
      };
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("Registration failed");
    }
  },
);

export const logoutUser = createAsyncThunk("auth/logout", async () => {
  return null;
});

export const refreshAccessToken = createAsyncThunk(
  "auth/refresh",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState };
      const refreshToken = state.auth.refreshToken;
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }
      // Simulated refresh
      return { token: "new-token", refreshToken: "new-refresh" };
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("Token refresh failed");
    }
  },
);

// Auth slice
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCredentials: (
      state,
      action: PayloadAction<{
        user: User;
        token: string;
        refreshToken: string;
      }>,
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
    },
    clearCredentials: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
      })
      // Refresh token
      .addCase(refreshAccessToken.fulfilled, (state, action) => {
        state.token = action.payload.token;
        if (action.payload.refreshToken) {
          state.refreshToken = action.payload.refreshToken;
        }
      })
      .addCase(refreshAccessToken.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
      })
      // Initialize auth from storage
      .addCase(initializeAuth.fulfilled, (state, action) => {
        if (action.payload?.token) {
          state.token = action.payload.token;
          state.refreshToken = action.payload.token;
          state.isAuthenticated = true;
        }
      });
  },
});

export const { clearError, setCredentials, clearCredentials, updateUser } =
  authSlice.actions;
export default authSlice.reducer;

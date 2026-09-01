import { configureStore, combineReducers } from "@reduxjs/toolkit";
import {
  persistReducer,
  createTransform,
  createMigrate,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import type { PersistConfig, PersistedState } from "redux-persist";
import storage from "redux-persist/lib/storage";
import authReducer, { AuthState } from "./slices/authSlice";
import userReducer from "./slices/userSlice";
import uiReducer from "./slices/uiSlice";

// Combine all reducers
const rootReducer = combineReducers({
  auth: authReducer,
  user: userReducer,
  ui: uiReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

type PersistedAuth = Omit<AuthState, "isLoading" | "error">;

// Keep transient auth fields out of localStorage.
// The `out` direction matters as much as `in`: the state reconciler hard sets
// whatever comes back for the `auth` key, so forcing the transient fields to
// their initial values here also heals blobs written before this transform
// existed - which would otherwise rehydrate a permanently stuck spinner.
const stripTransientAuth = createTransform<AuthState, PersistedAuth>(
  ({ isLoading, error, ...persisted }) => persisted,
  (persisted) => ({ ...persisted, isLoading: false, error: null }),
  { whitelist: ["auth"] },
);

// v2 drops the `user` slice from storage. A whitelist only filters writes - on
// rehydrate every key present in the blob is hard set - so already stored
// `user` data has to be removed here or it would linger forever. Returning
// state without the key leaves the reducer's initial state intact.
const migrations = {
  2: (state: PersistedState) => {
    if (!state) return state;
    const { user, ...rest } = state as PersistedState & { user?: unknown };
    return rest as PersistedState;
  },
};

// Persist configuration
const persistConfig: PersistConfig<RootState> = {
  key: "root",
  version: 2,
  storage,
  whitelist: ["auth"], // Only durable auth state is persisted
  transforms: [stripTransientAuth],
  migrate: createMigrate(migrations, { debug: false }),
};

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store with middleware
export const makeStore = () => {
  return configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        },
      }),
    devTools: process.env.NODE_ENV !== "production",
  });
};

// Infer types from store
export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore["dispatch"];

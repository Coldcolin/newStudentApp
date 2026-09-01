"use client";

import { useRef, useEffect } from "react";
import { Provider } from "react-redux";
import { persistStore } from "redux-persist";
import { PersistGate } from "redux-persist/integration/react";
import { makeStore, AppStore } from "@/lib/store";
import { setAuthHelpers } from "@/lib/api/axios";
import { clearStoredToken } from "@/lib/auth-storage";

interface ReduxProviderProps {
  children: React.ReactNode;
}

export function ReduxProvider({ children }: ReduxProviderProps) {
  const storeRef = useRef<AppStore | null>(null);
  const persistorRef = useRef<ReturnType<typeof persistStore> | null>(null);

  if (!storeRef.current) {
    // Create the store instance the first time this renders
    storeRef.current = makeStore();
    // Create persistor from the same store instance
    persistorRef.current = persistStore(storeRef.current);
  }

  const currentStore = storeRef.current;
  const currentPersistor = persistorRef.current!;

  // Set up auth helpers for axios
  useEffect(() => {
    setAuthHelpers(
      () => currentStore.getState().auth.token,
      () => {
        // Clear the raw token too - the request interceptor falls back to it
        // when Redux has none, so a stale key keeps requests authenticated.
        clearStoredToken();
        currentStore.dispatch({ type: "auth/clearCredentials" });
      },
    );
  }, [currentStore]);

  return (
    <Provider store={currentStore}>
      <PersistGate loading={<LoadingScreen />} persistor={currentPersistor}>
        {children}
      </PersistGate>
    </Provider>
  );
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#ffb703] border-t-transparent" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

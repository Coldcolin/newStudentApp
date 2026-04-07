"use client";

import { useRef, useEffect } from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor, makeStore, AppStore } from "@/lib/store";
import { setAuthHelpers } from "@/lib/api/axios";

interface ReduxProviderProps {
  children: React.ReactNode;
}

export function ReduxProvider({ children }: ReduxProviderProps) {
  const storeRef = useRef<AppStore>();

  if (!storeRef.current) {
    // Create the store instance the first time this renders
    storeRef.current = makeStore();
  }

  const currentStore = storeRef.current || store;

  // Set up auth helpers for axios - use action type directly to avoid circular import
  useEffect(() => {
    setAuthHelpers(
      () => currentStore.getState().auth.token,
      () => currentStore.dispatch({ type: "auth/clearCredentials" })
    );
  }, [currentStore]);

  return (
    <Provider store={currentStore}>
      <PersistGate loading={<LoadingScreen />} persistor={persistor}>
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

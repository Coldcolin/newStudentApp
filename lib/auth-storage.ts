const TOKEN_KEY = "token";

/**
 * Persist the raw token outside Redux so the axios request interceptor can
 * pick it up before the store has rehydrated. "Remember me" decides whether
 * it outlives the tab.
 */
export function storeToken(token: string, remember: boolean) {
  if (typeof window === "undefined") return;

  if (remember) {
    localStorage.setItem(TOKEN_KEY, token);
    sessionStorage.removeItem(TOKEN_KEY);
  } else {
    sessionStorage.setItem(TOKEN_KEY, token);
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

/**
 * Must run on every logout path. The axios interceptor falls back to these
 * keys when Redux has no token, so leaving them behind keeps requests
 * authenticated after the user has signed out.
 */
export function clearStoredToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
}

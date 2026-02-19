import { supabase } from "@/integrations/supabase/client";

/**
 * Gateway Auth Service — uses Supabase session tokens directly.
 *
 * Instead of maintaining a separate JWT issued by the gateway,
 * we pass the Supabase access_token to the gateway which validates
 * it using the Supabase JWT secret.
 */

// In-memory cache so synchronous getGatewayToken() can return a value.
// Updated whenever the auth state changes (SIGNED_IN event in useAuth)
// or when ensureGatewayAuth() is called.
let _cachedToken: string | null = null;

/**
 * Get a fresh Supabase access token from the current session.
 * Also refreshes token internally if it is close to expiry.
 */
async function getSupabaseAccessToken(): Promise<string | null> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      _cachedToken = session.access_token;
      return _cachedToken;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Ensure we have a valid token for gateway requests.
 * @param _email — kept for backward-compatible call-sites but now ignored.
 */
async function ensureGatewayAuth(_email?: string | null): Promise<string> {
  const token = await getSupabaseAccessToken();
  if (!token) throw new Error("No active session — please sign in");
  return token;
}

/**
 * Cache an already-known access token (called from useAuth on SIGNED_IN).
 */
function cacheToken(token: string) {
  _cachedToken = token;
}

function clearToken() {
  _cachedToken = null;
}

function isValid(): boolean {
  return _cachedToken !== null;
}

export const gatewayAuthService = {
  /** @deprecated — no longer calls the gateway; returns the Supabase token */
  signInToGateway: async (_email: string): Promise<string> => {
    return (await getSupabaseAccessToken()) ?? "";
  },
  ensureGatewayAuth,
  getGatewayToken: (): string | null => _cachedToken,
  clearGatewayToken: clearToken,
  isGatewayTokenValid: isValid,
  cacheToken,
};

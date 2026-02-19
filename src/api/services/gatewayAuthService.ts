const GATEWAY_URL = 'http://localhost:8000';

const TOKEN_KEY = 'gateway_access_token';
const EXPIRY_KEY = 'gateway_token_expiry';

function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function getStoredExpiry(): number | null {
  try {
    const raw = localStorage.getItem(EXPIRY_KEY);
    return raw ? parseInt(raw, 10) : null;
  } catch {
    return null;
  }
}

function setToken(token: string, expiresMsFromNow: number) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(EXPIRY_KEY, String(Date.now() + expiresMsFromNow));
  } catch {
    // ignore storage errors
  }
}

function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXPIRY_KEY);
  } catch {
    // ignore
  }
}

function isValid(): boolean {
  const token = getStoredToken();
  const exp = getStoredExpiry();
  if (!token || !exp) return false;
  return Date.now() < exp - 60_000; // 1 min skew
}

async function signInToGateway(email: string): Promise<string> {
  const resp = await fetch(`${GATEWAY_URL}/auth/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'demo' }),
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`Gateway sign-in failed (${resp.status}): ${text}`);
  }
  const data = await resp.json();
  const token = data?.access_token as string;
  if (!token) throw new Error('Gateway did not return access_token');
  // default 24h validity; gateway uses 24h in demo
  setToken(token, 24 * 60 * 60 * 1000);
  return token;
}

async function ensureGatewayAuth(email?: string | null): Promise<string> {
  if (isValid()) {
    const t = getStoredToken();
    if (t) return t;
  }
  if (!email) throw new Error('No user email available for Gateway auth');
  return await signInToGateway(email);
}

export const gatewayAuthService = {
  signInToGateway,
  ensureGatewayAuth,
  getGatewayToken: getStoredToken,
  clearGatewayToken: clearToken,
  isGatewayTokenValid: isValid,
};

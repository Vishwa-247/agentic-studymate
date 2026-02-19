
// Environment variables
export const API_GATEWAY_URL = import.meta.env.VITE_API_GATEWAY_URL || "http://localhost:8000";
export const ENABLE_ANALYTICS = import.meta.env.VITE_ENABLE_ANALYTICS === "true";

// Note: OPENAI_API_KEY is now securely managed through Supabase Edge Functions and secrets
// Do not use or reference it directly in client-side code

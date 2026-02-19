/**
 * StudyMate API Client
 * Centralized network layer - all API calls go through here.
 * 
 * DO NOT call fetch from components directly.
 * DO NOT add routing logic here - backend handles that.
 */

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

/**
 * Evaluate a user's answer via the Evaluator service.
 * This triggers LLM scoring and state aggregation.
 */
export async function evaluateAnswer(payload: {
  user_id: string;
  module: string;
  question: string;
  answer: string;
}): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE}/api/evaluate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  
  if (!res.ok) {
    console.error("Evaluation failed:", res.status, res.statusText);
    throw new Error("evaluation failed");
  }
  
  return res.json(); // always { status: "ok" }
}

/**
 * Get the next module for a user via the Orchestrator service.
 * Returns deterministic routing based on user's weakness scores.
 */
export async function getNextModule(user_id: string): Promise<{
  next_module: string;
  reason: string;
  description?: string;
}> {
  const res = await fetch(`${API_BASE}/api/next?user_id=${encodeURIComponent(user_id)}`);
  
  if (!res.ok) {
    console.error("Next module fetch failed:", res.status, res.statusText);
    throw new Error("next module fetch failed");
  }
  
  return res.json(); // { next_module, reason, description }
}

/**
 * Helper: Get or create persistent user ID for anonymous users.
 * Use this ONLY if Supabase auth is not available.
 */
export function getAnonymousUserId(): string {
  let userId = localStorage.getItem("studymate_user_id");
  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem("studymate_user_id", userId);
  }
  return userId;
}

/**
 * Submit answer and get routing in one call.
 * Use this for the typical submit → evaluate → route flow.
 */
export async function submitAndRoute(
  user_id: string,
  module: string,
  question: string,
  answer: string
): Promise<{ next_module: string; reason: string }> {
  // Step 1: Evaluate
  await evaluateAnswer({ user_id, module, question, answer });
  
  // Step 2: Get next module
  const routing = await getNextModule(user_id);
  
  return routing;
}

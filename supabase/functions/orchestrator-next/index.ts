/**
 * orchestrator-next — Unified Orchestrator Edge Function
 * ======================================================
 * SINGLE source of truth for "what should the user do next?"
 *
 * Decision pipeline:
 *   1. Auth → get user
 *   2. Check onboarding status
 *   3. Fetch user_state (weakness scores from evaluator)
 *   4. Fetch onboarding preferences (target_role, focus)
 *   5. Fetch latest interview metrics
 *   6. Deterministic rule engine (weakness dimensions)
 *   7. LLM reasoning via Groq (explains WHY — Decision 2)
 *   8. Log decision → orchestrator_decisions
 *   9. Update user_state
 *   10. Return to frontend
 *
 * Module names align with frontend MODULE_CONFIG:
 *   production_interview, interactive_course, dsa_practice,
 *   resume_builder, project_studio, onboarding
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── CORS ─────────────────────────────────────────────────────────

const getCorsHeaders = (req: Request) => {
  const origin = req.headers.get("origin") || "";
  const isAllowed =
    origin === "https://lovable.app" ||
    origin.endsWith(".lovable.app") ||
    origin.startsWith("http://localhost:") ||
    origin.startsWith("http://127.0.0.1:");

  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : "https://lovable.app",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods":
      "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  };
};

// ── Types ────────────────────────────────────────────────────────

interface NextResponse {
  next_module: string;
  depth: number;
  reason: string;
  description: string;
  weakness_trigger: string | null;
  scores: Record<string, number | null> | null;
}

interface WeaknessScores {
  clarity_avg: number;
  tradeoff_avg: number;
  adaptability_avg: number;
  failure_awareness_avg: number;
  dsa_predict_skill: number;
}

// ── Helpers ──────────────────────────────────────────────────────

function safeNumber(val: unknown, fallback = 1.0): number {
  if (val === null || val === undefined) return fallback;
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeOverallScore(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  return n <= 1 ? n * 100 : n;
}

// ── Deterministic Rule Engine ────────────────────────────────────
// Matches frontend MODULE_CONFIG keys exactly.

const WEAKNESS_THRESHOLD = 0.4;

interface RuleResult {
  next_module: string;
  weakness_trigger: string | null;
  reason: string;
  description: string;
  depth: number;
}

/**
 * MODULE MAPPING (aligned with frontend OrchestratorCard MODULE_CONFIG):
 *
 * | Weakness Dimension     | Module ID              | Route              | Rationale                              |
 * |------------------------|------------------------|--------------------|----------------------------------------|
 * | Low clarity            | production_interview   | /mock-interview    | Interview drills improve communication |
 * | Low tradeoffs          | interactive_course     | /course-generator  | System design courses teach tradeoffs  |
 * | Low adaptability       | production_interview   | /mock-interview    | Curveball questions build adaptability |
 * | Low failure_awareness  | interactive_course     | /course-generator  | Courses on failure modes & edge cases  |
 * | Low DSA                | dsa_practice           | /dsa-sheet         | Direct DSA practice                    |
 * | All healthy            | project_studio         | /project-studio    | Apply knowledge to real projects       |
 */
function runRules(
  scores: WeaknessScores,
  hasInterviewData: boolean,
  interviewScore: number | null
): RuleResult {
  const { clarity_avg, tradeoff_avg, adaptability_avg, failure_awareness_avg, dsa_predict_skill } = scores;

  // Rule 1: Low clarity → production_interview (clarification drills)
  if (clarity_avg < WEAKNESS_THRESHOLD) {
    return {
      next_module: "production_interview",
      weakness_trigger: "clarity_avg",
      reason: `Your clarity score (${clarity_avg.toFixed(2)}) needs improvement. Practice articulating your thinking clearly.`,
      description: "Mock Interview — focus on clear communication and structured answers.",
      depth: clarity_avg < 0.2 ? 2 : 1,
    };
  }

  // Rule 2: Low tradeoffs → interactive_course (system design learning)
  if (tradeoff_avg < WEAKNESS_THRESHOLD) {
    return {
      next_module: "interactive_course",
      weakness_trigger: "tradeoff_avg",
      reason: `Your tradeoff awareness (${tradeoff_avg.toFixed(2)}) is below target. Learn to weigh alternatives and consequences.`,
      description: "Interactive Course — system design concepts and tradeoff analysis.",
      depth: tradeoff_avg < 0.2 ? 2 : 1,
    };
  }

  // Rule 3: Low adaptability → production_interview (curveball training)
  if (adaptability_avg < WEAKNESS_THRESHOLD) {
    return {
      next_module: "production_interview",
      weakness_trigger: "adaptability_avg",
      reason: `Your adaptability score (${adaptability_avg.toFixed(2)}) suggests difficulty with curveball questions. Practice thinking on your feet.`,
      description: "Mock Interview — curveball scenarios and constraint-change drills.",
      depth: adaptability_avg < 0.2 ? 2 : 1,
    };
  }

  // Rule 4: Low failure awareness → interactive_course (failure modes)
  if (failure_awareness_avg < WEAKNESS_THRESHOLD) {
    return {
      next_module: "interactive_course",
      weakness_trigger: "failure_awareness_avg",
      reason: `Your failure awareness (${failure_awareness_avg.toFixed(2)}) needs work. Study edge cases and failure mode analysis.`,
      description: "Interactive Course — failure modes, edge cases, and resilience patterns.",
      depth: failure_awareness_avg < 0.2 ? 2 : 1,
    };
  }

  // Rule 5: Low DSA → dsa_practice
  if (dsa_predict_skill < WEAKNESS_THRESHOLD) {
    return {
      next_module: "dsa_practice",
      weakness_trigger: "dsa_predict_skill",
      reason: `Your DSA skill prediction (${dsa_predict_skill.toFixed(2)}) is low. Strengthen your algorithm fundamentals.`,
      description: "DSA Practice — work through problems and use the AI chatbot for hints.",
      depth: dsa_predict_skill < 0.2 ? 2 : 1,
    };
  }

  // Rule 6: No interview data yet → production_interview (get baseline)
  if (!hasInterviewData) {
    return {
      next_module: "production_interview",
      weakness_trigger: null,
      reason: "No interview metrics yet. Complete a mock interview so the system can measure your production-thinking skills.",
      description: "Mock Interview — establish your baseline scores across all dimensions.",
      depth: 1,
    };
  }

  // Rule 7: Interview score below target → production_interview (repeat)
  if (interviewScore !== null && interviewScore < 60) {
    return {
      next_module: "production_interview",
      weakness_trigger: null,
      reason: `Your last interview score was ${interviewScore.toFixed(0)}%. Practice deeper prompts to push past the 60% threshold.`,
      description: "Mock Interview — go deeper on tradeoffs, failure modes, and scalability.",
      depth: 2,
    };
  }

  // Rule 8: All healthy → project_studio
  return {
    next_module: "project_studio",
    weakness_trigger: null,
    reason: "All your metrics look strong! Apply your skills to a real project.",
    description: "Project Studio — build something real with multi-agent guidance.",
    depth: 1,
  };
}

// ── LLM Reasoning (Groq) ────────────────────────────────────────

async function generateLLMReason(
  ruleResult: RuleResult,
  scores: WeaknessScores,
  targetRole: string | null,
  focusAreas: string[] | null
): Promise<string> {
  const groqApiKey = Deno.env.get("GROQ_API_KEY");
  if (!groqApiKey) {
    // Fallback to deterministic reason
    return ruleResult.reason;
  }

  const scoresStr = Object.entries(scores)
    .map(([k, v]) => `${k}: ${v.toFixed(2)}`)
    .join(", ");

  const contextParts = [`Scores: ${scoresStr}`];
  if (targetRole) contextParts.push(`Target role: ${targetRole}`);
  if (focusAreas?.length) contextParts.push(`Focus areas: ${focusAreas.join(", ")}`);

  const prompt = `You are a career coach for a student using StudyMate, an AI learning platform.
The orchestrator just chose "${ruleResult.next_module}" because: ${ruleResult.reason}
${contextParts.join("\n")}

Write 2 concise sentences:
1) What specific pattern you noticed in their data
2) Why this module will help them improve

Be specific, encouraging, and mention their target role if available.
No preamble, no bullet points — just the 2 sentences.`;

  try {
    const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 150,
      }),
    });

    if (!resp.ok) {
      console.error(`Groq error ${resp.status}: ${await resp.text()}`);
      return ruleResult.reason;
    }

    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content?.trim();
    return content || ruleResult.reason;
  } catch (err) {
    console.error("Groq LLM reasoning failed:", err);
    return ruleResult.reason;
  }
}

// ── Main Handler ─────────────────────────────────────────────────

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    const authHeader = req.headers.get("Authorization") || "";
    const sb = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // ── 1. Authenticate ──────────────────────────────────────────
    const {
      data: { user },
      error: userErr,
    } = await sb.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── 2. Parallel data fetch ───────────────────────────────────
    const [onboardingRes, stateRes, metricsRes, onboardingDataRes] =
      await Promise.all([
        // Onboarding completion
        sb
          .from("user_onboarding")
          .select("completed_at")
          .eq("user_id", user.id)
          .maybeSingle(),

        // User weakness scores (populated by evaluator pipeline)
        sb
          .from("user_state")
          .select(
            "clarity_avg, tradeoff_avg, adaptability_avg, failure_awareness_avg, dsa_predict_skill, next_module, last_module"
          )
          .eq("user_id", user.id)
          .maybeSingle(),

        // Latest interview metrics
        sb
          .from("interview_metrics")
          .select("overall_score, created_at, session_id")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1),

        // Onboarding preferences (target_role, focus areas)
        sb
          .from("user_onboarding")
          .select("target_role, experience_level, learning_goals")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

    const onboardingCompleted = !!onboardingRes.data?.completed_at;
    const latestMetrics = metricsRes.data?.[0];
    const latestOverall = normalizeOverallScore(latestMetrics?.overall_score);
    const hasInterviewData = latestMetrics !== undefined && latestMetrics !== null;

    // Parse onboarding preferences
    const targetRole: string | null = onboardingDataRes.data?.target_role ?? null;
    const learningGoals: string[] | null = (() => {
      const raw = onboardingDataRes.data?.learning_goals;
      if (Array.isArray(raw)) return raw;
      if (typeof raw === "string") {
        try { return JSON.parse(raw); } catch { return [raw]; }
      }
      return null;
    })();

    // Parse weakness scores (default 1.0 = healthy for new users)
    const scores: WeaknessScores = {
      clarity_avg: safeNumber(stateRes.data?.clarity_avg, 1.0),
      tradeoff_avg: safeNumber(stateRes.data?.tradeoff_avg, 1.0),
      adaptability_avg: safeNumber(stateRes.data?.adaptability_avg, 1.0),
      failure_awareness_avg: safeNumber(stateRes.data?.failure_awareness_avg, 1.0),
      dsa_predict_skill: safeNumber(stateRes.data?.dsa_predict_skill, 1.0),
    };

    // ── 3. Decision pipeline ─────────────────────────────────────

    let decision: NextResponse;

    if (!onboardingCompleted) {
      // Gate: Must onboard first
      decision = {
        next_module: "onboarding",
        depth: 1,
        reason:
          "Complete your onboarding so StudyMate can personalize your learning path based on your goals and experience.",
        description:
          "Answer a few quick questions about your background and goals.",
        weakness_trigger: null,
        scores: null,
      };
    } else {
      // Run deterministic rule engine on weakness dimensions
      const ruleResult = runRules(scores, hasInterviewData, latestOverall);

      // Generate LLM explanation (non-blocking best-effort)
      const llmReason = await generateLLMReason(
        ruleResult,
        scores,
        targetRole,
        learningGoals
      );

      decision = {
        next_module: ruleResult.next_module,
        depth: ruleResult.depth,
        reason: llmReason,
        description: ruleResult.description,
        weakness_trigger: ruleResult.weakness_trigger,
        scores,
      };
    }

    // ── 4. Build input snapshot for audit log ─────────────────────
    const inputSnapshot = {
      onboarding_completed: onboardingCompleted,
      target_role: targetRole,
      scores,
      latest_interview_overall_score: latestOverall,
      latest_interview_session_id: latestMetrics?.session_id ?? null,
      weakness_trigger: decision.weakness_trigger,
    };

    // ── 5. Persist decision + update state (parallel, best-effort)
    await Promise.allSettled([
      sb.from("orchestrator_decisions").insert({
        user_id: user.id,
        input_snapshot: inputSnapshot,
        next_module: decision.next_module,
        depth: decision.depth,
        reason: decision.reason,
      }),

      sb.from("user_state").upsert(
        {
          user_id: user.id,
          onboarding_completed: onboardingCompleted,
          next_module: decision.next_module,
          last_module: decision.next_module,
          last_seen_at: new Date().toISOString(),
          last_interview_session_id: latestMetrics?.session_id ?? null,
          last_interview_overall_score: latestOverall,
        },
        { onConflict: "user_id" }
      ),
    ]);

    // ── 6. Return ────────────────────────────────────────────────
    return new Response(JSON.stringify(decision), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("orchestrator-next error", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});

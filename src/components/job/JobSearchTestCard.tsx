import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Loader2 } from "lucide-react";

type JobMatch = {
  title: string;
  company: string;
  url: string;
  match_score: number;
  reasoning: string;
};

type TestStatus = "idle" | "ok" | "not_configured" | "error";

function getGatewayToken(): string | null {
  try {
    return localStorage.getItem("gateway_access_token");
  } catch {
    return null;
  }
}

export default function JobSearchTestCard() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<TestStatus>("idle");
  const [message, setMessage] = useState<string>("");
  const [matches, setMatches] = useState<JobMatch[]>([]);

  const badge = useMemo(() => {
    switch (status) {
      case "ok":
        return <Badge>Ready</Badge>;
      case "not_configured":
        return <Badge variant="secondary">Not configured</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Idle</Badge>;
    }
  }, [status]);

  const runTest = async () => {
    setLoading(true);
    setStatus("idle");
    setMessage("");
    setMatches([]);

    try {
      const token = getGatewayToken();
      const resp = await fetch("http://localhost:8000/api/job-search/search-and-match", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          query: "Frontend Engineer jobs",
          resume_text: "",
          limit: 3,
        }),
      });

      const json = await resp.json().catch(() => ({}));

      if (!resp.ok) {
        const detail = String(json?.detail || json?.message || "Job Search request failed");
        const lower = detail.toLowerCase();
        if (lower.includes("api key") && lower.includes("not") && lower.includes("configured")) {
          setStatus("not_configured");
          setMessage(detail);
          return;
        }
        setStatus("error");
        setMessage(detail);
        return;
      }

      setStatus("ok");
      setMessage("Job Search is reachable.");
      setMatches((json?.matches as JobMatch[]) || []);
    } catch (e: any) {
      setStatus("error");
      setMessage(e?.message || "Network error calling Job Search");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              Job Search Test
            </CardTitle>
            <CardDescription>
              Confirms the Job Search agent endpoint is reachable and responds safely.
            </CardDescription>
          </div>
          {badge}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button onClick={runTest} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {loading ? "Testing..." : "Run test"}
        </Button>

        {message ? <div className="text-sm text-muted-foreground">{message}</div> : null}

        {status === "not_configured" ? (
          <div className="rounded-lg border bg-muted/20 p-3 text-sm text-muted-foreground">
            This is OK for demos: Job Search needs API keys in the Python service environment
            (e.g., Firecrawl/Groq). The UI will remain stable.
          </div>
        ) : null}

        {status === "ok" && matches.length > 0 ? (
          <div className="space-y-2">
            <div className="text-sm font-medium text-foreground">Sample results</div>
            <div className="space-y-2">
              {matches.map((m, idx) => (
                <div key={idx} className="rounded-lg border bg-muted/10 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium text-foreground">{m.title}</div>
                      <div className="text-sm text-muted-foreground">{m.company}</div>
                    </div>
                    <Badge variant={m.match_score >= 75 ? "default" : "secondary"}>
                      {m.match_score}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

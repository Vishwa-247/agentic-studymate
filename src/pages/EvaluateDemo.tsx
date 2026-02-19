import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { submitAndRoute, getAnonymousUserId } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ArrowRight, CheckCircle2, AlertCircle, RefreshCcw } from "lucide-react";

export default function EvaluateDemo() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [answer, setAnswer] = useState("I would prioritize clarity by breaking down the problem into smaller functions, ensuring variable names are descriptive. Before optimizing for time complexity, I'd ensure the solution is correct and readable for the team.");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ next_module: string; reason: string } | null>(null);
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    if (user?.id) {
      setUserId(user.id);
    } else {
      setUserId(getAnonymousUserId());
    }
  }, [user]);

  const handleSubmit = async () => {
    setLoading(true);
    setResult(null);
    try {
      const routing = await submitAndRoute(
        userId,
        "demo_module",
        "How do you balance code clarity vs performance?",
        answer
      );
      setResult(routing);
    } catch (e) {
      console.error(e);
      alert("Error submitting. Check console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <div className="container max-w-4xl mx-auto px-4 py-20 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
             Evaluator <span className="text-primary">Agents</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Autonomous evaluation engine. Analysis of 5 technical dimensions with intelligent routing.
          </p>
        </div>

        {/* Main Interface */}
        <div className="grid md:grid-cols-2 gap-8 items-start">
          
          {/* Input Card */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl border border-border bg-card shadow-sm relative group">
              <div className="relative">
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-xs text-primary">1</span>
                  Interview Question
                </h3>
                <p className="text-lg font-medium text-foreground/80 mb-6">
                  "How do you balance code clarity vs performance in a production environment?"
                </p>
                
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Your Answer</label>
                  <Textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    className="min-h-[200px] resize-none bg-muted/30 border-border focus:border-primary/50 text-foreground text-base p-4 rounded-xl"
                    placeholder="Type your answer here..."
                  />
                </div>

                <div className="mt-6">
                  <Button 
                    onClick={handleSubmit} 
                    disabled={loading}
                    className="w-full h-12 text-base font-semibold shadow-sm transition-all duration-300 transform hover:scale-[1.02]"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Evaluating...
                      </>
                    ) : (
                      <>
                        Submit & Analyze <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="text-center text-sm text-muted-foreground">
              User ID: <code className="bg-muted px-2 py-1 rounded text-xs">{userId.slice(0, 8)}...</code>
            </div>
          </div>

          {/* Results Card */}
          <div className="space-y-6">
            {!result && !loading && (
              <div className="h-full flex flex-col items-center justify-center p-10 rounded-2xl border border-border bg-card shadow-sm text-center text-muted-foreground space-y-4 min-h-[400px]">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <RefreshCcw className="w-6 h-6 opacity-30" />
                </div>
                <p>Waiting for submission...</p>
                <div className="text-xs max-w-xs opacity-50">
                  Engine will analyze: Clarity, Tradeoffs, Adaptability, Failure Awareness, DSA Prediction
                </div>
              </div>
            )}

            {loading && (
              <div className="h-full flex flex-col items-center justify-center p-10 rounded-2xl border border-border bg-card shadow-sm text-center space-y-6 min-h-[400px]">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full border-4 border-muted border-t-primary animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center font-bold text-xs text-primary">AI</div>
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-medium animate-pulse">Orchestrating...</p>
                  <p className="text-sm text-muted-foreground">Evaluating 5 dimensions</p>
                </div>
              </div>
            )}

            {result && (
              <div className="rounded-2xl border border-green-500/30 bg-green-500/5 backdrop-blur-xl overflow-hidden animate-fade-in-up shadow-xl">
                <div className="p-1 bg-gradient-to-r from-green-500/50 to-emerald-600/50"></div>
                <div className="p-8 space-y-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-2xl font-bold mb-1">Analysis Complete</h3>
                      <p className="text-green-400 text-sm font-medium flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> Orchestrator Decision
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Status</div>
                      <div className="font-mono font-bold text-green-400">ROUTED</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-card border border-border space-y-3">
                    <div className="flex justify-between items-center border-b border-border pb-2">
                      <span className="text-muted-foreground text-sm">Next Module</span>
                      <span className="text-primary font-mono font-bold text-lg">{result.next_module}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-muted-foreground text-xs uppercase tracking-wider">Reasoning</span>
                      <p className="text-sm text-foreground/80 leading-relaxed">
                        {result.reason}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <AlertCircle className="w-5 h-5 text-primary shrink-0" />
                    <div className="text-sm">
                      <span className="text-primary font-medium">Note:</span>
                      <span className="text-muted-foreground ml-1">
                        In production, you'd be redirected to <code className="text-primary">{`/modules/${result.next_module}`}</code>.
                      </span>
                    </div>
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                        setResult(null); 
                        setAnswer("");
                    }}
                  >
                    Reset Demo
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

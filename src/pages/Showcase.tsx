import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Bot, 
  CheckCircle, 
  ExternalLink, 
  LayoutDashboard, 
  Link as LinkIcon, 
  PlayCircle, 
  Search, 
  ShieldCheck,
  Cpu,
  Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import BackendHealthCheck from '@/components/debug/BackendHealthCheck';
import OrchestratorCard from '@/components/OrchestratorCard';
import { useAuth } from '@/hooks/useAuth';
import { gatewayAuthService } from '@/api/services/gatewayAuthService';

const ShowcasePage: React.FC = () => {
  const { user } = useAuth();
  const [testingJobSearch, setTestingJobSearch] = useState(false);
  const [jobSearchResult, setJobSearchResult] = useState<{ success: boolean; message: string } | null>(null);

  const testJobSearch = async () => {
    setTestingJobSearch(true);
    setJobSearchResult(null);
    try {
      const token = gatewayAuthService.getGatewayToken();
      if (!token) {
        setJobSearchResult({ 
          success: false, 
          message: 'Gateway token missing. Please sign in to gateway first.' 
        });
        return;
      }

      const response = await fetch('http://localhost:8000/api/job-search/search-and-match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          query: 'Software Engineer',
          resume_text: 'Demo resume text',
          limit: 1
        })
      });

      if (response.ok) {
        setJobSearchResult({ success: true, message: 'Job Search Agent is ONLINE and responding.' });
      } else {
        const errorData = await response.json().catch(() => ({}));
        setJobSearchResult({ 
          success: false, 
          message: errorData.detail || `Service responded with ${response.status}` 
        });
      }
    } catch (error: any) {
      setJobSearchResult({ success: false, message: `Connection failed: ${error.message}` });
    } finally {
      setTestingJobSearch(false);
    }
  };

  return (
    <div className="container max-w-7xl py-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-transparent">
            Agentic Showcase
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Technical Mission Control for the Agentic-Studymate platform. 
            Monitor agent readiness, trace decision logs, and verify the closed-loop system.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1 border-primary/20 bg-primary/5 text-primary">
            <Cpu className="w-3.5 h-3.5 mr-1.5" />
            Deterministic Agentic v1.0
          </Badge>
          <Badge variant="outline" className="px-3 py-1 border-indigo-400/20 bg-indigo-400/5 text-indigo-400">
            <Zap className="w-3.5 h-3.5 mr-1.5" />
            Live Demo Mode
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: System Status & Health */}
        <div className="lg:col-span-5 space-y-8">
          <BackendHealthCheck />
          
          <Card className="glassmorphism-card border-primary/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                Proof of Agentic Loop
              </CardTitle>
              <CardDescription>
                How the platform makes autonomous decisions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed">
              <div className="p-3 rounded-lg bg-orange-500/5 border border-orange-500/20 text-orange-700 dark:text-orange-400">
                <p className="font-semibold mb-1 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Deterministic Re-planning
                </p>
                The Orchestrator doesn't just "show" content. It captures user tokens, queries a decision engine, and re-routes the next action based on state changes.
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Telemetry: Every decision is logged for auditing.
                </div>
                <div className="flex items-center gap-2 font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Context-Awareness: Reads from Long-term Memory.
                </div>
                <div className="flex items-center gap-2 font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  State Machine: Interview flows are strictly stateful.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Active Components & Verification */}
        <div className="lg:col-span-7 space-y-8">
          <Tabs defaultValue="orchestrator" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6 bg-muted/50 p-1 border">
              <TabsTrigger value="orchestrator" className="gap-2">
                <Bot className="w-4 h-4" /> Orchestrator
              </TabsTrigger>
              <TabsTrigger value="resume" className="gap-2">
                <Search className="w-4 h-4" /> Resilience
              </TabsTrigger>
              <TabsTrigger value="links" className="gap-2">
                <LinkIcon className="w-4 h-4" /> Demo Links
              </TabsTrigger>
            </TabsList>

            <TabsContent value="orchestrator" className="space-y-6 mt-0">
              <div className="animate-in slide-in-from-right-4 duration-300">
                <OrchestratorCard userId={user?.id || ''} />
                <p className="mt-4 text-xs text-center text-muted-foreground italic">
                  Note: In demo mode, decision logic favors 'Interview Journey' if metrics are missing.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="resume" className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Capabilities Verification</CardTitle>
                  <CardDescription>Verify complex features without full workflows.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Job Search Test */}
                  <div className="p-4 rounded-xl border bg-muted/30 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-semibold">Job Search Agent Connectivity</p>
                        <p className="text-xs text-muted-foreground">Tests Firecrawl/Groq capability via Gateway.</p>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={testJobSearch} 
                        disabled={testingJobSearch}
                        className="shadow-sm"
                      >
                        {testingJobSearch ? 'Testing...' : 'Test Connection'}
                      </Button>
                    </div>

                    {jobSearchResult && (
                      <div className={`p-3 rounded-lg text-sm flex items-start gap-2 animate-in zoom-in-95 duration-200 ${
                        jobSearchResult.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {jobSearchResult.success ? <CheckCircle className="w-4 h-4 mt-0.5" /> : <Zap className="w-4 h-4 mt-0.5" />}
                        {jobSearchResult.message}
                      </div>
                    )}
                  </div>

                  {/* Fallback Explanation */}
                  <div className="p-4 rounded-xl border border-dashed border-muted-foreground/30 space-y-2">
                    <p className="font-medium text-sm">Resilience Strategy</p>
                    <ul className="text-xs text-muted-foreground space-y-1.5 list-disc pl-4">
                      <li>Unified Gateway Strategy: All Python calls route through Port 8000.</li>
                      <li>Graceful UI Fallbacks: Matches are hidden, not crashed, if keys missing.</li>
                      <li>Deterministic Defaults: System falls back to baseline tasks if brain is offline.</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="links" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: 'Auth Flow', path: '/auth', icon: ShieldCheck, color: 'text-blue-500' },
                  { label: 'Onboarding', path: '/onboarding', icon: PlayCircle, color: 'text-green-500' },
                  { label: 'Main Dashboard', path: '/dashboard', icon: LayoutDashboard, color: 'text-purple-500' },
                  { label: 'Interview Coach', path: '/interview-journey', icon: Bot, color: 'text-orange-500' },
                  { label: 'Resume Analyzer', path: '/resume-analyzer', icon: Search, color: 'text-indigo-500' },
                  { label: 'Project Studio', path: '/project-studio', icon: Cpu, color: 'text-pink-500' },
                ].map((link) => (
                  <Link 
                    key={link.path} 
                    to={link.path}
                    className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-muted/50 transition-all hover:shadow-md group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-background border ${link.color}`}>
                        <link.icon className="w-5 h-5" />
                      </div>
                      <span className="font-medium">{link.label}</span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ShowcasePage;

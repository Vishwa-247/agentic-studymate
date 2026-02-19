import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, 
  Sparkles, 
  Brain, 
  Code2, 
  Target, 
  BarChart3, 
  Users,
  CheckCircle2,
  Play,
  BookOpen,
  MessageSquare
} from "lucide-react";
import TerminalDemo from "@/components/landing/TerminalDemo";
import DSAVisualizerDemo from "@/components/landing/DSAVisualizerDemo";
import InterviewChatDemo from "@/components/landing/InterviewChatDemo";
import ProjectStudioDemo from "@/components/landing/ProjectStudioDemo";
import SystemFlowDemo from "@/components/landing/SystemFlowDemo";

export default function Index() {
  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-x-hidden">


      {/* Hero Section */}
      <section className="relative pt-32 pb-32 px-6 z-10">
        <div className="container max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Left - Copy */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold uppercase tracking-wider mb-6">
                <Sparkles className="h-3 w-3" />
                <span>Agentic Learning Platform</span>
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
                Think Like a{" "}
                <span className="relative inline-block text-primary">
                  Senior Engineer
                  <svg
                    className="absolute -bottom-2 w-full h-3 text-primary/40 -z-10 left-0"
                    viewBox="0 0 100 10"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                     <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="3" fill="none" />
                  </svg>
                </span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-lg mx-auto lg:mx-0">
                An agentic platform that questions your decisions, challenges assumptions, and adapts to build production-grade thinking.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/auth">
                  <Button size="lg" className="h-14 px-8 text-base rounded-full shadow-glow">
                    Start Free <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/evaluate-demo">
                  <Button variant="outline" size="lg" className="h-14 px-8 text-base rounded-full">
                    <Play className="mr-2 h-4 w-4" /> Watch Demo
                  </Button>
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="mt-10 flex items-center gap-6 justify-center lg:justify-start text-muted-foreground text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>No credit card</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Free tier available</span>
                </div>
              </div>
            </div>

            {/* Right - Terminal Demo */}
            <div className="relative matte-texture">
              <TerminalDemo />
              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-primary/20 blur-3xl rounded-full -z-10" />
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* Module 1: How It Works - System Flow */}
      <section className="py-32 px-6">
        <div className="container max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold mb-6">
                <Brain className="h-3 w-3" />
                <span>Module 1: Agent Orchestrator</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                How <span className="text-primary italic">StudyMate</span> Works
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                Unlike static courses, our AI orchestrator continuously analyzes your thinking patterns and adapts your learning path in real-time.
              </p>
              <ul className="space-y-3">
                {["You set your career goal", "System detects your weak areas", "AI chooses the right module", "Questions you, adapts, repeats"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">{i + 1}</div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="matte-texture">
              <SystemFlowDemo />
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* Module 2: Interactive Courses */}
      <section className="py-32 px-6 bg-muted/20">
        <div className="container max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 matte-texture">
              <InterviewChatDemo />
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold mb-6">
                <BookOpen className="h-3 w-3" />
                <span>Module 2: Interactive Courses</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                No More <span className="text-primary italic">Passive Learning</span>
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                Every lesson starts with a scenario. You make a decision. The AI explains why you're right or wrong, then throws a curveball.
              </p>
              <ul className="space-y-3">
                {["Scenario → Decision → Explanation", "Failure injection to test resilience", "Branching paths based on your choices"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-muted-foreground">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* Module 3: Project Studio */}
      <section className="py-32 px-6">
        <div className="container max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold mb-6">
                <Users className="h-3 w-3" />
                <span>Module 3: Project Studio</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Multi-Agent <span className="text-primary italic">Collaboration</span>
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                Simulate a real software company. 5 specialist AI agents collaborate to turn your vague idea into a production-grade project plan.
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { name: "Idea Analyst", desc: "Questions your assumptions" },
                  { name: "Researcher", desc: "Finds gaps & competition" },
                  { name: "System Design", desc: "Creates architecture" },
                  { name: "UI/UX Agent", desc: "Plans screens & flow" },
                  { name: "Planner", desc: "Creates weekly milestones" },
                ].map((agent, i) => (
                  <div key={i} className="p-3 rounded-lg bg-card border border-border/60 matte-texture">
                    <p className="font-semibold text-foreground">{agent.name}</p>
                    <p className="text-xs text-muted-foreground">{agent.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="matte-texture">
              <ProjectStudioDemo />
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* Module 4: Production Interview */}
      <section className="py-32 px-6 bg-muted/20">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold mb-6">
              <MessageSquare className="h-3 w-3" />
              <span>Module 4: Production Thinking Interviews</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Interview Like It's <span className="text-primary italic">Real</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-12">
              Not mock Q&A. Our AI asks follow-ups, throws curveballs, and evaluates your clarification habits—just like a FAANG interviewer.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-center mb-12">
            {[
              { metric: "Clarification", desc: "Do you ask first?" },
              { metric: "Structure", desc: "Clear thinking" },
              { metric: "Trade-offs", desc: "Pros/cons awareness" },
              { metric: "Scalability", desc: "Beyond small scale" },
              { metric: "Failure", desc: "What breaks?" },
              { metric: "Adaptability", desc: "Adjust after feedback" },
            ].map((item, i) => (
              <div key={i} className="p-4 rounded-xl bg-card border border-border/60 matte-texture">
                <p className="text-lg font-bold text-primary mb-1">{item.metric}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Interactive Demo for this section */}
          <div className="max-w-3xl mx-auto matte-texture">
            <TerminalDemo />
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* Module 5: DSA Visualizer */}
      <section className="py-32 px-6">
        <div className="container max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 matte-texture">
              <DSAVisualizerDemo />
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold mb-6">
                <Code2 className="h-3 w-3" />
                <span>Module 5: DSA Visualizer</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                See Algorithms <span className="text-primary italic">Come Alive</span>
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                Understanding code ≠ understanding algorithm. Watch step-by-step, predict the next move, and build deep intuition.
              </p>
              <ul className="space-y-3">
                {["Visual step-by-step execution", "Pause & predict challenges", "Pattern recognition training"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-muted-foreground">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* Module 6: Career Tracker */}
      <section className="py-32 px-6 bg-muted/20">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold mb-6">
              <BarChart3 className="h-3 w-3" />
              <span>Module 6: Career Intelligence</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Track Your <span className="text-primary italic">Growth</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              We analyze your thinking patterns across all modules. See where you're improving and where you need more practice.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            {[
              { value: "Learning", label: "Growth Tracked" },
              { value: "Interview", label: "Thinking Score" },
              { value: "DSA", label: "Pattern Mastery" },
              { value: "Weak", label: "Areas Flagged" },
            ].map((stat, i) => (
              <div key={i} className="p-6 rounded-2xl bg-card border border-border/60 text-center matte-texture">
                <div className="text-2xl font-bold mb-1 text-primary">{stat.value}</div>
                <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Interactive Demo - Career Progress */}
          <div className="max-w-3xl mx-auto p-8 rounded-2xl bg-card border border-border matte-texture">
            <div className="space-y-6">
              {[
                { skill: "System Design", progress: 75, trend: "+12% this week" },
                { skill: "DSA Patterns", progress: 60, trend: "+8% this week" },
                { skill: "Clarification Habit", progress: 85, trend: "+5% this week" },
              ].map((item, i) => (
                <div key={i}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">{item.skill}</span>
                      <span className="text-xs text-primary">{item.trend}</span>
                    </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-1000"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* Final CTA - LIGHT */}
      <section className="py-32 px-6">
        <div className="container max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Ready to think like an engineer?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto">
            Join thousands of engineers who are training smarter, not harder.
          </p>
          <Link to="/auth">
            <Button size="lg" className="h-14 px-10 text-lg rounded-full shadow-glow">
              Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          
          {/* Stats */}
          <div className="mt-16 flex flex-wrap justify-center gap-12 text-center">
            {[
              { value: "500+", label: "Problems" },
              { value: "50+", label: "Companies" },
              { value: "24/7", label: "AI Mentor" },
              { value: "6", label: "Modules" },
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
                <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}


import { ArrowRight, Cpu, Video, Mic, Bot, Calendar, Sparkles, FileVideo, AreaChart } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Container from "@/components/ui/Container";
import GlassMorphism from "@/components/ui/GlassMorphism";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";

const FutureIntegrations = () => {
  const upcomingFeatures = [
    {
      icon: <Video className="h-12 w-12 text-primary" />,
      title: "Real-time Video Analysis",
      description: "Advanced AI technology analyzes your facial expressions, body language, and gestures during mock interviews to provide insights on your non-verbal communication.",
      status: "Coming in June 2024",
    },
    {
      icon: <Mic className="h-12 w-12 text-primary" />,
      title: "Speech and Tone Analysis",
      description: "Get feedback on your speech patterns, tone modulation, clarity, and pronunciation to improve your verbal communication skills.",
      status: "Coming in July 2024",
    },
    {
      icon: <Bot className="h-12 w-12 text-primary" />,
      title: "Specialized AI Interview Agents",
      description: "Practice with industry-specific AI interviewers tailored for technical, HR, aptitude, and management role interviews.",
      status: "Coming in August 2024",
    },
    {
      icon: <Calendar className="h-12 w-12 text-primary" />,
      title: "Interview Scheduling with AI",
      description: "Schedule and conduct mock interviews with AI agents that simulate real interview scenarios based on your preferred time slots.",
      status: "Coming in September 2024",
    },
    {
      icon: <FileVideo className="h-12 w-12 text-primary" />,
      title: "Interview Recording and Playback",
      description: "Record your mock interviews and review them later with AI-generated annotations highlighting key moments and improvement areas.",
      status: "Coming in October 2024",
    },
    {
      icon: <AreaChart className="h-12 w-12 text-primary" />,
      title: "Comprehensive Performance Analytics",
      description: "Track your progress over time with detailed analytics on your interview performance, learning progress, and skill development.",
      status: "Coming in November 2024",
    },
  ];

  return (
    <Layout>
      <div className="py-12">
        <Container>
          <div className="mb-12 max-w-3xl">
            <h1 className="text-3xl font-bold tracking-tight mb-4">Upcoming Platform Features</h1>
            <p className="text-muted-foreground text-lg">
              We're constantly working to enhance your learning and interview preparation experience. 
              Here's a preview of exciting new features coming soon to our platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {upcomingFeatures.map((feature, index) => (
              <Card key={index} className="h-full flex flex-col transition-all hover:shadow-soft-md">
                <CardHeader>
                  <div className="mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    {feature.icon}
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardFooter className="mt-auto pt-4">
                  <div className="text-sm font-medium text-muted-foreground flex items-center">
                    <Sparkles className="h-4 w-4 mr-2 text-primary" />
                    {feature.status}
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>

          <GlassMorphism className="p-8 mb-12">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-full md:w-1/2">
                <h2 className="text-2xl font-bold mb-4">AI Agents Integration</h2>
                <p className="text-muted-foreground mb-4">
                  Our upcoming AI agents will simulate different types of interviewers, each with unique personalities and interviewing styles:
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2">
                    <Cpu className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">Technical Agent</span> - Specializes in assessing your technical knowledge and problem-solving skills
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <Cpu className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">HR Agent</span> - Focuses on behavioral questions and cultural fit
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <Cpu className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">Aptitude Agent</span> - Tests your analytical and reasoning abilities
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <Cpu className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">Management Agent</span> - Evaluates your leadership and management potential
                    </div>
                  </li>
                </ul>
              </div>
              <div className="w-full md:w-1/2 bg-muted rounded-xl p-6">
                <div className="bg-card rounded-lg p-4 mb-4 border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Cpu className="h-5 w-5 text-primary" />
                    <span className="font-medium">Technical Agent</span>
                  </div>
                  <p className="text-sm text-muted-foreground italic">
                    "Can you walk me through how you would implement a cache system to improve the performance of a database-heavy application?"
                  </p>
                </div>
                <div className="bg-card rounded-lg p-4 mb-4 border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Cpu className="h-5 w-5 text-primary" />
                    <span className="font-medium">HR Agent</span>
                  </div>
                  <p className="text-sm text-muted-foreground italic">
                    "Tell me about a time when you had to deal with a difficult team member. How did you handle the situation?"
                  </p>
                </div>
                <div className="bg-card rounded-lg p-4 border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Cpu className="h-5 w-5 text-primary" />
                    <span className="font-medium">Aptitude Agent</span>
                  </div>
                  <p className="text-sm text-muted-foreground italic">
                    "If it takes 5 machines 5 minutes to make 5 widgets, how long would it take 100 machines to make 100 widgets?"
                  </p>
                </div>
              </div>
            </div>
          </GlassMorphism>

          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Join Our Beta Program</h2>
            <p className="text-muted-foreground mb-6">
              Want to be among the first to try these new features? Sign up for our beta program and get early access to upcoming features.
            </p>
            <Button size="lg" className="px-8">
              Join Beta Program <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </Container>
      </div>
    </Layout>
  );
};

export default FutureIntegrations;

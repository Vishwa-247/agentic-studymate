
import { Brain, BookOpen, Video, MessageSquare, BarChart, Award } from "lucide-react";
import Container from "../ui/Container";
import GlassMorphism from "../ui/GlassMorphism";

const features = [
  {
    icon: Brain,
    title: "AI Course Generation",
    description:
      "Create personalized learning paths with our AI that generates comprehensive courses based on your needs and skill level.",
  },
  {
    icon: MessageSquare,
    title: "AI Mock Interviews",
    description:
      "Practice with intelligent AI interviewers that adapt to your responses and provide realistic interview scenarios.",
  },
  {
    icon: Video,
    title: "Video Analysis",
    description:
      "Get feedback on your body language, facial expressions, and presentation skills through advanced video analysis.",
  },
  {
    icon: BookOpen,
    title: "Interactive Learning",
    description:
      "Engage with dynamic learning materials including flashcards, quizzes, and interactive exercises tailored to your progress.",
  },
  {
    icon: BarChart,
    title: "Performance Tracking",
    description:
      "Monitor your progress with detailed analytics and insights to identify strengths and areas for improvement.",
  },
  {
    icon: Award,
    title: "Personalized Feedback",
    description:
      "Receive actionable feedback on your responses, presentation, and communication skills to continuously improve.",
  },
];

const Features = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-secondary/50 rounded-full blur-3xl -z-10" />

      <Container>
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            AI-Powered Features to Elevate Your <span className="text-gradient">Learning Experience</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Our platform combines cutting-edge AI technology with proven educational methods to provide a comprehensive learning and interview preparation solution.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <GlassMorphism
              key={index}
              className="p-6 h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-soft-xl"
              intensity="light"
            >
              <div className="flex flex-col h-full">
                <div className="mb-5 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary">
                  <feature.icon size={24} />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            </GlassMorphism>
          ))}
        </div>
      </Container>
    </section>
  );
};

export default Features;

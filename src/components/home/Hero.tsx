
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import Container from "../ui/Container";
import GlassMorphism from "../ui/GlassMorphism";

const Hero = () => {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden min-h-screen flex items-center">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/5 to-background -z-10" />
      
      {/* Decorative circles */}
      <div className="absolute -top-64 -right-64 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10" />
      <div className="absolute -bottom-64 -left-64 w-96 h-96 bg-accent/10 rounded-full blur-3xl -z-10" />
      
      {/* Subtle pattern background */}
      <div className="absolute inset-0 bg-mesh-1 opacity-50 -z-10" />
      
      {/* Content */}
      <Container className="relative z-10">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          <div className="flex flex-col space-y-8 max-w-2xl">
            <span className="inline-flex items-center px-3 py-1 text-xs font-medium bg-secondary text-primary rounded-full w-fit animate-fade-down">
              AI-Powered Learning & Interview Preparation
            </span>
            
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl animate-fade-up" style={{ animationDelay: "150ms" }}>
              Master Any <span className="text-gradient">Interview</span> with AI-Guided Learning
            </h1>
            
            <p className="text-lg text-muted-foreground animate-fade-up" style={{ animationDelay: "300ms" }}>
              Generate personalized courses, practice with AI interviewers, and receive detailed feedback to improve your skills and ace your next interview.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4 animate-fade-up" style={{ animationDelay: "450ms" }}>
              <Link 
                to="/profile-builder" 
                className="px-8 py-3 text-white font-medium bg-primary hover:bg-primary/90 rounded-full transition-all duration-300 flex items-center justify-center space-x-2 button-glow"
              >
                <span>Build Your Profile</span>
                <ArrowRight size={18} />
              </Link>
              <Link 
                to="/mock-interview" 
                className="px-8 py-3 font-medium border border-primary text-primary hover:bg-primary/10 rounded-full transition-all duration-300 flex items-center justify-center"
              >
                Try Mock Interview
              </Link>
            </div>
          </div>
          
          <div className="relative flex justify-center lg:justify-end">
            <GlassMorphism 
              className="p-6 w-full max-w-md lg:max-w-xl aspect-square flex flex-col justify-center animate-scale-up"
              intensity="medium" 
              rounded="2xl"
            >
              <div className="relative aspect-video overflow-hidden rounded-xl border border-white/20 shadow-soft-xl">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 animate-pulse-slow" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                    <div className="w-0 h-0 border-t-8 border-t-transparent border-l-12 border-l-primary border-b-8 border-b-transparent ml-1" />
                  </div>
                </div>
              </div>
              
              <div className="mt-6 space-y-2">
                <div className="w-full h-3 bg-white/30 dark:bg-white/10 rounded-full" />
                <div className="w-3/4 h-3 bg-white/30 dark:bg-white/10 rounded-full" />
                <div className="w-1/2 h-3 bg-white/30 dark:bg-white/10 rounded-full" />
              </div>
              
              <div className="mt-auto pt-6 flex justify-between items-center">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-white/30 dark:bg-white/10 border border-white/20 shadow-sm" />
                  ))}
                </div>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="w-4 h-4 rounded-full bg-primary/80" />
                  ))}
                </div>
              </div>
            </GlassMorphism>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default Hero;

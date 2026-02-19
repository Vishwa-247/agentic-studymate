
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface HowItWorksProps {
  generationInBackground: boolean;
}

const HowItWorks = ({ generationInBackground }: HowItWorksProps) => {
  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-4">How It Works</h2>
        <ol className="space-y-2 text-muted-foreground">
          <li className="flex gap-2 items-start">
            <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm shrink-0">1</span>
            <span>Enter the course topic or subject you want to learn about</span>
          </li>
          <li className="flex gap-2 items-start">
            <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm shrink-0">2</span>
            <span>Select the purpose of your learning and desired difficulty level</span>
          </li>
          <li className="flex gap-2 items-start">
            <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm shrink-0">3</span>
            <span>Our AI generates a complete course with chapters, flashcards, and quizzes</span>
          </li>
          <li className="flex gap-2 items-start">
            <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm shrink-0">4</span>
            <span>Start learning at your own pace with your personalized course</span>
          </li>
        </ol>
        
        {generationInBackground && (
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <p className="text-sm font-medium">Course generation in progress</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              You can navigate to other pages. We'll notify you when it's ready.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HowItWorks;

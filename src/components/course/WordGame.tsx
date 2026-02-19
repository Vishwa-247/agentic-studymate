import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle2, XCircle, RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WordGameItem {
  id: string;
  word: string;
  definition: string;
  incorrect_options: string[];
}

interface WordGameProps {
  words: WordGameItem[];
}

export const WordGame = ({ words }: WordGameProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [options, setOptions] = useState<string[]>([]);

  const currentWord = words[currentIndex];

  useEffect(() => {
    if (currentWord) {
      // Shuffle options
      const allOptions = [
        currentWord.definition,
        ...currentWord.incorrect_options
      ];
      setOptions(shuffleArray(allOptions));
    }
  }, [currentIndex, currentWord]);

  const shuffleArray = (array: string[]) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const handleAnswerSelect = (answer: string) => {
    if (showResult) return;
    
    setSelectedAnswer(answer);
    setShowResult(true);
    
    if (answer === currentWord.definition) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      // Game complete
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
  };

  if (!currentWord) {
    return (
      <Card className="p-8 text-center">
        <h3 className="text-2xl font-bold mb-4">Game Complete! 🎮</h3>
        <p className="text-lg mb-4">
          Final Score: {score} / {words.length}
        </p>
        <p className="text-muted-foreground mb-6">
          {Math.round((score / words.length) * 100)}% Correct
        </p>
        <Button onClick={handleRestart}>
          <RotateCw className="mr-2 h-4 w-4" />
          Play Again
        </Button>
      </Card>
    );
  }

  const isCorrect = selectedAnswer === currentWord.definition;
  const progress = ((currentIndex + 1) / words.length) * 100;

  return (
    <Card className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-muted-foreground">
            Word {currentIndex + 1} of {words.length}
          </span>
          <span className="text-sm font-medium">
            Score: {score}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="space-y-6">
        <div className="text-center p-6 bg-primary/5 rounded-lg border-2 border-primary/20">
          <p className="text-sm text-muted-foreground mb-2">Match the definition for:</p>
          <h2 className="text-3xl font-bold text-primary">{currentWord.word}</h2>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {options.map((option, index) => {
            const isSelected = selectedAnswer === option;
            const isCorrectAnswer = option === currentWord.definition;
            
            let variantClass = 'border-border hover:border-primary';
            
            if (showResult) {
              if (isCorrectAnswer) {
                variantClass = 'border-green-500 bg-green-50 dark:bg-green-950';
              } else if (isSelected && !isCorrect) {
                variantClass = 'border-red-500 bg-red-50 dark:bg-red-950';
              }
            } else if (isSelected) {
              variantClass = 'border-primary bg-primary/5';
            }

            return (
              <button
                key={index}
                onClick={() => handleAnswerSelect(option)}
                disabled={showResult}
                className={cn(
                  'p-4 border-2 rounded-lg text-left transition-all',
                  variantClass,
                  !showResult && 'cursor-pointer'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm">{option}</span>
                  {showResult && (
                    <>
                      {isCorrectAnswer && (
                        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      )}
                      {isSelected && !isCorrect && (
                        <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                      )}
                    </>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {showResult && (
          <Button
            onClick={handleNext}
            className="w-full"
          >
            {currentIndex < words.length - 1 ? 'Next Word' : 'View Results'}
          </Button>
        )}
      </div>
    </Card>
  );
};

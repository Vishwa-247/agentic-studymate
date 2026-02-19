import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, RotateCw, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Flashcard {
  id: string;
  question: string;
  answer: string;
}

interface FlashcardViewerProps {
  flashcards: Flashcard[];
  onMarkLearned?: (cardId: string) => void;
}

export const FlashcardViewer = ({ flashcards, onMarkLearned }: FlashcardViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [learnedCards, setLearnedCards] = useState<Set<string>>(new Set());

  const currentCard = flashcards[currentIndex];

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setIsFlipped(false);
    }
  };

  const handleMarkLearned = () => {
    if (!currentCard) return;
    
    const newLearned = new Set(learnedCards);
    newLearned.add(currentCard.id);
    setLearnedCards(newLearned);
    
    if (onMarkLearned) {
      onMarkLearned(currentCard.id);
    }
  };

  const handleShuffle = () => {
    const randomIndex = Math.floor(Math.random() * flashcards.length);
    setCurrentIndex(randomIndex);
    setIsFlipped(false);
  };

  if (!currentCard) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No flashcards available</p>
      </Card>
    );
  }

  const isLearned = learnedCards.has(currentCard.id);
  const learnedCount = learnedCards.size;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">
          Card {currentIndex + 1} of {flashcards.length}
        </span>
        <span className="text-sm font-medium">
          Learned: {learnedCount}/{flashcards.length}
        </span>
      </div>

      <div
        className="relative h-80 cursor-pointer perspective-1000"
        onClick={handleFlip}
      >
        <div
          className={cn(
            'absolute inset-0 transition-transform duration-500',
            '[transform-style:preserve-3d]',
            isFlipped && '[transform:rotateY(180deg)]'
          )}
        >
          {/* Front of card */}
          <Card
            className={cn(
              'absolute inset-0 p-8 flex items-center justify-center text-center',
              '[backface-visibility:hidden]',
              'border-2',
              isLearned && 'border-green-500'
            )}
          >
            <div>
              <p className="text-xs text-muted-foreground mb-4 uppercase tracking-wide">
                Question
              </p>
              <p className="text-xl font-semibold">{currentCard.question}</p>
              <p className="text-xs text-muted-foreground mt-6">
                Click to reveal answer
              </p>
            </div>
          </Card>

          {/* Back of card */}
          <Card
            className={cn(
              'absolute inset-0 p-8 flex items-center justify-center text-center',
              '[backface-visibility:hidden]',
              '[transform:rotateY(180deg)]',
              'border-2',
              isLearned && 'border-green-500'
            )}
          >
            <div>
              <p className="text-xs text-muted-foreground mb-4 uppercase tracking-wide">
                Answer
              </p>
              <p className="text-xl font-semibold">{currentCard.answer}</p>
              <p className="text-xs text-muted-foreground mt-6">
                Click to see question
              </p>
            </div>
          </Card>
        </div>
      </div>

      <div className="flex gap-2 items-center justify-center">
        <Button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          variant="outline"
          size="icon"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <Button
          onClick={handleShuffle}
          variant="outline"
          size="icon"
        >
          <RotateCw className="h-4 w-4" />
        </Button>

        <Button
          onClick={handleMarkLearned}
          disabled={isLearned}
          variant={isLearned ? "secondary" : "default"}
          className="px-6"
        >
          <Check className="h-4 w-4 mr-2" />
          {isLearned ? 'Learned' : 'Mark as Learned'}
        </Button>

        <Button
          onClick={handleNext}
          disabled={currentIndex === flashcards.length - 1}
          variant="outline"
          size="icon"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

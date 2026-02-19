import { ChevronDown, ChevronRight, BookOpen, CheckCircle2, ChevronLeft, ChevronRight as ChevronRightIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface Chapter {
  id: string;
  title: string;
  order_number: number;
  level?: string;
}

interface CourseSidebarProps {
  chapters: Chapter[];
  currentChapterId?: string;
  onChapterSelect: (chapterId: string) => void;
  progress: number;
  completedChapters: string[];
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const CourseSidebar = ({
  chapters,
  currentChapterId,
  onChapterSelect,
  progress,
  completedChapters,
  isCollapsed = false,
  onToggleCollapse,
}: CourseSidebarProps) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    basic: true,
    intermediate: true,
    advanced: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getChaptersByLevel = (level: string) => {
    return chapters.filter(ch => {
      const chapterLevel = ch.level || 'intermediate';
      return chapterLevel === level;
    });
  };

  const basicChapters = getChaptersByLevel('basic');
  const intermediateChapters = getChaptersByLevel('intermediate');
  const advancedChapters = getChaptersByLevel('advanced');

  const renderChapterList = (chapterList: Chapter[]) => {
    return chapterList.map((chapter) => {
      const isActive = currentChapterId === chapter.id;
      const isCompleted = completedChapters.includes(chapter.id);

      return (
        <Button
          key={chapter.id}
          variant="ghost"
          className={cn(
            'w-full justify-start text-left pl-3 pr-2 py-2.5 h-auto min-h-[3rem]',
            isActive && 'bg-primary/10 text-primary font-medium',
            !isActive && 'hover:bg-muted'
          )}
          onClick={() => onChapterSelect(chapter.id)}
        >
          <div className="flex items-start gap-2.5 flex-1 min-w-0 w-full">
            {isCompleted ? (
              <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <BookOpen className="h-4 w-4 flex-shrink-0 mt-0.5 text-muted-foreground" />
            )}
            <span className="text-sm leading-relaxed break-words flex-1 text-left whitespace-normal">{chapter.title}</span>
          </div>
        </Button>
      );
    });
  };

  const SectionHeader = ({ title, icon, level, count }: { title: string; icon: string; level: string; count: number }) => {
    const isExpanded = expandedSections[level];
    
    return (
      <Button
        variant="ghost"
        className="w-full justify-start font-semibold mb-1"
        onClick={() => toggleSection(level)}
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 mr-2" />
        ) : (
          <ChevronRight className="h-4 w-4 mr-2" />
        )}
        <span className="mr-2">{icon}</span>
        <span>{title}</span>
        <span className="ml-auto text-xs text-muted-foreground">({count})</span>
      </Button>
    );
  };

  // Collapsed state - show chapter indicators
  if (isCollapsed) {
    return (
      <div className="w-16 border-r border-border bg-card h-full flex flex-col items-center py-4">
        {/* Expand button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="mb-4"
          title="Expand sidebar"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </Button>
        
        {/* Chapter indicators */}
        <div className="flex-1 flex flex-col gap-2 w-full px-2 overflow-y-auto">
          {chapters.map((chapter, index) => {
            const isActive = currentChapterId === chapter.id;
            const isCompleted = completedChapters.includes(chapter.id);
            const chapterNumber = chapter.order_number || index + 1;

            return (
              <button
                key={chapter.id}
                onClick={() => onChapterSelect(chapter.id)}
                className={cn(
                  'w-full h-12 relative flex items-center justify-center rounded-md transition-all',
                  isActive && 'bg-primary/20 text-primary ring-2 ring-primary',
                  !isActive && 'hover:bg-muted'
                )}
                title={chapter.title}
              >
                {/* Chapter number */}
                <span className={cn(
                  'text-sm font-semibold',
                  isActive && 'text-primary',
                  !isActive && 'text-muted-foreground'
                )}>
                  {chapterNumber}
                </span>
                
                {/* Completion indicator */}
                {isCompleted && (
                  <div className="absolute -top-1 -right-1">
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                  </div>
                )}
                
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            );
          })}
        </div>
        
        {/* Vertical "Chapters" text at bottom */}
        <div className="mt-4">
          <div className="writing-vertical-rl transform rotate-180 text-xs text-muted-foreground font-semibold">
            Chapters
          </div>
        </div>
      </div>
    );
  }

  // Expanded state - show full sidebar
  return (
    <div className="w-80 border-r border-border bg-card h-full overflow-y-auto flex flex-col transition-all duration-300">
      {/* Header with collapse button */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-sm text-muted-foreground mb-2">Course Progress</h3>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">{Math.round(progress)}% Complete</p>
        </div>
        {onToggleCollapse && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="ml-2 flex-shrink-0"
            title="Collapse sidebar"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Chapters list */}
      <div className="p-3 flex-1 overflow-y-auto">
        {basicChapters.length > 0 && (
          <div className="mb-3">
            <SectionHeader title="Basics" icon="📘" level="basic" count={basicChapters.length} />
            {expandedSections.basic && (
              <div className="space-y-1 mt-1">
                {renderChapterList(basicChapters)}
              </div>
            )}
          </div>
        )}

        {intermediateChapters.length > 0 && (
          <div className="mb-3">
            <SectionHeader title="Intermediate" icon="📗" level="intermediate" count={intermediateChapters.length} />
            {expandedSections.intermediate && (
              <div className="space-y-1 mt-1">
                {renderChapterList(intermediateChapters)}
              </div>
            )}
          </div>
        )}

        {advancedChapters.length > 0 && (
          <div className="mb-3">
            <SectionHeader title="Advanced" icon="📕" level="advanced" count={advancedChapters.length} />
            {expandedSections.advanced && (
              <div className="space-y-1 mt-1">
                {renderChapterList(advancedChapters)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

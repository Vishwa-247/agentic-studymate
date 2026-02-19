import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, ChevronLeft, CheckCircle2 } from 'lucide-react';
import Container from '@/components/ui/Container';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CourseSidebar } from '@/components/course/CourseSidebar';
import { ContentRenderer } from '@/components/course/ContentRenderer';
import { AudioPlayer } from '@/components/course/AudioPlayer';
import { BrowserTTSPlayer } from '@/components/course/BrowserTTSPlayer';
import { InteractiveQuiz } from '@/components/course/InteractiveQuiz';
import { FlashcardViewer } from '@/components/course/FlashcardViewer';
import { WordGame } from '@/components/course/WordGame';

const CourseDetailNew = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [chapters, setChapters] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [audio, setAudio] = useState<any[]>([]);
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [mcqs, setMCQs] = useState<any[]>([]);
  const [wordGames, setWordGames] = useState<any[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [completedChapters, setCompletedChapters] = useState<string[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!id) return;

    loadCourse();
    subscribeToProgress();
    loadCompletedChapters();
  }, [id]);

  useEffect(() => {
    if (chapters.length > 0) {
      // Calculate progress based on completed chapters
      const progressValue = Math.round((completedChapters.length / chapters.length) * 100);
      setProgress(progressValue);
    } else {
      setProgress(0);
    }
  }, [chapters, completedChapters]);

  const loadCourse = async () => {
    try {
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      if (courseData.status === 'published') {
        await loadCourseContent();
      }
    } catch (error: any) {
      console.error('Error loading course:', error);
      toast.error('Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const loadCompletedChapters = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !id) return;

      const { data, error } = await supabase
        .from('chapter_completion')
        .select('chapter_id')
        .eq('course_id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      if (data) {
        setCompletedChapters(data.map(item => item.chapter_id));
      }
    } catch (error) {
      console.error('Error loading completed chapters:', error);
    }
  };

  const handleMarkComplete = async (chapterId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !id) {
        toast.error('Please sign in to mark chapters as complete');
        return;
      }

      // Check if already completed
      if (completedChapters.includes(chapterId)) {
        toast.info('This chapter is already marked as complete');
        return;
      }

      const { error } = await supabase
        .from('chapter_completion')
        .upsert({
          user_id: user.id,
          course_id: id,
          chapter_id: chapterId,
        }, {
          onConflict: 'user_id,chapter_id'
        });

      if (error) throw error;

      // Update local state
      setCompletedChapters(prev => [...prev, chapterId]);
      
      toast.success('Chapter marked as complete! 🎉');
    } catch (error: any) {
      console.error('Error marking chapter as complete:', error);
      toast.error(error.message || 'Failed to mark chapter as complete');
    }
  };

  const loadCourseContent = async () => {
    try {
      const [chaptersRes, articlesRes, audioRes, flashcardsRes, mcqsRes, wordGamesRes] = await Promise.all([
        supabase.from('course_chapters').select('*').eq('course_id', id).order('order_number'),
        (supabase as any).from('course_articles').select('*').eq('course_id', id),
        (supabase as any).from('course_audio').select('*').eq('course_id', id),
        supabase.from('course_flashcards').select('*').eq('course_id', id),
        supabase.from('course_mcqs').select('*').eq('course_id', id),
        (supabase as any).from('course_word_games').select('*').eq('course_id', id),
      ]);

      if (chaptersRes.data) {
        setChapters(chaptersRes.data);
        if (chaptersRes.data.length > 0) {
          setSelectedChapterId(chaptersRes.data[0].id);
        }
      }
      if (articlesRes.data) setArticles(articlesRes.data);
      if (audioRes.data) setAudio(audioRes.data);
      if (flashcardsRes.data) setFlashcards(flashcardsRes.data);
      if (mcqsRes.data) setMCQs(mcqsRes.data);
      if (wordGamesRes.data) setWordGames(wordGamesRes.data);
    } catch (error) {
      console.error('Error loading course content:', error);
    }
  };

  const subscribeToProgress = () => {
    const channel = supabase
      .channel('course-progress')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'course_generation_jobs',
          filter: `course_id=eq.${id}`
        },
        (payload) => {
          setProgress(payload.new.progress_percentage);
          setCurrentStep(payload.new.current_step);
          
          if (payload.new.status === 'completed') {
            loadCourse();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (course?.status === 'generating') {
    return (
      <Container className="py-20">
        <Card className="p-8 max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Generating Your Course</h2>
          <p className="text-muted-foreground mb-6">{currentStep}</p>
          <Progress value={progress} className="mb-4" />
          <p className="text-sm text-muted-foreground">{progress}% complete</p>
        </Card>
      </Container>
    );
  }

  const selectedChapter = chapters.find(ch => ch.id === selectedChapterId);
  const shortPodcast = audio.find(a => a.audio_type === 'short_podcast');
  const fullLecture = audio.find(a => a.audio_type === 'full_lecture');
  
  // Check if we have audio scripts but no audio files (use browser TTS)
  const shortPodcastScript = shortPodcast?.script || shortPodcast?.script_text || '';
  const fullLectureScript = fullLecture?.script || fullLecture?.script_text || '';
  const hasAudioScripts = !!(shortPodcastScript || fullLectureScript);
  const hasAudioFiles = !!(shortPodcast?.audio_url || fullLecture?.audio_url);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border py-4">
        <Container>
          <Link to="/courses" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Courses
          </Link>
        </Container>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        <CourseSidebar
          chapters={chapters}
          currentChapterId={selectedChapterId || undefined}
          onChapterSelect={setSelectedChapterId}
          progress={progress}
          completedChapters={completedChapters}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        <div className="flex-1 overflow-y-auto">
          <Container className="py-8">
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-2">{course?.title}</h1>
              <p className="text-muted-foreground">{course?.summary}</p>
            </div>

            <Tabs defaultValue="learn" className="space-y-6">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="learn">📖 Learn</TabsTrigger>
                <TabsTrigger value="listen">🎙️ Listen</TabsTrigger>
                <TabsTrigger value="quiz">📝 Quiz</TabsTrigger>
                <TabsTrigger value="flashcards">🃏 Flashcards</TabsTrigger>
                <TabsTrigger value="game">🎮 Game</TabsTrigger>
                <TabsTrigger value="articles">📚 Articles</TabsTrigger>
              </TabsList>

              <TabsContent value="learn">
                {selectedChapter ? (
                  <Card className="p-8">
                    <div className="flex items-start justify-between mb-6">
                      <h2 className="text-3xl font-bold flex-1">{selectedChapter.title}</h2>
                      <Button
                        onClick={() => handleMarkComplete(selectedChapter.id)}
                        variant={completedChapters.includes(selectedChapter.id) ? "secondary" : "default"}
                        disabled={completedChapters.includes(selectedChapter.id)}
                        className="ml-4"
                      >
                        {completedChapters.includes(selectedChapter.id) ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Completed
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Mark as Complete
                          </>
                        )}
                      </Button>
                    </div>
                    <ContentRenderer content={selectedChapter.content} />
                  </Card>
                ) : (
                  <Card className="p-8 text-center text-muted-foreground">
                    Select a chapter from the sidebar to begin learning
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="listen">
                <div className="space-y-6">
                  {/* Show pre-generated audio if available */}
                  {hasAudioFiles && (
                    <>
                      {shortPodcast?.audio_url && (
                        <AudioPlayer
                          audioUrl={shortPodcast.audio_url}
                          title="Short Episode (5 min)"
                          transcript={shortPodcast.transcript}
                        />
                      )}
                      {fullLecture?.audio_url && (
                        <AudioPlayer
                          audioUrl={fullLecture.audio_url}
                          title="Full Lecture (20 min)"
                          transcript={fullLecture.transcript}
                        />
                      )}
                    </>
                  )}
                  
                  {/* Show browser TTS if scripts exist but no audio files */}
                  {hasAudioScripts && !hasAudioFiles && (
                    <>
                      {shortPodcastScript && (
                        <BrowserTTSPlayer
                          script={shortPodcastScript}
                          title="Short Episode (5 min)"
                          audioType="short_podcast"
                        />
                      )}
                      {fullLectureScript && (
                        <BrowserTTSPlayer
                          script={fullLectureScript}
                          title="Full Lecture (20 min)"
                          audioType="full_lecture"
                        />
                      )}
                    </>
                  )}
                  
                  {/* No audio at all */}
                  {!hasAudioFiles && !hasAudioScripts && (
                    <Card className="p-8 text-center text-muted-foreground">
                      <p className="mb-2">Audio content not available for this course</p>
                      <p className="text-sm">Audio will be generated when course generation completes.</p>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="quiz">
                {mcqs.length > 0 ? (
                  <InteractiveQuiz questions={mcqs} />
                ) : (
                  <Card className="p-8 text-center text-muted-foreground">
                    No quiz questions available yet
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="flashcards">
                {flashcards.length > 0 ? (
                  <FlashcardViewer flashcards={flashcards} />
                ) : (
                  <Card className="p-8 text-center text-muted-foreground">
                    No flashcards available yet
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="game">
                {wordGames.length > 0 ? (
                  <WordGame words={wordGames} />
                ) : (
                  <Card className="p-8 text-center text-muted-foreground">
                    No word games available yet
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="articles">
                <div className="space-y-6">
                  {articles.map((article) => (
                    <Card key={article.id} className="p-6">
                      <h3 className="text-xl font-semibold mb-4">{article.title}</h3>
                      <div className="prose dark:prose-invert max-w-none">
                        {article.article_type === 'faq' ? (
                          <div className="space-y-4">
                            {JSON.parse(article.content).map((item: any, idx: number) => (
                              <div key={idx} className="border-b pb-4">
                                <h4 className="font-medium mb-2">{item.question}</h4>
                                <p className="text-muted-foreground">{item.answer}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <ContentRenderer content={article.content} />
                        )}
                      </div>
                    </Card>
                  ))}
                  {articles.length === 0 && (
                    <Card className="p-8 text-center text-muted-foreground">
                      No articles available yet
                    </Card>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </Container>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailNew;

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Star, Clock, TrendingUp, ChevronDown, ChevronUp, BookOpen, Lightbulb, Target, Sparkles, Copy, CheckCircle2, Loader2, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

// Map feedback categories to actual topic routes
const getCategoryRoute = (category: string, problemName: string): string => {
  // Normalize category name for matching
  const normalizedCategory = category.toLowerCase().trim();

  const categoryMap: Record<string, string> = {
    'arrays': 'array-basics',
    'array': 'array-basics',
    'strings': 'string-basics',
    'string': 'string-basics',
    'linked lists': 'linked-list',
    'linked list': 'linked-list',
    'trees': 'tree-basics',
    'tree': 'tree-basics',
    'graphs': 'graph-basics',
    'graph': 'graph-basics',
    'dynamic programming': 'dp-basics',
    'dp': 'dp-basics',
    'greedy': 'greedy-basics',
    'backtracking': 'backtracking',
    'sorting': 'sorting-basics',
    'searching': 'searching-basics',
    'hash tables': 'hash-table',
    'hash table': 'hash-table',
    'heaps': 'heap-basics',
    'heap': 'heap-basics',
    'stacks': 'stack-basics',
    'stack': 'stack-basics',
    'queues': 'queue-basics',
    'queue': 'queue-basics',
    'two pointers': 'two-pointers',
    'sliding window': 'sliding-window',
    'binary search': 'binary-search',
    'recursion': 'recursion',
    'math': 'math-basics',
    'bit manipulation': 'bit-manipulation',
    // Add more variations
  };

  return categoryMap[normalizedCategory] || 'array-basics'; // Default fallback
};

interface Feedback {
  id: string;
  problem_id: string;
  problem_name: string;
  difficulty: string;
  category: string;
  rating: number;
  time_spent: number | null;
  struggled_areas: string[];
  detailed_feedback: string;
  ai_suggestions: {
    approach_suggestions?: string[];
    key_concepts?: string[];
    similar_problems?: string[];
    learning_resources?: Array<{
      type: string;
      title: string;
      description: string;
      url?: string;
    }>;
    overall_advice?: string;
  } | null;
  created_at: string;
}

const FeedbacksList = () => {
  const navigate = useNavigate();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [copiedSections, setCopiedSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchFeedbacks();

    // Subscribe to real-time feedback updates
    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const channel = supabase
        .channel('dsa-feedbacks')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'dsa_feedbacks',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('New feedback added:', payload);
            setFeedbacks(prev => [payload.new as Feedback, ...prev]);
            toast.success('New feedback added!');
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'dsa_feedbacks',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Feedback updated with AI suggestions:', payload);
            setFeedbacks(prev => 
              prev.map(f => f.id === payload.new.id ? payload.new as Feedback : f)
            );
            toast.success('AI suggestions updated!');
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    const cleanup = setupRealtimeSubscription();
    
    return () => {
      cleanup.then(cleanupFn => cleanupFn && cleanupFn());
    };
  }, []);

  const fetchFeedbacks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('dsa_feedbacks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setFeedbacks((data || []) as Feedback[]);
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      toast.error('Failed to load feedbacks');
    } finally {
      setLoading(false);
    }
  };


  const copyToClipboard = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSections({ ...copiedSections, [sectionId]: true });
    toast.success("Copied to clipboard");
    setTimeout(() => {
      setCopiedSections({ ...copiedSections, [sectionId]: false });
    }, 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your feedbacks...</p>
        </div>
      </div>
    );
  }

  if (feedbacks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <Sparkles className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No feedbacks yet</h3>
          <p className="text-muted-foreground mb-4">
            Start solving problems and share your experience to get personalized AI suggestions!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          Your Problem Feedbacks
        </h2>
        <Badge variant="outline" className="text-sm font-medium">
          {feedbacks.length} Total
        </Badge>
      </div>

      <div className="space-y-6">
        {feedbacks.map((feedback) => (
          <Card key={feedback.id} className="border-2 hover:border-primary/30 transition-all duration-200 overflow-hidden">
            <CardHeader className="pb-4 bg-gradient-to-r from-primary/5 to-transparent">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="text-xl font-bold">{feedback.problem_name}</CardTitle>
                    <Badge variant="outline" className={`badge text-xs font-semibold ${
                      feedback.difficulty === 'Easy' ? 'badge-easy' : 
                      feedback.difficulty === 'Medium' ? 'badge-medium' : 
                      'badge-hard'
                    }`}>
                      {feedback.difficulty}
                    </Badge>
                    <Badge variant="outline" className="text-xs font-medium">
                      {feedback.category}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i}
                          className={`h-4 w-4 ${i < feedback.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                        />
                      ))}
                      <span className="ml-1 font-medium">{feedback.rating}/5</span>
                    </div>
                    {feedback.time_spent && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{feedback.time_spent} min</span>
                      </div>
                    )}
                  </div>

                  {feedback.struggled_areas && feedback.struggled_areas.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {feedback.struggled_areas.map((area, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    try {
                      const topicRoute = getCategoryRoute(feedback.category, feedback.problem_name);
                      navigate(`/dsa-sheet/topic/${topicRoute}`);
                    } catch (error) {
                      console.error('Navigation error:', error);
                      navigate('/dsa-sheet');
                      toast.error('Could not navigate to topic');
                    }
                  }}
                  className="flex items-center gap-2 hover:bg-primary/10"
                >
                  <TrendingUp className="h-4 w-4" />
                  Retry
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    if (confirm('Are you sure you want to delete this feedback?')) {
                      try {
                        const { error } = await supabase
                          .from('dsa_feedbacks')
                          .delete()
                          .eq('id', feedback.id);

                        if (error) throw error;

                        // Note: dsa_progress table doesn't exist, using dsa_feedbacks for progress tracking

                        setFeedbacks(prev => prev.filter(f => f.id !== feedback.id));
                        toast.success('Feedback deleted successfully');
                      } catch (error) {
                        console.error('Delete error:', error);
                        toast.error('Failed to delete feedback');
                      }
                    }
                  }}
                  className="flex items-center gap-2 hover:bg-destructive/10 text-destructive hover:text-destructive/80"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>

              {feedback.detailed_feedback && (
                <div className="mt-3 p-3 bg-muted/50 rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground italic">
                    <span className="font-semibold text-foreground">Your feedback:</span> "{feedback.detailed_feedback}"
                  </p>
                </div>
              )}
            </CardHeader>

            {!feedback.ai_suggestions && (
              <CardContent className="pt-0">
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border border-dashed">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Generating AI Suggestions...</p>
                    <p className="text-xs text-muted-foreground">Our AI is analyzing your feedback and creating personalized recommendations.</p>
                  </div>
                </div>
              </CardContent>
            )}

            {feedback.ai_suggestions && (
              <CardContent className="space-y-3 pt-0">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span className="text-sm font-semibold text-primary">AI-Generated Suggestions</span>
                </div>

                {/* Approach Suggestions */}
                {feedback.ai_suggestions.approach_suggestions && (
                  <Collapsible
                    open={expandedItems[`${feedback.id}-approach`]}
                    onOpenChange={(open) => setExpandedItems({ ...expandedItems, [`${feedback.id}-approach`]: open })}
                  >
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10 rounded-lg hover:from-blue-100 hover:to-blue-100 dark:hover:from-blue-950/30 dark:hover:to-blue-900/20 transition-colors border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span className="font-semibold text-sm text-blue-900 dark:text-blue-200">Approach Suggestions</span>
                      </div>
                      {expandedItems[`${feedback.id}-approach`] ? (
                        <ChevronUp className="h-4 w-4 text-blue-600" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-blue-600" />
                      )}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-3 pl-3">
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(feedback.ai_suggestions.approach_suggestions.join('\n'), `${feedback.id}-approach`)}
                          className="absolute top-0 right-0 h-6 px-2"
                        >
                          {copiedSections[`${feedback.id}-approach`] ? (
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                        <ul className="space-y-2">
                          {feedback.ai_suggestions.approach_suggestions.map((suggestion: string, idx: number) => (
                            <li key={idx} className="text-sm text-foreground flex gap-2 bg-blue-50/50 dark:bg-blue-950/10 p-2 rounded">
                              <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
                              <span>{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* Key Concepts */}
                {feedback.ai_suggestions.key_concepts && (
                  <Collapsible
                    open={expandedItems[`${feedback.id}-concepts`]}
                    onOpenChange={(open) => setExpandedItems({ ...expandedItems, [`${feedback.id}-concepts`]: open })}
                  >
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-gradient-to-r from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/10 rounded-lg hover:from-purple-100 hover:to-purple-100 dark:hover:from-purple-950/30 dark:hover:to-purple-900/20 transition-colors border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        <span className="font-semibold text-sm text-purple-900 dark:text-purple-200">Key Concepts to Review</span>
                      </div>
                      {expandedItems[`${feedback.id}-concepts`] ? (
                        <ChevronUp className="h-4 w-4 text-purple-600" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-purple-600" />
                      )}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-3 pl-3">
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(feedback.ai_suggestions.key_concepts.join('\n'), `${feedback.id}-concepts`)}
                          className="absolute top-0 right-0 h-6 px-2"
                        >
                          {copiedSections[`${feedback.id}-concepts`] ? (
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                        <ul className="space-y-2">
                          {feedback.ai_suggestions.key_concepts.map((concept: string, idx: number) => (
                            <li key={idx} className="text-sm text-foreground flex gap-2 bg-purple-50/50 dark:bg-purple-950/10 p-2 rounded">
                              <span className="text-purple-600 dark:text-purple-400 font-bold">•</span>
                              <span>{concept}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* Similar Problems */}
                {feedback.ai_suggestions.similar_problems && (
                  <Collapsible
                    open={expandedItems[`${feedback.id}-similar`]}
                    onOpenChange={(open) => setExpandedItems({ ...expandedItems, [`${feedback.id}-similar`]: open })}
                  >
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-gradient-to-r from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/10 rounded-lg hover:from-green-100 hover:to-green-100 dark:hover:from-green-950/30 dark:hover:to-green-900/20 transition-colors border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <span className="font-semibold text-sm text-green-900 dark:text-green-200">Similar Problems to Practice</span>
                      </div>
                      {expandedItems[`${feedback.id}-similar`] ? (
                        <ChevronUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-green-600" />
                      )}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-3 pl-3">
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(feedback.ai_suggestions.similar_problems.join('\n'), `${feedback.id}-similar`)}
                          className="absolute top-0 right-0 h-6 px-2"
                        >
                          {copiedSections[`${feedback.id}-similar`] ? (
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                        <ul className="space-y-2">
                          {feedback.ai_suggestions.similar_problems.map((problem: string, idx: number) => (
                            <li key={idx} className="text-sm text-foreground flex gap-2 bg-green-50/50 dark:bg-green-950/10 p-2 rounded">
                              <span className="text-green-600 dark:text-green-400 font-bold">•</span>
                              <span>{problem}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* Learning Resources */}
                {feedback.ai_suggestions.learning_resources && (
                  <Collapsible
                    open={expandedItems[`${feedback.id}-resources`]}
                    onOpenChange={(open) => setExpandedItems({ ...expandedItems, [`${feedback.id}-resources`]: open })}
                  >
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-gradient-to-r from-sky-50 to-indigo-50/50 rounded-lg hover:from-sky-100/50 hover:to-indigo-100/50 transition-colors border border-slate-100">


                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-slate-500" />
                        <span className="font-semibold text-sm text-slate-700">Learning Resources</span>
                      </div>
                      {expandedItems[`${feedback.id}-resources`] ? (
                        <ChevronUp className="h-4 w-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      )}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-3 pl-3">
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const resourceText = feedback.ai_suggestions.learning_resources
                              .map(r => `${r.title}: ${r.description}`)
                              .join('\n');
                            copyToClipboard(resourceText, `${feedback.id}-resources`);
                          }}
                          className="absolute top-0 right-0 h-6 px-2"
                        >
                          {copiedSections[`${feedback.id}-resources`] ? (
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                        <div className="space-y-3">
                          {feedback.ai_suggestions.learning_resources.map((resource, idx) => (
                            <div key={idx} className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                              <div className="flex items-start gap-2">
                                <BookOpen className="h-4 w-4 text-sky-400 flex-shrink-0 mt-1" />
                                <div className="flex-1">
                                  <p className="font-semibold text-sm text-slate-700 mb-1">
                                    {resource.title}
                                  </p>
                                  <p className="text-xs text-muted-foreground mb-2">
                                    {resource.description}
                                  </p>
                                  {resource.url && (
                                    <a
                                      href={resource.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-primary hover:underline font-medium flex items-center gap-1"
                                    >
                                      Watch on YouTube →
                                    </a>
                                  )}
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {resource.type}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* Overall Advice */}
                {feedback.ai_suggestions.overall_advice && (
                  <div className="p-4 bg-gradient-to-r from-[#FBF5D5] to-[#F0EEE9] rounded-lg border-l-4 border-yellow-200">
                    <div className="flex items-start gap-2">
                      <Target className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-sm text-slate-700">
                            Overall Advice
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(feedback.ai_suggestions.overall_advice, `${feedback.id}-advice`)}
                            className="h-6 px-2"
                          >
                            {copiedSections[`${feedback.id}-advice`] ? (
                              <CheckCircle2 className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                        <p className="text-sm text-foreground leading-relaxed">
                          {feedback.ai_suggestions.overall_advice}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FeedbacksList;
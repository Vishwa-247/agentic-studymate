import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import Container from "@/components/ui/Container";
import { Progress } from "@/components/ui/progress";
import { companies } from "@/data/companyProblems";
import { ArrowLeft, ExternalLink, Star } from "lucide-react";
import { useCallback, useState, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import InlineFeedback from "@/components/course/InlineFeedback";
import RouteFilters from "@/components/dsa/RouteFilters";
import { useAuth } from '@/hooks/useAuth';
import { useFavorites } from '@/hooks/useFavorites';
import { useDSAProgress } from '@/hooks/useDSAProgress';
import { dsaService } from "@/api/services/dsaService";
import { toast } from "sonner";

const CompanyProblems = () => {
  const { companyId } = useParams();
  const { user } = useAuth();
  const { isFavorite, toggleFavorite, favorites } = useFavorites();
  const { completedProblems, toggleProblemForFeedback, uncheckProblem } = useDSAProgress();
  const company = companies.find(c => c.id === companyId);
  
  const [expandedFeedback, setExpandedFeedback] = useState<string | null>(null);
  const [filters, setFilters] = useState({ difficulty: [] });
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const handleToggleProblem = useCallback(async (problemName: string) => {
    const result = toggleProblemForFeedback(problemName);
    if (result.action === 'uncheck') {
      await uncheckProblem(problemName);
      setExpandedFeedback(null);
    } else if (result.shouldShow) {
      setExpandedFeedback(problemName);
    } else {
      setExpandedFeedback(null);
    }
  }, [toggleProblemForFeedback, uncheckProblem]);

  // Filter problems based on difficulty and favorites
  const filteredProblems = useMemo(() => {
    if (!company) return [];
    
    let problems = company.problems;
    
    // Filter by difficulty
    if (filters.difficulty.length > 0) {
      problems = problems.filter(problem => 
        filters.difficulty.includes(problem.difficulty)
      );
    }
    
    // Filter by favorites
    if (showFavoritesOnly) {
      problems = problems.filter(problem => 
        isFavorite('problem', problem.name)
      );
    }
    
    return problems;
  }, [company, filters, isFavorite, showFavoritesOnly]);

  if (!company) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <Card className="text-center p-8">
          <CardContent>
            <h2 className="text-2xl font-bold text-foreground mb-4">Company not found</h2>
            <Link to="/dsa-sheet">
              <Button>Back to DSA Sheet</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progressPercentage = company ? (completedProblems.size / company.totalProblems) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Container className="py-12">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb with Back Button */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Link to="/dsa-sheet" className="hover:text-primary transition-colors">
                DSA Sheet
              </Link>
              <span>/</span>
              <Link to="/dsa-sheet" className="hover:text-primary transition-colors">
                Companies
              </Link>
              <span>/</span>
              <span className="text-foreground">{company.title}</span>
            </div>
            <Link to="/dsa-sheet">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </Link>
          </div>

          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center gap-6 mb-6">
              <div className="text-6xl">{company.icon}</div>
              <div>
                <h1 className="text-4xl font-bold text-foreground mb-2">
                  {company.title} Problems
                </h1>
                <div className="flex items-center gap-4 mb-2">
                  <Badge variant="outline" className="text-sm">
                    {completedProblems.size}/{company.totalProblems} solved
                  </Badge>
                  <Badge variant="secondary" className="text-sm">
                    {filteredProblems.length} problems shown
                  </Badge>
                </div>
                {company.links && company.links.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {company.links.map(link => (
                      <Button key={link.url} asChild variant="secondary" size="sm" className="gap-2">
                        <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                          <ExternalLink className="w-4 h-4" />
                          {link.label}
                        </a>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <Progress value={progressPercentage} className="h-3 mb-4" />
            <div className="text-sm text-muted-foreground">
              {progressPercentage.toFixed(1)}% completed
            </div>
          </div>

          {/* Filters - Positioned at top */}
          <RouteFilters
            filters={filters}
            onFiltersChange={setFilters}
            favorites={favorites.problems}
            onToggleFavorite={(problemName) => toggleFavorite('problem', problemName)}
            showFavoritesOnly={showFavoritesOnly}
            onShowFavoritesChange={setShowFavoritesOnly}
          />
          
          {/* Problems List */}
          <div className="space-y-4">
            {filteredProblems.map((problem, index) => {
                  const isCompleted = completedProblems.has(problem.name);
                  const isProblemFavorite = isFavorite('problem', problem.name);
                  
                  return (
                    <Card 
                      key={problem.name} 
                      className={`group transition-all duration-200 ${
                        isCompleted 
                          ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' 
                          : 'hover:shadow-md border-border'
                      }`}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <Checkbox
                              checked={isCompleted}
                              onCheckedChange={() => handleToggleProblem(problem.name)}
                              className="flex-shrink-0"
                            />
                            
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <Badge variant="outline" className="text-xs font-mono">
                                  {String(index + 1).padStart(2, '0')}
                                </Badge>
                                <h3 className={`font-semibold text-lg ${isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                  {problem.name}
                                </h3>
                                <Badge 
                                  variant="outline"
                                  className={`badge ${
                                    problem.difficulty === 'Easy' ? 'badge-easy' : 
                                    problem.difficulty === 'Medium' ? 'badge-medium' : 
                                    'badge-hard'
                                  }`}
                                >
                                  {problem.difficulty}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleFavorite('problem', problem.name)}
                              className="transition-colors hover:scale-110"
                            >
                              <Star 
                                className={`w-5 h-5 ${
                                  isProblemFavorite 
                                    ? 'text-yellow-500 fill-yellow-500' 
                                    : 'text-muted-foreground hover:text-yellow-500'
                                }`} 
                              />
                            </button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              className="transition-opacity"
                            >
                              <a 
                                href={problem.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-2"
                              >
                                <ExternalLink className="w-4 h-4" />
                                Solve
                              </a>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                  
                  {/* Inline Feedback - show when expanded (before completion) */}
                  {expandedFeedback === problem.name && (
                    <div className="mt-4 px-6 pb-6">
                      <InlineFeedback
                        isExpanded={true}
                        onToggle={() => setExpandedFeedback(null)}
                        problemName={problem.name}
                        difficulty={problem.difficulty}
                        company={company.title}
                        onSubmit={() => setExpandedFeedback(null)}
                      />
                    </div>
                  )}
                </Card>
                  );
                })}
              </div>

          {/* Back Button */}
          <div className="mt-12 text-center">
            <Link to="/dsa-sheet">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to DSA Sheet
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default CompanyProblems;

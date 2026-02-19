import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronRight, Building2, BookOpen, Search, Star, Filter } from "lucide-react";
import Container from "@/components/ui/Container";
import { dsaTopics } from "@/data/dsaProblems";
import { companies } from "@/data/companyProblems";
import { useDSAFilters } from "@/hooks/useDSAFilters";
import { useFavorites } from "@/hooks/useFavorites";
import FavoritesTable from "@/components/FavoritesTable";
import DSAChatbot from "@/components/dsa/DSAChatbot";
import FeedbacksList from "@/components/dsa/FeedbacksList";

const DSASheet = () => {
  const [activeTab, setActiveTab] = useState("topics");
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [chatbotMinimized, setChatbotMinimized] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();
  
  const {
    filters,
    setFilters,
    searchQuery,
    setSearchQuery,
    filteredTopics,
    filteredCompanies,
    availableCompanies,
    getFilteredProblemsForCompany,
    stats
  } = useDSAFilters({ topics: dsaTopics, companies });


  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Container className="py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16 relative">
            <div className="absolute left-0 top-0">
              <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
                ← Back
              </Button>
            </div>
            <h1 className="text-5xl font-bold text-foreground mb-4">
              Ultimate DSA Sheet
            </h1>
            <p className="text-xl text-muted-foreground">
              Problem Solving: Everything from Basics to Advanced
            </p>
            <div className="w-32 h-1 bg-gradient-to-r from-primary to-secondary mx-auto mt-6 rounded-full"></div>
          </div>

          {/* Search Bar */}
          <div className="max-w-md mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search topics or companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-card/50 backdrop-blur-sm border-primary/20 focus:border-primary/40"
              />
            </div>
          </div>


          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="grid w-full max-w-lg mx-auto grid-cols-4">
              <TabsTrigger value="topics" className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Topics
              </TabsTrigger>
              <TabsTrigger value="companies" className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Companies
              </TabsTrigger>
              <TabsTrigger value="favorites" className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                Favorites
              </TabsTrigger>
              <TabsTrigger value="feedbacks" className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Feedbacks
              </TabsTrigger>
            </TabsList>

            <TabsContent value="topics" className="mt-8">
              {/* Topics Grid */}
              {filteredTopics.length === 0 ? (
                <Card className="bg-card/50 backdrop-blur-sm">
                  <CardContent className="p-12 text-center">
                    <Filter className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">No topics found</h3>
                    <p className="text-muted-foreground">Try adjusting your filters or search query.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTopics.map((topic, index) => (
                    <div key={topic.id} className="relative group">
                      <Link to={`/dsa-sheet/topic/${topic.id}`}>
                        <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/20 bg-white">
                          <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="text-3xl">{topic.icon}</div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.preventDefault();
                                  toggleFavorite('topic', topic.id);
                                }}
                                className="text-yellow-500 hover:text-yellow-600"
                              >
                                <Star className={`w-4 h-4 ${isFavorite('topic', topic.id) ? 'fill-current' : ''}`} />
                              </Button>
                              <Badge variant="outline" className="text-xs">
                                {String(index + 1).padStart(2, '0')}
                              </Badge>
                              <Badge 
                                variant="outline"
                                className={`badge ${
                                  topic.difficulty === 'Easy' ? 'badge-easy' : 
                                  topic.difficulty === 'Medium' ? 'badge-medium' : 
                                  'badge-hard'
                                }`}
                              >
                                {topic.difficulty}
                              </Badge>
                            </div>
                          </div>
                            
                            <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors text-foreground">
                              {topic.title}
                            </h3>
                            
                            <div className="space-y-3">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">
                                  {topic.solvedProblems}/{topic.totalProblems} solved
                                </span>
                                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                              </div>
                              
                              <Progress 
                                value={(topic.solvedProblems / topic.totalProblems) * 100} 
                                className="h-2"
                              />
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="companies" className="mt-8">
              {/* Companies Grid */}
              {filteredCompanies.length === 0 ? (
                <Card className="bg-card/50 backdrop-blur-sm">
                  <CardContent className="p-12 text-center">
                    <Filter className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">No companies found</h3>
                    <p className="text-muted-foreground">Try adjusting your filters or search query.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCompanies.map((company, index) => {
                    const filteredProblems = getFilteredProblemsForCompany(company);
                    const solvedFilteredProblems = filteredProblems.filter(p => p.completed).length;
                    
                    return (
                      <div key={company.id} className="relative group">
                        <Link to={`/dsa-sheet/company/${company.id}`}>
                          <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/20 bg-card/50 backdrop-blur-sm">
                            <CardContent className="p-6">
                              <div className="flex items-center justify-between mb-4">
                                <div className="text-3xl">{company.icon}</div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      toggleFavorite('company', company.id);
                                    }}
                                    className="text-yellow-500 hover:text-yellow-600"
                                  >
                                    <Star className={`w-4 h-4 ${isFavorite('company', company.id) ? 'fill-current' : ''}`} />
                                  </Button>
                                  <Badge variant="outline" className="text-xs">
                                    {String(index + 1).padStart(2, '0')}
                                  </Badge>
                                  {company.title === "Adobe" && (
                                    <Badge variant="default" className="text-xs">
                                      Enhanced
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              
                              <h3 className="text-xl font-semibold text-foreground mb-3 group-hover:text-primary transition-colors">
                                {company.title}
                              </h3>
                              
                              <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground font-medium">
                    {solvedFilteredProblems}/{company.totalProblems} problems
                  </span>
                                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                </div>
                                
                <Progress 
                  value={company.totalProblems > 0 ? (solvedFilteredProblems / company.totalProblems) * 100 : 0} 
                  className="h-2"
                />

                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="favorites" className="mt-8">
              <FavoritesTable />
            </TabsContent>

            <TabsContent value="feedbacks" className="mt-8">
              <div className="space-y-6">
                {/* Feedback History */}
                <Card className="bg-card/50 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold text-foreground mb-4">Your Feedback History</h3>
                    <p className="text-muted-foreground mb-6">View all your feedback submissions with AI-generated suggestions</p>
                    <FeedbacksList />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Stats Section */}
          <div className="mt-16 text-center">
            <Card className="inline-block bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
              <CardContent className="p-6">
                {activeTab === "topics" ? (
                  <div className="flex items-center gap-8">
                    <div>
                      <div className="text-3xl font-bold text-primary">
                        {stats.topics.totalProblems}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Problems</div>
                    </div>
                    <div className="w-px h-12 bg-border"></div>
                    <div>
                      <div className="text-3xl font-bold text-secondary">
                        {stats.topics.solvedProblems}
                      </div>
                      <div className="text-sm text-primary font-semibold">Solved</div>
                    </div>
                    <div className="w-px h-12 bg-border"></div>
                    <div>
                      <div className="text-3xl font-bold text-accent">
                        {stats.topics.total}
                      </div>
                      <div className="text-sm text-muted-foreground">Topics</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-8">
                    <div>
                      <div className="text-3xl font-bold text-primary">
                        {stats.companies.totalProblems}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Problems</div>
                    </div>
                    <div className="w-px h-12 bg-border"></div>
                    <div>
                      <div className="text-3xl font-bold text-secondary">
                        {stats.companies.solvedProblems}
                      </div>
                      <div className="text-sm text-foreground">Solved</div>
                    </div>
                    <div className="w-px h-12 bg-border"></div>
                    <div>
                      <div className="text-3xl font-bold text-accent">
                        {stats.companies.total}
                      </div>
                      <div className="text-sm text-muted-foreground">Companies</div>
                    </div>
                    {(filters.difficulty.length > 0 || filters.companies.length > 0) && (
                      <>
                        <div className="w-px h-12 bg-border"></div>
                        <div>
                          <div className="text-lg font-bold text-muted-foreground">
                            Filtered
                          </div>
                          <div className="text-xs text-muted-foreground">Results</div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </Container>
      
      {/* DSA Chatbot */}
      {!chatbotOpen && (
        <Button
          onClick={() => {
            setChatbotOpen(true);
            // Force position recalculation after state updates
            setTimeout(() => {
              const event = new Event('resize');
              window.dispatchEvent(event);
            }, 50);
          }}
          className="fixed bottom-6 right-6 rounded-full w-16 h-16 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
          size="lg"
        >
          <span className="text-2xl">🤖</span>
        </Button>
      )}
      
      {chatbotOpen && (
        <DSAChatbot
          isMinimized={chatbotMinimized}
          onToggleMinimize={() => setChatbotMinimized(!chatbotMinimized)}
          onClose={() => {
            setChatbotOpen(false);
            setChatbotMinimized(false);
          }}
        />
      )}
    </div>
  );
};

export default DSASheet;

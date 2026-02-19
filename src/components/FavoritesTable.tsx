import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, ExternalLink, BookOpen, Building2, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { useFavorites } from "@/hooks/useFavorites";
import { dsaTopics } from "@/data/dsaProblems";
import { companies } from "@/data/companyProblems";

const FavoritesTable = () => {
  const { favorites, loading, removeFromFavorites } = useFavorites();

  const favoriteTopics = dsaTopics.filter(topic => favorites.topics.includes(topic.id));
  const favoriteCompanies = companies.filter(company => favorites.companies.includes(company.id));

  if (loading) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm">
        <CardContent className="p-12 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading favorites...</p>
        </CardContent>
      </Card>
    );
  }

  if (favorites.topics.length === 0 && favorites.companies.length === 0 && favorites.problems.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm">
        <CardContent className="p-12 text-center">
          <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">No favorites yet</h3>
          <p className="text-muted-foreground">Start adding topics, companies, and problems to your favorites!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Favorite Topics */}
      {favoriteTopics.length > 0 && (
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Favorite Topics ({favoriteTopics.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {favoriteTopics.map((topic) => (
                <div key={topic.id} className="flex items-center justify-between p-3 bg-background/50 rounded-lg border">
                  <Link to={`/dsa-sheet/topic/${topic.id}`} className="flex items-center gap-3 flex-1 hover:text-primary transition-colors">
                    <div className="text-xl">{topic.icon}</div>
                    <div>
                      <div className="font-medium">{topic.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {topic.solvedProblems}/{topic.totalProblems} solved
                      </div>
                    </div>
                  </Link>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => removeFromFavorites('topic', topic.id)}
                    className="text-yellow-500 hover:text-yellow-600"
                  >
                    <Star className="w-4 h-4 fill-current" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Favorite Companies */}
      {favoriteCompanies.length > 0 && (
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Favorite Companies ({favoriteCompanies.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {favoriteCompanies.map((company) => (
                <div key={company.id} className="flex items-center justify-between p-3 bg-background/50 rounded-lg border">
                  <Link to={`/dsa-sheet/company/${company.id}`} className="flex items-center gap-3 flex-1 hover:text-primary transition-colors">
                    <div className="text-xl">{company.icon}</div>
                    <div>
                      <div className="font-medium">{company.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {company.solvedProblems}/{company.totalProblems} problems
                      </div>
                    </div>
                  </Link>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => removeFromFavorites('company', company.id)}
                    className="text-yellow-500 hover:text-yellow-600"
                  >
                    <Star className="w-4 h-4 fill-current" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Favorite Problems */}
      {favorites.problems.length > 0 && (
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Favorite Problems ({favorites.problems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {favorites.problems.map((problemName) => (
                <div key={problemName} className="flex items-center justify-between p-3 bg-background/50 rounded-lg border">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="font-medium">{problemName}</div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => removeFromFavorites('problem', problemName)}
                    className="text-yellow-500 hover:text-yellow-600"
                  >
                    <Star className="w-4 h-4 fill-current" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FavoritesTable;
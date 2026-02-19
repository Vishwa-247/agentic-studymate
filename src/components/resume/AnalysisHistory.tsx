import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Clock, FileText, Search } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface AnalysisHistoryItem {
  id: string;
  job_role: string;
  job_description: string;
  file_name: string;
  action_verb_score: number;
  star_methodology_score: number;
  ats_score: number;
  overall_score: number;
  created_at: string;
}

interface AnalysisHistoryProps {
  onSelectAnalysis: (analysisId: string) => void;
  selectedAnalysisId?: string;
}

export const AnalysisHistory: React.FC<AnalysisHistoryProps> = ({
  onSelectAnalysis,
  selectedAnalysisId
}) => {
  const { user } = useAuth();
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchAnalysisHistory();
    }
  }, [user?.id]);

  const fetchAnalysisHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/resume/analysis-history/${user?.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch analysis history');
      }
      
      const data = await response.json();
      setHistory(data.history || []);
    } catch (error) {
      console.error('Error fetching analysis history:', error);
      toast({
        title: "Error",
        description: "Failed to load analysis history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = history.filter(item =>
    item.job_role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.file_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500/10 text-green-600 border-green-500/20';
    if (score >= 60) return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
    return 'bg-red-500/10 text-red-600 border-red-500/20';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Analysis History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border bg-card w-full max-w-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Clock className="h-4 w-4 text-primary" />
          </div>
          Analysis History
        </CardTitle>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-3 w-3" />
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-7 h-8 text-xs"
          />
        </div>
      </CardHeader>
      <CardContent className="p-3">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-xs">
            {searchTerm ? 'No matches' : 'No history found'}
          </div>
        ) : (
          <ScrollArea className="h-80">
            <div className="space-y-2">
              {filteredHistory.map((item) => (
                <Card
                  key={item.id}
                  className={cn(
                    "cursor-pointer transition-all duration-200 border",
                    "hover:shadow-sm hover:border-primary/30",
                    selectedAnalysisId === item.id
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  )}
                  onClick={() => onSelectAnalysis(item.id)}
                >
                  <CardContent className="p-3">
                    {/* Compact Layout */}
                    <div className="space-y-2">
                      {/* Header with job role and file */}
                      <div className="flex items-start gap-2">
                        <FileText className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-xs leading-tight mb-1 break-words">{item.job_role}</p>
                          <p className="text-xs text-muted-foreground truncate">{item.file_name}</p>
                        </div>
                      </div>
                      
                      {/* Scores Grid - Compact */}
                      <div className="grid grid-cols-2 gap-1">
                        <div className="flex flex-col items-center p-1.5 bg-muted/30 rounded text-center">
                          <Badge variant="outline" className={cn("mb-1 text-xs px-1.5 py-0.5", getScoreColor(item.action_verb_score))}>
                            {Math.round(item.action_verb_score)}%
                          </Badge>
                          <p className="text-xs text-muted-foreground">Verbs</p>
                        </div>
                        <div className="flex flex-col items-center p-1.5 bg-muted/30 rounded text-center">
                          <Badge variant="outline" className={cn("mb-1 text-xs px-1.5 py-0.5", getScoreColor(item.star_methodology_score))}>
                            {Math.round(item.star_methodology_score)}%
                          </Badge>
                          <p className="text-xs text-muted-foreground">STAR</p>
                        </div>
                        <div className="flex flex-col items-center p-1.5 bg-muted/30 rounded text-center">
                          <Badge variant="outline" className={cn("mb-1 text-xs px-1.5 py-0.5", getScoreColor(item.ats_score))}>
                            {Math.round(item.ats_score)}%
                          </Badge>
                          <p className="text-xs text-muted-foreground">ATS</p>
                        </div>
                        <div className="flex flex-col items-center p-1.5 bg-primary/10 rounded text-center">
                          <Badge variant="outline" className={cn("mb-1 text-xs px-1.5 py-0.5 font-bold", getScoreColor(item.overall_score))}>
                            {Math.round(item.overall_score)}%
                          </Badge>
                          <p className="text-xs text-muted-foreground font-medium">Overall</p>
                        </div>
                      </div>
                      
                      {/* Date */}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1 border-t">
                        <Clock className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{formatDate(item.created_at)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

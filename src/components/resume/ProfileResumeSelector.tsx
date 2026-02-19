import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Upload, Calendar, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface ProfileResume {
  id: string;
  filename: string;
  file_path: string;
  upload_date: string;
  processing_status: string;
}

interface ProfileResumeSelectorProps {
  onSelectResume: (resume: ProfileResume) => void;
  selectedResumeId?: string;
}

export const ProfileResumeSelector: React.FC<ProfileResumeSelectorProps> = ({
  onSelectResume,
  selectedResumeId
}) => {
  const { user } = useAuth();
  const [resumes, setResumes] = useState<ProfileResume[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchProfileResumes();
    }
  }, [user?.id]);

  const fetchProfileResumes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/resume/profile-resumes/${user?.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile resumes');
      }
      
      const data = await response.json();
      setResumes(data.resumes || []);
    } catch (error) {
      console.error('Error fetching profile resumes:', error);
      toast({
        title: "Error",
        description: "Failed to load profile resumes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'processing':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'pending':
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Use Existing Resume
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
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Use Existing Resume
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Select a resume from your profile builder to analyze
        </p>
      </CardHeader>
      <CardContent>
        {resumes.length === 0 ? (
          <div className="text-center py-8">
            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              No resumes found in your profile
            </p>
            <Button variant="outline" onClick={() => window.open('/profile-builder', '_blank')}>
              Go to Profile Builder
            </Button>
          </div>
        ) : (
          <ScrollArea className="h-64">
            <div className="space-y-3">
              {resumes.map((resume) => (
                <Card
                  key={resume.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedResumeId === resume.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => onSelectResume(resume)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm truncate">
                            {resume.filename}
                          </span>
                          {selectedResumeId === resume.id && (
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 mb-2">
                          <Badge 
                            variant="outline" 
                            className={getStatusColor(resume.processing_status)}
                          >
                            {resume.processing_status}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          Uploaded {formatDate(resume.upload_date)}
                        </div>
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
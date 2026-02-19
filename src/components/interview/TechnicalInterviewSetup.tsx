import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChevronLeft, User, FileText, Briefcase, Code, Loader2 } from "lucide-react";
import GlassMorphism from "@/components/ui/GlassMorphism";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface TechnicalInterviewSetupProps {
  onSubmit: (role: string, techStack: string, experience: string, resumeSummary?: string) => void;
  onBack: () => void;
  isLoading?: boolean;
}

const experienceOptions = [
  { value: "0-1", label: "0-1 years", description: "Fresh graduate or entry level" },
  { value: "1-3", label: "1-3 years", description: "Junior developer" },
  { value: "3-5", label: "3-5 years", description: "Mid-level developer" },
  { value: "5+", label: "5+ years", description: "Senior developer" }
];

const popularRoles = [
  "Software Engineer",
  "Frontend Developer", 
  "Backend Developer",
  "Full Stack Developer",
  "DevOps Engineer",
  "Data Scientist",
  "Machine Learning Engineer",
  "Mobile Developer"
];

const popularTechStacks = [
  "JavaScript, React, Node.js",
  "Python, Django, PostgreSQL",
  "Java, Spring Boot, MySQL",
  "C#, .NET, SQL Server",
  "React, TypeScript, Express",
  "Vue.js, Node.js, MongoDB"
];

const TechnicalInterviewSetup = ({ onSubmit, onBack, isLoading }: TechnicalInterviewSetupProps) => {
  const { user } = useAuth();
  const [role, setRole] = useState<string>("");
  const [techStack, setTechStack] = useState<string>("");
  const [experience, setExperience] = useState<string>("");
  const [userProfile, setUserProfile] = useState<any>(null);
  const [resumeData, setResumeData] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserProfileAndResume();
    }
  }, [user]);

  const loadUserProfileAndResume = async () => {
    setLoadingProfile(true);
    try {
      // Load user profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();
      
      if (profile) {
        setUserProfile(profile);
      }

      // Load latest resume
      const { data: resume } = await supabase
        .from('user_resumes')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (resume && resume.extracted_text) {
        setResumeData(resume);
        // Auto-fill fields based on resume if available
        if (resume.ai_analysis && typeof resume.ai_analysis === 'object') {
          // Safely check the analysis structure without assuming specific properties exist
          try {
            const analysis = resume.ai_analysis as Record<string, any>;
            
            // Only set values if they exist and are of expected types
            if (analysis.suggested_roles && Array.isArray(analysis.suggested_roles) && analysis.suggested_roles.length > 0) {
              setRole(String(analysis.suggested_roles[0]));
            }
            
            if (analysis.technical_skills && Array.isArray(analysis.technical_skills) && analysis.technical_skills.length > 0) {
              const skills = analysis.technical_skills.slice(0, 3).map(skill => String(skill)).join(', ');
              setTechStack(skills);
            }
            
            if (analysis.experience_level && typeof analysis.experience_level === 'string') {
              setExperience(analysis.experience_level);
            }
          } catch (error) {
            console.log('Error parsing resume analysis:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const defaultRole = role || "Software Engineer";
    const defaultTechStack = techStack || "JavaScript";
    const defaultExperience = experience || "1-3";

    // Build resume summary for backend personalization
    let resumeSummary = "";
    if (resumeData?.extracted_text) {
      resumeSummary = String(resumeData.extracted_text).substring(0, 500);
    } else if (userProfile) {
      const skills = Array.isArray(userProfile.skills) ? userProfile.skills.join(', ') : (userProfile.skills || '');
      resumeSummary = [
        userProfile.full_name || '',
        userProfile.headline || '',
        skills ? `Skills: ${skills}` : ''
      ].filter(Boolean).join(' - ');
    }

    onSubmit(defaultRole, defaultTechStack, defaultExperience, resumeSummary);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-muted-foreground"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Technical Interview Setup</h2>
          <p className="text-muted-foreground">
            Set up your technical interview based on your profile and resume
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile & Resume Info */}
        <div className="space-y-4">
          {loadingProfile ? (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Loading profile...
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {userProfile && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Profile Info
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Name:</span> {userProfile.full_name || 'Not set'}
                      </div>
                      <div>
                        <span className="font-medium">Email:</span> {userProfile.email || 'Not set'}
                      </div>
                      <div>
                        <span className="font-medium">Profile Completion:</span>
                        <Badge variant="outline" className="ml-2">
                          {userProfile.completion_percentage || 0}%
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {resumeData && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Resume on File
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant="outline" className="border-green-500 text-green-600">
                          ✓ Resume Loaded
                        </Badge>
                      </div>
                      
                      <div className="text-xs space-y-1">
                        <div><span className="font-medium">File:</span> {resumeData.filename}</div>
                        <div><span className="font-medium">Uploaded:</span> {new Date(resumeData.created_at).toLocaleDateString()}</div>
                      </div>

                      {resumeData.extracted_text && (
                        <div className="p-3 bg-muted/50 rounded-md">
                          <p className="text-xs font-medium mb-1">Resume Summary:</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {resumeData.extracted_text.substring(0, 150)}...
                          </p>
                        </div>
                      )}

                      <div className="pt-2 border-t">
                        <p className="text-xs text-primary font-medium">
                          ✨ Questions will be personalized based on your resume
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>

        {/* Setup Form */}
        <div className="lg:col-span-2">
          <GlassMorphism className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Interview Configuration
                </h3>
              </div>

              {/* Job Role */}
              <div className="space-y-3">
                <Label htmlFor="role" className="text-base font-medium">Target Job Role</Label>
                <Input
                  id="role"
                  placeholder="e.g. Software Engineer, Frontend Developer"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full"
                />
                <div className="flex flex-wrap gap-2">
                  {popularRoles.map((popularRole) => (
                    <Button
                      key={popularRole}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setRole(popularRole)}
                      className="text-xs"
                    >
                      {popularRole}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Tech Stack */}
              <div className="space-y-3">
                <Label htmlFor="techStack" className="text-base font-medium flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Technical Stack
                </Label>
                <Input
                  id="techStack"
                  placeholder="e.g. JavaScript, React, Node.js, Python"
                  value={techStack}
                  onChange={(e) => setTechStack(e.target.value)}
                  className="w-full"
                />
                <div className="flex flex-wrap gap-2">
                  {popularTechStacks.map((stack) => (
                    <Button
                      key={stack}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setTechStack(stack)}
                      className="text-xs"
                    >
                      {stack}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Experience Level */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Experience Level</Label>
                <div className="grid grid-cols-2 gap-3">
                  {experienceOptions.map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      variant={experience === option.value ? "default" : "outline"}
                      className="h-auto p-4 flex flex-col items-start text-left"
                      onClick={() => setExperience(option.value)}
                    >
                      <span className="font-medium">{option.label}</span>
                      <span className="text-xs text-muted-foreground mt-1">{option.description}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full h-12 text-lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Setting Up Interview...
                  </>
                ) : (
                  "Start Technical Interview"
                )}
              </Button>
            </form>
          </GlassMorphism>
        </div>
      </div>
    </div>
  );
};

export default TechnicalInterviewSetup;

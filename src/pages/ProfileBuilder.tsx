import CertificationsForm from "@/components/profile/CertificationsForm";
import EducationForm from "@/components/profile/EducationForm";
import ExperienceForm from "@/components/profile/ExperienceForm";
import PersonalInfoForm from "@/components/profile/PersonalInfoForm";
import ProfilePreview from "@/components/profile/ProfilePreview";
import ProfileSection from "@/components/profile/ProfileSection";
import ProjectsForm from "@/components/profile/ProjectsForm";
import ResumeUpload from "@/components/profile/ResumeUpload";
import SkillsForm from "@/components/profile/SkillsForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Container from "@/components/ui/Container";
import { Progress } from "@/components/ui/progress";
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from "@/hooks/useProfile";
import {
  Award,
  Briefcase,
  CheckCircle,
  Code,
  Eye,
  FileText,
  FolderOpen,
  GraduationCap,
  User
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

const sections = [
  { id: 'resume', name: 'Resume Upload', icon: FileText, component: ResumeUpload, description: 'Upload your resume to auto-fill profile data' },
  { id: 'personal', name: 'Personal Info', icon: User, component: PersonalInfoForm, description: 'Basic contact information and professional links' },
  { id: 'education', name: 'Education', icon: GraduationCap, component: EducationForm, description: 'Your academic background and qualifications' },
  { id: 'experience', name: 'Experience', icon: Briefcase, component: ExperienceForm, description: 'Professional work experience and internships' },
  { id: 'projects', name: 'Projects', icon: FolderOpen, component: ProjectsForm, description: 'Personal and professional projects showcase' },
  { id: 'skills', name: 'Skills', icon: Code, component: SkillsForm, description: 'Technical and soft skills with proficiency levels' },
  { id: 'certifications', name: 'Certifications', icon: Award, component: CertificationsForm, description: 'Professional certifications and achievements' },
  { id: 'preview', name: 'Preview', icon: Eye, component: ProfilePreview, description: 'Preview your complete profile' },
];

export default function ProfileBuilder() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, updateProfile, isLoading: profileLoading } = useProfile();
  const [activeSection, setActiveSection] = useState("resume");
  const [editingSection, setEditingSection] = useState<string | null>(null);

  // Combined loading check
  const isPageLoading = authLoading || (profileLoading && !profile);

  const handleEdit = () => {
    setEditingSection(activeSection);
  };

  const handleSave = () => {
    setEditingSection(null);
  };

  const handleCancel = () => {
    setEditingSection(null);
  };

  const currentSection = sections.find(s => s.id === activeSection) || sections[0];

  const getCompletionStatus = (sectionId: string) => {
    if (!profile) return false;
    
    switch (sectionId) {
      case 'resume':
        return !!profile.resumeData;
      case 'personal':
        return !!(profile.personalInfo.fullName && profile.personalInfo.email && profile.personalInfo.phone);
      case 'education':
        return profile.education.length > 0;
      case 'experience':
        return profile.experience.length > 0;
      case 'projects':
        return profile.projects.length > 0;
      case 'skills':
        return profile.skills.length > 0;
      case 'certifications':
        return profile.certifications.length > 0;
      default:
        return false;
    }
  };

  const getSectionCompletionPercentage = (sectionId: string) => {
    if (!profile) return 0;
    
    switch (sectionId) {
      case 'resume':
        return profile.resumeData ? 100 : 0;
      case 'personal':
        const personalFields = ['fullName', 'email', 'phone', 'location', 'linkedin', 'github', 'portfolio'];
        const filledPersonal = personalFields.filter(field => 
          profile.personalInfo[field as keyof typeof profile.personalInfo]
        ).length;
        return Math.round((filledPersonal / personalFields.length) * 100);
      case 'education':
        return profile.education.length > 0 ? 100 : 0;
      case 'experience':
        return profile.experience.length > 0 ? 100 : 0;
      case 'projects':
        return profile.projects.length > 0 ? 100 : 0;
      case 'skills':
        return profile.skills.length > 0 ? 100 : 0;
      case 'certifications':
        return profile.certifications.length > 0 ? 100 : 0;
      default:
        return 0;
    }
  };

  // Remove full-page loading - we'll use inline loading indicators instead

  return (
    <Container className="py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">Profile Builder</h1>
              <p className="text-muted-foreground">
                Build your professional profile to get personalized recommendations
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate(-1)}
                className="px-3 py-1"
              >
                <ChevronLeft className="mr-1 h-4 w-4" /> Back
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.reload()}
                className="px-3 py-1"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </Button>
              <Badge variant="secondary" className="px-4 py-2">
                {isPageLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-3 w-3 border-b border-current"></div>
                    {authLoading ? 'Authenticating...' : 'Loading profile...'}
                  </div>
                ) : (
                  `${profile?.completionPercentage || 0}% Complete`
                )}
              </Badge>
            </div>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between text-sm text-muted-foreground mb-2">
                    <span>Profile Completion</span>
                    <span>{profile?.completionPercentage || 0}%</span>
                  </div>
                  <Progress value={profile?.completionPercentage || 0} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Form */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardContent className="pt-6">
                <div className="flex justify-center mb-6">
                  <div className="relative w-28 h-28">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-24 h-24 rounded-full border-4 border-muted relative">
                        <div 
                          className="absolute inset-0 rounded-full border-4 border-primary transition-all duration-500"
                          style={{
                            clipPath: `polygon(50% 50%, 50% 0%, ${50 + (profile?.completionPercentage || 0) * 0.5}% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, 50% 0%)`
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-lg font-bold">
                            {profile?.completionPercentage || 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="text-center mb-6">
                  <h3 className="font-semibold text-lg mb-2">Profile Completion</h3>
                  <p className="text-sm text-muted-foreground">
                    Complete all sections to maximize your profile visibility
                  </p>
                </div>

                <div className="space-y-2">
                  {sections.map((section) => {
                    const isCompleted = getCompletionStatus(section.id);
                    return (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-all duration-200 ${
                          activeSection === section.id
                            ? 'bg-primary text-primary-foreground shadow-md'
                            : 'hover:bg-muted hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-1 rounded ${activeSection === section.id ? 'bg-primary-foreground/20' : ''}`}>
                            <section.icon className="h-4 w-4" />
                          </div>
                          <span className="text-sm font-medium">{section.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {isCompleted ? (
                            <CheckCircle className="h-4 w-4 text-success" />
                          ) : (
                            <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {profile && (
                  <div className="mt-6 pt-6 border-t space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Last updated</span>
                      <span>{new Date(profile.updatedAt).toLocaleDateString()}</span>
                    </div>
                    
                    {profile.resumeData && (
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-success" />
                        <span className="text-sm text-success">Resume uploaded</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {isPageLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {authLoading ? 'Authenticating...' : 'Loading profile...'}
                  </p>
                </div>
              </div>
            ) : (
              <ProfileSection
                title={currentSection.name}
                description={currentSection.description}
                isCompleted={getCompletionStatus(activeSection)}
                completionPercentage={getSectionCompletionPercentage(activeSection)}
                icon={currentSection.icon && <currentSection.icon className="h-5 w-5" />}
                onEdit={handleEdit}
                onSave={handleSave}
                onCancel={handleCancel}
                isEditing={editingSection === activeSection}
                isLoading={profileLoading}
              >
                <currentSection.component 
                  isEditing={editingSection === activeSection}
                  onSave={handleSave}
                  onCancel={handleCancel}
                />
              </ProfileSection>
            )}
          </div>
        </div>
      </div>
    </Container>
  );
}

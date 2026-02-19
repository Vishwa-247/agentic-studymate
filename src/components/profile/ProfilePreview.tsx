import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProfile } from "@/hooks/useProfile";
import {
  Award,
  Briefcase, Code,
  ExternalLink,
  FileText,
  Github,
  Globe,
  GraduationCap,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  User
} from "lucide-react";

export default function ProfilePreview() {
  const { profile } = useProfile();

  const formatSocialUrl = (url: string | undefined, platform: 'linkedin' | 'github' | 'portfolio'): string | undefined => {
    if (!url) return undefined;

    // If already a full URL, return as-is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    // Clean up common prefixes
    let cleanUrl = url
      .replace(/^(linkedin|github|www\.|@|\|)/gi, '')
      .replace(/\s+/g, '')
      .trim();

    // Remove "Vishwa Thouti" type text (name after username)
    cleanUrl = cleanUrl.split(/[\s|]/)[0];

    // Build proper URL based on platform
    switch (platform) {
      case 'linkedin':
        // Handle both /in/ and /company/ formats
        if (!cleanUrl.startsWith('/')) {
          cleanUrl = `/in/${cleanUrl}`;
        }
        return `https://linkedin.com${cleanUrl}`;
      case 'github':
        return `https://github.com/${cleanUrl}`;
      case 'portfolio':
        return url.startsWith('www.') ? `https://${url}` : url;
      default:
        return url;
    }
  };

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No profile data available</p>
      </div>
    );
  }

  const { personalInfo, education, experience, projects, skills, certifications, resumeData } = profile;

  const handlePrint = () => {
    window.print();
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Beginner": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "Intermediate": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "Advanced": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "Expert": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Profile Preview</h2>
          <p className="text-muted-foreground">
            Preview how your profile will appear to others.
          </p>
        </div>
        <Button onClick={handlePrint} variant="outline">
          <FileText className="h-4 w-4 mr-2" />
          Print/Export
        </Button>
      </div>

      {/* Header Section */}
      <Card className="print:shadow-none print:border-0">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <User className="h-12 w-12 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{personalInfo.fullName || "Your Name"}</h1>
              <div className="flex flex-wrap justify-center gap-4 mt-2 text-muted-foreground">
                {personalInfo.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    <span>{personalInfo.email}</span>
                  </div>
                )}
                {personalInfo.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    <span>{personalInfo.phone}</span>
                  </div>
                )}
                {personalInfo.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{personalInfo.location}</span>
                  </div>
                )}
              </div>
              <div className="flex justify-center gap-4 mt-3">
                {personalInfo.linkedin && (
                  <a href={formatSocialUrl(personalInfo.linkedin, 'linkedin')} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                    <Linkedin className="h-4 w-4" />
                    LinkedIn
                  </a>
                )}
                {personalInfo.github && (
                  <a href={formatSocialUrl(personalInfo.github, 'github')} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                    <Github className="h-4 w-4" />
                    GitHub
                  </a>
                )}
                {personalInfo.portfolio && (
                  <a href={formatSocialUrl(personalInfo.portfolio, 'portfolio')} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                    <Globe className="h-4 w-4" />
                    Portfolio
                  </a>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skills Section */}
      {skills.length > 0 && (
        <Card className="print:shadow-none print:border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Skills & Expertise
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {['Technical', 'Soft', 'Language', 'Framework', 'Tool'].map(category => {
                const categorySkills = skills.filter(skill => skill.category === category);
                if (categorySkills.length === 0) return null;
                
                return (
                  <div key={category}>
                    <h4 className="font-medium text-sm mb-2">{category} Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {categorySkills.map((skill, index) => (
                        <Badge key={index} className={getLevelColor(skill.level)}>
                          {skill.name} • {skill.level}
                        </Badge>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Experience Section */}
      {experience.length > 0 && (
        <Card className="print:shadow-none print:border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Work Experience
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {experience.map((exp) => (
                <div key={exp.id} className="border-l-2 border-primary/20 pl-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold">{exp.position}</h3>
                      <p className="text-muted-foreground">{exp.company} • {exp.location}</p>
                    </div>
                    <Badge variant="outline">
                      {exp.startDate} - {exp.current ? "Present" : exp.endDate}
                    </Badge>
                  </div>
                  <p className="text-sm mb-2">{exp.description}</p>
                  {exp.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {exp.technologies.map((tech) => (
                        <Badge key={tech} variant="secondary" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Projects Section */}
      {projects.length > 0 && (
        <Card className="print:shadow-none print:border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {projects.map((project) => (
                <div key={project.id} className="border-l-2 border-primary/20 pl-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{project.title}</h3>
                        {project.githubUrl && (
                          <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary print:hidden">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                        {project.liveUrl && (
                          <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary print:hidden">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                      <Badge variant="outline" className="mb-2">
                        {project.startDate} - {project.endDate}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm mb-2">{project.description}</p>
                  {project.highlights.length > 0 && (
                    <ul className="text-sm text-muted-foreground list-disc list-inside mb-2">
                      {project.highlights.map((highlight, index) => (
                        <li key={index}>{highlight}</li>
                      ))}
                    </ul>
                  )}
                  {project.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {project.technologies.map((tech) => (
                        <Badge key={tech} variant="secondary" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Education Section */}
      {education.length > 0 && (
        <Card className="print:shadow-none print:border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Education
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {education.map((edu) => (
                <div key={edu.id} className="border-l-2 border-primary/20 pl-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold">{edu.degree} in {edu.field}</h3>
                      <p className="text-muted-foreground">{edu.institution}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">{edu.startYear} - {edu.endYear}</Badge>
                      {edu.grade && <p className="text-sm text-muted-foreground mt-1">{edu.grade}</p>}
                    </div>
                  </div>
                  {edu.description && <p className="text-sm">{edu.description}</p>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Certifications Section */}
      {certifications.length > 0 && (
        <Card className="print:shadow-none print:border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Certifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {certifications.map((cert) => (
                <div key={cert.id} className="border-l-2 border-primary/20 pl-4">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <h3 className="font-semibold">{cert.name}</h3>
                      <p className="text-muted-foreground">{cert.issuer}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">Issued: {cert.issueDate}</p>
                      {cert.expiryDate && <p className="text-sm">Expires: {cert.expiryDate}</p>}
                    </div>
                  </div>
                  {cert.credentialId && (
                    <p className="text-sm text-muted-foreground">ID: {cert.credentialId}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resume Analysis */}
      {resumeData && (
        <Card className="print:hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              AI Resume Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {resumeData.aiAnalysis && (
              <div>
                <h4 className="font-medium mb-2">Analysis Summary</h4>
                <p className="text-sm">{resumeData.aiAnalysis}</p>
              </div>
            )}
            
            {resumeData.skillGaps && resumeData.skillGaps.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Skill Gaps Identified</h4>
                <div className="flex flex-wrap gap-2">
                  {resumeData.skillGaps.map((skill, index) => (
                    <Badge key={index} variant="outline" className="bg-yellow-50 text-yellow-700">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {resumeData.recommendations && resumeData.recommendations.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Recommendations</h4>
                <ul className="space-y-1">
                  {resumeData.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

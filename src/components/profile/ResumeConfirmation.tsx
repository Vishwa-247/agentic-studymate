import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, User, GraduationCap, Briefcase, Code, Award } from "lucide-react";

interface ExtractedData {
  personalInfo: any;
  education: any[];
  experience: any[];
  projects: any[];
  skills: any[];
  certifications: any[];
}

interface ResumeConfirmationProps {
  extractedData: ExtractedData;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ResumeConfirmation({ 
  extractedData, 
  onConfirm, 
  onCancel, 
  isLoading = false 
}: ResumeConfirmationProps) {
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          Resume Data Extracted Successfully
        </CardTitle>
        <p className="text-muted-foreground">
          Review the extracted information below and confirm to auto-fill your profile.
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Personal Information */}
        {extractedData.personalInfo && Object.keys(extractedData.personalInfo).length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <User className="h-4 w-4" />
              <h3 className="font-medium">Personal Information</h3>
              <Badge variant="outline">{Object.keys(extractedData.personalInfo).filter(k => extractedData.personalInfo[k]).length} fields</Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm bg-muted/30 p-3 rounded-lg">
              {extractedData.personalInfo.fullName && (
                <div><span className="font-medium">Name:</span> {extractedData.personalInfo.fullName}</div>
              )}
              {extractedData.personalInfo.email && (
                <div><span className="font-medium">Email:</span> {extractedData.personalInfo.email}</div>
              )}
              {extractedData.personalInfo.phone && (
                <div><span className="font-medium">Phone:</span> {extractedData.personalInfo.phone}</div>
              )}
              {extractedData.personalInfo.location && (
                <div><span className="font-medium">Location:</span> {extractedData.personalInfo.location}</div>
              )}
            </div>
          </div>
        )}

        {/* Education */}
        {extractedData.education && extractedData.education.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <GraduationCap className="h-4 w-4" />
              <h3 className="font-medium">Education</h3>
              <Badge variant="outline">{extractedData.education.length} entries</Badge>
            </div>
            <div className="space-y-2">
              {extractedData.education.slice(0, 2).map((edu, index) => (
                <div key={index} className="text-sm bg-muted/30 p-3 rounded-lg">
                  <div className="font-medium">{edu.degree} in {edu.field}</div>
                  <div className="text-muted-foreground">{edu.institution} ({edu.startYear} - {edu.endYear})</div>
                </div>
              ))}
              {extractedData.education.length > 2 && (
                <div className="text-sm text-muted-foreground">
                  +{extractedData.education.length - 2} more entries
                </div>
              )}
            </div>
          </div>
        )}

        {/* Experience */}
        {extractedData.experience && extractedData.experience.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Briefcase className="h-4 w-4" />
              <h3 className="font-medium">Experience</h3>
              <Badge variant="outline">{extractedData.experience.length} entries</Badge>
            </div>
            <div className="space-y-2">
              {extractedData.experience.slice(0, 2).map((exp, index) => (
                <div key={index} className="text-sm bg-muted/30 p-3 rounded-lg">
                  <div className="font-medium">{exp.position}</div>
                  <div className="text-muted-foreground">{exp.company} ({exp.startDate} - {exp.endDate || 'Present'})</div>
                </div>
              ))}
              {extractedData.experience.length > 2 && (
                <div className="text-sm text-muted-foreground">
                  +{extractedData.experience.length - 2} more entries
                </div>
              )}
            </div>
          </div>
        )}

        {/* Skills */}
        {extractedData.skills && extractedData.skills.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Code className="h-4 w-4" />
              <h3 className="font-medium">Skills</h3>
              <Badge variant="outline">{extractedData.skills.length} skills</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {extractedData.skills.slice(0, 10).map((skill, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {skill.name} ({skill.level})
                </Badge>
              ))}
              {extractedData.skills.length > 10 && (
                <Badge variant="outline" className="text-xs">
                  +{extractedData.skills.length - 10} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Projects */}
        {extractedData.projects && extractedData.projects.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Code className="h-4 w-4" />
              <h3 className="font-medium">Projects</h3>
              <Badge variant="outline">{extractedData.projects.length} projects</Badge>
            </div>
            <div className="space-y-2">
              {extractedData.projects.slice(0, 2).map((proj, index) => (
                <div key={index} className="text-sm bg-muted/30 p-3 rounded-lg">
                  <div className="font-medium">{proj.title}</div>
                  <div className="text-muted-foreground line-clamp-2">{proj.description}</div>
                </div>
              ))}
              {extractedData.projects.length > 2 && (
                <div className="text-sm text-muted-foreground">
                  +{extractedData.projects.length - 2} more projects
                </div>
              )}
            </div>
          </div>
        )}

        {/* Certifications */}
        {extractedData.certifications && extractedData.certifications.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Award className="h-4 w-4" />
              <h3 className="font-medium">Certifications</h3>
              <Badge variant="outline">{extractedData.certifications.length} certificates</Badge>
            </div>
            <div className="space-y-2">
              {extractedData.certifications.slice(0, 3).map((cert, index) => (
                <div key={index} className="text-sm bg-muted/30 p-3 rounded-lg">
                  <div className="font-medium">{cert.name}</div>
                  <div className="text-muted-foreground">{cert.issuer}</div>
                </div>
              ))}
              {extractedData.certifications.length > 3 && (
                <div className="text-sm text-muted-foreground">
                  +{extractedData.certifications.length - 3} more certificates
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <Button 
            onClick={onConfirm} 
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? "Applying..." : "Apply Data to Profile"}
          </Button>
          <Button 
            variant="outline" 
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>

        <div className="text-xs text-muted-foreground bg-yellow-50 dark:bg-yellow-950/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium text-yellow-800 dark:text-yellow-200">Note:</div>
              <div className="text-yellow-700 dark:text-yellow-300">
                This will replace your current profile data with the extracted information. 
                You can always edit individual sections later.
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
export interface ExtractedResumeData {
  personalInfo?: {
    fullName?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
  experience?: Array<{
    id: string;
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
    technologies: string[];
    location: string;
  }>;
  education?: Array<{
    id: string;
    institution: string;
    degree: string;
    field: string;
    startYear: string;
    endYear: string;
    grade?: string;
    description?: string;
  }>;
  projects?: Array<{
    id: string;
    title: string;
    description: string;
    technologies: string[];
    startDate: string;
    endDate: string;
    githubUrl?: string;
    liveUrl?: string;
    highlights: string[];
  }>;
  skills?: Array<{
    name: string;
    level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
    category: 'Technical' | 'Soft' | 'Language' | 'Framework' | 'Tool';
  }>;
  certifications?: Array<{
    id: string;
    name: string;
    issuer: string;
    issueDate: string;
    expiryDate?: string;
    credentialId?: string;
    credentialUrl?: string;
  }>;
}

export interface ResumeExtraction {
  id: string;
  user_id: string;
  resume_id: string;
  extracted_data: ExtractedResumeData;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  extraction_type: string;
  confidence_score: number;
  created_at: string;
  updated_at: string;
  applied_at?: string;
  applied_by?: string;
}

export interface AIProfileSuggestion {
  section: 'personalInfo' | 'experience' | 'education' | 'projects' | 'skills' | 'certifications';
  type: 'add' | 'update' | 'improve';
  title: string;
  description: string;
  data: any;
  confidence: number;
  applied: boolean;
}
import { ExtractedResumeData } from '@/types/resume';

export interface ParsedResumeData {
  success: boolean;
  extracted_data: ExtractedResumeData;
  confidence_score: number;
  message: string;
}

export class ResumeParsingService {
  async parseResume(file: File): Promise<ParsedResumeData> {
    try {
      console.log('🔍 Starting built-in resume parsing for:', file.name);
      
      // Extract text from PDF or DOC file
      const extractedText = await this.extractTextFromFile(file);
      
      // Parse the text to extract structured data
      const extractedData = this.parseTextToStructuredData(extractedText);
      
      console.log('✅ Resume parsing completed');
      
      return {
        success: true,
        extracted_data: extractedData,
        confidence_score: 0.8,
        message: 'Resume parsed successfully using built-in parser'
      };
      
    } catch (error) {
      console.error('❌ Resume parsing failed:', error);
      return {
        success: false,
        extracted_data: {} as ExtractedResumeData,
        confidence_score: 0,
        message: `Failed to parse resume: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async extractTextFromFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      if (file.type === 'application/pdf') {
        // For PDF files, we'll use a simple approach
        // In production, you'd want to use pdf-lib or similar
        const reader = new FileReader();
        reader.onload = () => {
          // This is a simplified approach - in reality, PDF parsing is more complex
          const text = this.extractTextFromPDF(reader.result as ArrayBuffer);
          resolve(text);
        };
        reader.onerror = () => reject(new Error('Failed to read PDF file'));
        reader.readAsArrayBuffer(file);
      } else if (file.type.includes('word') || file.type.includes('document')) {
        // For Word documents, we'll extract what we can
        const reader = new FileReader();
        reader.onload = () => {
          const text = this.extractTextFromWord(reader.result as string);
          resolve(text);
        };
        reader.onerror = () => reject(new Error('Failed to read Word document'));
        reader.readAsText(file);
      } else {
        reject(new Error('Unsupported file type. Please upload PDF or Word document.'));
      }
    });
  }

  private extractTextFromPDF(buffer: ArrayBuffer): string {
    // Simplified PDF text extraction
    // In production, use a proper PDF parser like pdf-lib
    const uint8Array = new Uint8Array(buffer);
    const text = new TextDecoder().decode(uint8Array);
    
    // Extract readable text using simple pattern matching
    const textMatch = text.match(/BT\s+.*?ET/g);
    if (textMatch) {
      return textMatch.join(' ').replace(/[^\x20-\x7E]/g, ' ').trim();
    }
    
    // Fallback to basic string extraction
    return text.replace(/[^\x20-\x7E\n]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  private extractTextFromWord(text: string): string {
    // Basic Word document text extraction
    return text.replace(/[^\x20-\x7E\n]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  private parseTextToStructuredData(text: string): ExtractedResumeData {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    return {
      personalInfo: this.extractPersonalInfo(text, lines),
      education: this.extractEducation(text, lines),
      experience: this.extractExperience(text, lines),
      skills: this.extractSkills(text, lines),
      projects: this.extractProjects(text, lines),
      certifications: this.extractCertifications(text, lines)
    };
  }

  private extractPersonalInfo(text: string, lines: string[]) {
    const personalInfo: any = {};
    
    // Extract name (usually first non-empty line or pattern)
    const namePattern = /^[A-Z][a-z]+ [A-Z][a-z]+/;
    for (const line of lines) {
      if (namePattern.test(line) && line.length < 50) {
        personalInfo.full_name = line;
        break;
      }
    }
    
    // Extract email
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) {
      personalInfo.email = emailMatch[0];
    }
    
    // Extract phone
    const phoneMatch = text.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    if (phoneMatch) {
      personalInfo.phone = phoneMatch[0];
    }
    
    // Extract LinkedIn
    const linkedinMatch = text.match(/linkedin\.com\/in\/[a-zA-Z0-9-]+/);
    if (linkedinMatch) {
      personalInfo.linkedin = `https://${linkedinMatch[0]}`;
    }
    
    // Extract GitHub
    const githubMatch = text.match(/github\.com\/[a-zA-Z0-9-]+/);
    if (githubMatch) {
      personalInfo.github = `https://${githubMatch[0]}`;
    }
    
    // Extract location (look for city, state patterns)
    const locationMatch = text.match(/[A-Z][a-z]+,\s*[A-Z]{2}|[A-Z][a-z]+\s*[A-Z][a-z]+,\s*[A-Z][a-z]+/);
    if (locationMatch) {
      personalInfo.location = locationMatch[0];
    }
    
    return personalInfo;
  }

  private extractEducation(text: string, lines: string[]) {
    const education: any[] = [];
    const educationKeywords = ['education', 'academic', 'university', 'college', 'degree', 'bachelor', 'master', 'phd'];
    
    const educationSectionIndex = lines.findIndex(line => 
      educationKeywords.some(keyword => line.toLowerCase().includes(keyword))
    );
    
    if (educationSectionIndex >= 0) {
      // Look for education entries after the education section
      for (let i = educationSectionIndex + 1; i < lines.length && i < educationSectionIndex + 10; i++) {
        const line = lines[i];
        
        // Look for degree patterns
        if (line.match(/(bachelor|master|phd|b\.s\.|m\.s\.|b\.a\.|m\.a\.)/i)) {
          const institution = lines[i + 1] || '';
          const yearMatch = line.match(/\b(19|20)\d{2}\b/) || institution.match(/\b(19|20)\d{2}\b/);
          
          education.push({
            degree: line,
            institution: institution,
            field: '',
            start_year: '',
            end_year: yearMatch ? yearMatch[0] : '',
            gpa: ''
          });
        }
      }
    }
    
    return education;
  }

  private extractExperience(text: string, lines: string[]) {
    const experience: any[] = [];
    const experienceKeywords = ['experience', 'employment', 'work', 'career', 'professional'];
    
    const experienceSectionIndex = lines.findIndex(line => 
      experienceKeywords.some(keyword => line.toLowerCase().includes(keyword))
    );
    
    if (experienceSectionIndex >= 0) {
      // Look for job entries after the experience section
      for (let i = experienceSectionIndex + 1; i < lines.length && i < experienceSectionIndex + 20; i++) {
        const line = lines[i];
        
        // Look for job title patterns (followed by company name)
        if (line.length > 5 && line.length < 100 && !line.includes('@')) {
          const company = lines[i + 1] || '';
          const dateMatch = (line + ' ' + company).match(/\b(19|20)\d{2}\s*-\s*((19|20)\d{2}|present)/i);
          
          if (company.length > 2 && company.length < 100) {
            experience.push({
              position: line,
              company: company,
              start_date: dateMatch ? dateMatch[0].split('-')[0].trim() : '',
              end_date: dateMatch ? dateMatch[0].split('-')[1].trim() : '',
              description: lines[i + 2] || '',
              location: ''
            });
          }
        }
      }
    }
    
    return experience;
  }

  private extractSkills(text: string, lines: string[]) {
    const skillsData: Array<{name: string, level: string, category: string}> = [];
    const skillsKeywords = ['skills', 'technologies', 'technical', 'programming'];
    
    const skillsSectionIndex = lines.findIndex(line => 
      skillsKeywords.some(keyword => line.toLowerCase().includes(keyword))
    );
    
    const rawSkills: string[] = [];
    
    if (skillsSectionIndex >= 0) {
      // Look for skills after the skills section
      for (let i = skillsSectionIndex + 1; i < lines.length && i < skillsSectionIndex + 10; i++) {
        const line = lines[i];
        
        // Split by common delimiters
        const skillsInLine = line.split(/[,;|]/).map(s => s.trim()).filter(s => s.length > 1);
        rawSkills.push(...skillsInLine);
      }
    }
    
    // Also look for common programming languages and technologies throughout the text
    const commonSkills = [
      'JavaScript', 'Python', 'Java', 'C++', 'C#', 'React', 'Angular', 'Vue',
      'Node.js', 'Express', 'Django', 'Flask', 'Spring', 'MongoDB', 'PostgreSQL',
      'MySQL', 'Git', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP'
    ];
    
    commonSkills.forEach(skill => {
      if (text.toLowerCase().includes(skill.toLowerCase()) && !rawSkills.includes(skill)) {
        rawSkills.push(skill);
      }
    });
    
    // Convert raw skills to structured format
    return rawSkills.slice(0, 20).map(skill => ({
      name: skill,
      level: 'Intermediate' as const,
      category: this.categorizeSkill(skill)
    }));
  }

  private categorizeSkill(skill: string): 'Technical' | 'Soft' | 'Language' | 'Framework' | 'Tool' {
    const frameworks = ['React', 'Angular', 'Vue', 'Express', 'Django', 'Flask', 'Spring'];
    const tools = ['Git', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP'];
    const languages = ['JavaScript', 'Python', 'Java', 'C++', 'C#'];
    
    if (frameworks.some(f => skill.includes(f))) return 'Framework';
    if (tools.some(t => skill.includes(t))) return 'Tool';
    if (languages.some(l => skill.includes(l))) return 'Language';
    
    return 'Technical';
  }

  private extractProjects(text: string, lines: string[]) {
    const projects: any[] = [];
    const projectKeywords = ['projects', 'portfolio', 'work samples'];
    
    const projectsSectionIndex = lines.findIndex(line => 
      projectKeywords.some(keyword => line.toLowerCase().includes(keyword))
    );
    
    if (projectsSectionIndex >= 0) {
      // Look for project entries after the projects section
      for (let i = projectsSectionIndex + 1; i < lines.length && i < projectsSectionIndex + 15; i++) {
        const line = lines[i];
        
        if (line.length > 5 && line.length < 100) {
          const description = lines[i + 1] || '';
          
          projects.push({
            title: line,
            description: description,
            technologies: [],
            github_url: '',
            live_url: ''
          });
        }
      }
    }
    
    return projects;
  }

  private extractCertifications(text: string, lines: string[]) {
    const certifications: any[] = [];
    const certificationKeywords = ['certifications', 'certificates', 'credentials'];
    
    const certificationsSectionIndex = lines.findIndex(line => 
      certificationKeywords.some(keyword => line.toLowerCase().includes(keyword))
    );
    
    if (certificationsSectionIndex >= 0) {
      // Look for certification entries after the certifications section
      for (let i = certificationsSectionIndex + 1; i < lines.length && i < certificationsSectionIndex + 10; i++) {
        const line = lines[i];
        
        if (line.length > 5 && line.length < 100) {
          const issuer = lines[i + 1] || '';
          const yearMatch = (line + ' ' + issuer).match(/\b(19|20)\d{2}\b/);
          
          certifications.push({
            name: line,
            issuer: issuer,
            issue_date: yearMatch ? yearMatch[0] : '',
            expiry_date: '',
            credential_id: '',
            credential_url: ''
          });
        }
      }
    }
    
    return certifications;
  }
}

export const resumeParsingService = new ResumeParsingService();
import { supabase } from '@/integrations/supabase/client';
import { ProfileFormData, UserProfile } from '@/types/profile';

export interface ResumeUploadResponse {
  success: boolean;
  extraction_id: string;
  extracted_data: any;
  confidence_score: number;
  message: string;
  user_id?: string; // Add user_id field for explicit userId passing
  metadata: {
    filename: string;
    file_size: number;
    extraction_date: string;
    ai_provider: string;
    storage_path: string;
  };
}

export const profileService = {
  async getProfile(userId: string): Promise<UserProfile> {
    try {
      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        return this.createEmptyProfile(userId);
      }

      // Get related data
      const [educationData, experienceData, projectsData, skillsData, certificationsData, resumeData] = await Promise.all([
        supabase.from('user_education').select('*').eq('user_id', userId),
        supabase.from('user_experience').select('*').eq('user_id', userId),
        supabase.from('user_projects').select('*').eq('user_id', userId),
        supabase.from('user_skills').select('*').eq('user_id', userId),
        supabase.from('user_certifications').select('*').eq('user_id', userId),
        supabase.from('user_resumes').select('*').eq('user_id', userId).maybeSingle()
      ]);

      const userProfile: UserProfile = {
        userId,
        personalInfo: {
          fullName: profile?.full_name || '',
          email: profile?.email || '',
          phone: profile?.phone || '',
          location: profile?.location || '',
          linkedin: profile?.linkedin_url || '',
          github: profile?.github_url || '',
          portfolio: profile?.portfolio_url || '',
        },
        education: (educationData.data || []).map((edu: any) => ({
          id: edu.id,
          institution: edu.institution,
          degree: edu.degree,
          field: edu.field_of_study,
          startYear: edu.start_year || '',
          endYear: edu.end_year || '',
          grade: edu.grade || '',
          description: edu.description || '',
        })),
        experience: (experienceData.data || []).map((exp: any) => ({
          id: exp.id,
          company: exp.company,
          position: exp.position,
          startDate: exp.start_date,
          endDate: exp.end_date || '',
          current: exp.is_current || false,
          description: exp.description || '',
          technologies: exp.technologies || [],
          location: exp.location || '',
        })),
        projects: (projectsData.data || []).map((proj: any) => ({
          id: proj.id,
          title: proj.title,
          description: proj.description || '',
          technologies: proj.technologies || [],
          startDate: proj.start_date || '',
          endDate: proj.end_date || '',
          githubUrl: proj.github_url || '',
          liveUrl: proj.live_url || '',
          highlights: proj.highlights || [],
        })),
        skills: (skillsData.data || []).map((skill: any) => ({
          name: skill.name,
          level: skill.level as 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert',
          category: skill.category as 'Technical' | 'Soft' | 'Language' | 'Framework' | 'Tool',
        })),
        certifications: (certificationsData.data || []).map((cert: any) => ({
          id: cert.id,
          name: cert.name,
          issuer: cert.issuer,
          issueDate: cert.issue_date || '',
          expiryDate: cert.expiry_date || '',
          credentialId: cert.credential_id || '',
          credentialUrl: cert.credential_url || '',
        })),
        summary: profile?.professional_summary || '',
        resumeData: resumeData.data ? {
          filename: resumeData.data.filename,
          uploadDate: resumeData.data.upload_date,
          parsedData: resumeData.data.ai_analysis as Record<string, unknown>,
          extractedText: resumeData.data.extracted_text || '',
          aiAnalysis: typeof resumeData.data.ai_analysis === 'string' 
            ? resumeData.data.ai_analysis 
            : JSON.stringify(resumeData.data.ai_analysis || {}),
          skillGaps: resumeData.data.skill_gaps || [],
          recommendations: resumeData.data.recommendations || [],
        } : undefined,
        completionPercentage: profile?.completion_percentage || 0,
        createdAt: profile?.created_at || new Date().toISOString(),
        updatedAt: profile?.updated_at || new Date().toISOString(),
      };

      return userProfile;
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      return this.createEmptyProfile(userId);
    }
  },

  async updateProfile(userId: string, updates: Partial<ProfileFormData>): Promise<UserProfile> {
    try {
      // Update personal info in user_profiles table
      if (updates.personalInfo) {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .upsert({
            user_id: userId,
            full_name: updates.personalInfo.fullName,
            email: updates.personalInfo.email,
            phone: updates.personalInfo.phone,
            location: updates.personalInfo.location,
            linkedin_url: updates.personalInfo.linkedin,
            github_url: updates.personalInfo.github,
            portfolio_url: updates.personalInfo.portfolio,
          });

        if (profileError) {
          console.error('Profile update error:', profileError);
          throw new Error('Failed to update profile');
        }
      }

      // Update education
      if (updates.education) {
        // Delete existing education
        await supabase.from('user_education').delete().eq('user_id', userId);
        
        // Insert new education
        if (updates.education.length > 0) {
          const { error: eduError } = await supabase
            .from('user_education')
            .insert(updates.education.map(edu => ({
              user_id: userId,
              institution: edu.institution,
              degree: edu.degree,
              field_of_study: edu.field,
              start_year: edu.startYear,
              end_year: edu.endYear,
              grade: edu.grade,
              description: edu.description,
            })));

          if (eduError) {
            console.error('Education update error:', eduError);
          }
        }
      }

      // Update experience
      if (updates.experience) {
        await supabase.from('user_experience').delete().eq('user_id', userId);
        
        if (updates.experience.length > 0) {
          const { error: expError } = await supabase
            .from('user_experience')
            .insert(updates.experience.map(exp => ({
              user_id: userId,
              company: exp.company,
              position: exp.position,
              start_date: exp.startDate,
              end_date: exp.endDate,
              is_current: exp.current,
              description: exp.description,
              technologies: exp.technologies,
              location: exp.location,
            })));

          if (expError) {
            console.error('Experience update error:', expError);
          }
        }
      }

      // Update projects
      if (updates.projects) {
        await supabase.from('user_projects').delete().eq('user_id', userId);
        
        if (updates.projects.length > 0) {
          const { error: projError } = await supabase
            .from('user_projects')
            .insert(updates.projects.map(proj => ({
              user_id: userId,
              title: proj.title,
              description: proj.description,
              technologies: proj.technologies,
              start_date: proj.startDate,
              end_date: proj.endDate,
              github_url: proj.githubUrl,
              live_url: proj.liveUrl,
              highlights: proj.highlights,
            })));

          if (projError) {
            console.error('Projects update error:', projError);
          }
        }
      }

      // Update skills
      if (updates.skills) {
        await supabase.from('user_skills').delete().eq('user_id', userId);
        
        if (updates.skills.length > 0) {
          const { error: skillsError } = await supabase
            .from('user_skills')
            .insert(updates.skills.map(skill => ({
              user_id: userId,
              name: skill.name,
              level: skill.level,
              category: skill.category,
            })));

          if (skillsError) {
            console.error('Skills update error:', skillsError);
          }
        }
      }

      // Update certifications
      if (updates.certifications) {
        await supabase.from('user_certifications').delete().eq('user_id', userId);
        
        if (updates.certifications.length > 0) {
          const { error: certError } = await supabase
            .from('user_certifications')
            .insert(updates.certifications.map(cert => ({
              user_id: userId,
              name: cert.name,
              issuer: cert.issuer,
              issue_date: cert.issueDate,
              expiry_date: cert.expiryDate,
              credential_id: cert.credentialId,
              credential_url: cert.credentialUrl,
            })));

          if (certError) {
            console.error('Certifications update error:', certError);
          }
        }
      }

      // Calculate and update completion percentage
      const completionPercentage = await this.calculateCompletionPercentage(userId);
      await supabase
        .from('user_profiles')
        .update({ completion_percentage: completionPercentage })
        .eq('user_id', userId);

      // Return updated profile
      return await this.getProfile(userId);
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw new Error(`Failed to update profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async uploadResume(file: File, userId: string): Promise<ResumeUploadResponse> {
    console.log('📤 profileService.uploadResume:', {
      fileName: file.name,
      fileSize: file.size,
      userId: userId
    });

    if (!userId) {
      throw new Error('User ID is required for resume upload');
    }

    try {
      console.log('🚀 [DEBUG] Starting resume upload process...');
      console.log('📁 [DEBUG] File details:', {
        name: file.name,
        size: file.size,
        type: file.type,
        userId: userId
      });

      // First upload file to Supabase storage
      console.log('📤 [DEBUG] Uploading file to Supabase storage...');
      const fileName = `${userId}/${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resume-files')
        .upload(fileName, file);

      if (uploadError) {
        console.error('❌ [DEBUG] Supabase storage upload failed:', uploadError);
        throw new Error(`Failed to upload file: ${uploadError.message}`);
      }

      console.log('✅ [DEBUG] File uploaded to Supabase:', uploadData);
      console.log('🤖 [DEBUG] Using built-in resume parsing service...');
      
      // Use built-in resume parsing service
      const { resumeParsingService } = await import('./resumeParsingService');
      const extractionResult = await resumeParsingService.parseResume(file);
      
      console.log('✅ [DEBUG] Built-in AI extraction completed:', extractionResult);

      // Delete existing resume if any
      await supabase
        .from('user_resumes')
        .delete()
        .eq('user_id', userId);

      // Save resume record with AI extraction data  
      const insertData = {
        user_id: userId,
        filename: file.name,
        file_path: uploadData.path,
        file_size: file.size,
        processing_status: 'completed' as const,
        extraction_status: extractionResult.success ? 'completed' as const : 'failed' as const,
        extracted_text: JSON.stringify(extractionResult.extracted_data),
        ai_analysis: extractionResult.extracted_data as any,
      };
      
      const { data: resumeData, error: resumeError } = await supabase
        .from('user_resumes')
        .insert([insertData])
        .select()
        .single();

      if (resumeError) {
        throw new Error(`Failed to save resume record: ${resumeError.message}`);
      }

      // Call Python backend for AI processing
      console.log('🔗 [DEBUG] Calling Profile Service backend...');
      console.log('🌐 [DEBUG] Backend URL: http://localhost:8000/api/profile/extract-profile');
      
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('user_id', userId);

      console.log('📤 [DEBUG] Sending request to Profile Service...');
      const response = await fetch('http://localhost:8000/api/profile/extract-profile', {
        method: 'POST',
        body: formData,
      });

      console.log('📡 [DEBUG] Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        console.error('❌ [DEBUG] Backend request failed:', response.status, response.statusText);
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('❌ [DEBUG] Error details:', errorData);
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const backendResult = await response.json();
      console.log('✅ [DEBUG] Backend response received:', backendResult);
      
      return {
        success: backendResult.success,
        extraction_id: resumeData.id,
        extracted_data: backendResult.extracted_data || {},
        confidence_score: backendResult.confidence_score || 0.8,
        message: backendResult.message || 'Resume processed with Groq AI',
        metadata: backendResult.metadata || {
          filename: file.name,
          file_size: file.size,
          extraction_date: new Date().toISOString(),
          ai_provider: 'groq_ai',
          storage_path: uploadData.path,
        },
      };
    } catch (error) {
      console.error('Failed to upload resume:', error);
      throw new Error(`Failed to upload resume: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async applyExtractedData(userId: string, extractedData: any): Promise<boolean> {
    try {
      console.log('📋 [APPLY DEBUG] Starting to apply extracted data');
      console.log('📋 [APPLY DEBUG] User ID:', userId);
      console.log('📋 [APPLY DEBUG] Extracted data keys:', Object.keys(extractedData || {}));
      console.log('📋 [APPLY DEBUG] Full extracted data:', extractedData);
      
      // Call Python backend to apply extracted data
      const response = await fetch(`http://localhost:8000/api/profile/${userId}/apply-extraction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(extractedData),
      });

      console.log('📡 [APPLY DEBUG] Response status:', response.status);
      console.log('📡 [APPLY DEBUG] Response OK:', response.ok);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('❌ [APPLY DEBUG] Backend error:', errorData);
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ [APPLY DEBUG] Backend result:', result);
      console.log('✅ [APPLY DEBUG] Success value:', result.success);

      return result.success === true; // Explicit boolean check
    } catch (error) {
      console.error('❌ [APPLY DEBUG] Failed to apply extracted data:', error);
      console.error('📋 [APPLY DEBUG] Error details:', {
        message: error?.message,
        stack: error?.stack
      });
      return false;
    }
  },

  async getUserResume(userId: string): Promise<any> {
    try {
      console.log('📂 Fetching resumes for user:', userId);

      const { data, error } = await supabase
        .from('user_resumes')
        .select('*')
        .eq('user_id', userId)
        .order('upload_date', { ascending: false }) // Get newest first
        .limit(1); // Only return the latest resume

      if (error) {
        console.error('❌ Failed to fetch resume:', error);
        return null;
      }

      console.log('✅ Found resume:', data?.length > 0 ? data[0].filename : 'None');

      // Return the first (newest) resume or null
      return data && data.length > 0 ? data[0] : null;

    } catch (error) {
      console.error('❌ Failed to fetch resume:', error);
      return null;
    }
  },

  async deleteResume(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_resumes')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Failed to delete resume:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to delete resume:', error);
      return false;
    }
  },

  async calculateCompletionPercentage(userId: string): Promise<number> {
    try {
      const { data: result } = await supabase.rpc('calculate_profile_completion', {
        user_profile_id: userId
      });
      
      return result || 0;
    } catch (error) {
      console.error('Failed to calculate completion percentage:', error);
      return 0;
    }
  },

  createEmptyProfile(userId: string): UserProfile {
    return {
      userId,
      personalInfo: {
        fullName: '',
        email: '',
        phone: '',
        location: '',
        linkedin: '',
        github: '',
        portfolio: '',
      },
      education: [],
      experience: [],
      projects: [],
      skills: [],
      certifications: [],
      completionPercentage: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  transformBackendToProfile(backendProfile: any): UserProfile {
    if (!backendProfile) {
      throw new Error('No profile data received from backend');
    }

    return {
      userId: backendProfile.user_id || '',
      personalInfo: {
        fullName: backendProfile.full_name || '',
        email: backendProfile.email || '',
        phone: backendProfile.phone || '',
        location: backendProfile.location || '',
        linkedin: backendProfile.linkedin_url || '',
        github: backendProfile.github_url || '',
        portfolio: backendProfile.portfolio_url || '',
      },
      education: (backendProfile.education || []).map((edu: any) => ({
        id: edu.id,
        institution: edu.institution,
        degree: edu.degree,
        field: edu.field_of_study || edu.field,
        startYear: edu.start_year || edu.startYear,
        endYear: edu.end_year || edu.endYear,
        grade: edu.grade || '',
        description: edu.description || '',
      })),
      experience: (backendProfile.experience || []).map((exp: any) => ({
        id: exp.id,
        company: exp.company,
        position: exp.position,
        startDate: exp.start_date || exp.startDate,
        endDate: exp.end_date || exp.endDate,
        current: exp.is_current || exp.current || false,
        description: exp.description || '',
        technologies: exp.technologies || [],
        location: exp.location || '',
      })),
      projects: (backendProfile.projects || []).map((proj: any) => ({
        id: proj.id,
        title: proj.title,
        description: proj.description || '',
        technologies: proj.technologies || [],
        startDate: proj.start_date || proj.startDate,
        endDate: proj.end_date || proj.endDate,
        githubUrl: proj.github_url || proj.githubUrl || '',
        liveUrl: proj.live_url || proj.liveUrl || '',
        highlights: proj.highlights || [],
      })),
      skills: (backendProfile.skills || []).map((skill: any) => ({
        name: skill.name,
        level: skill.level as 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert',
        category: skill.category as 'Technical' | 'Soft' | 'Language' | 'Framework' | 'Tool',
      })),
      certifications: (backendProfile.certifications || []).map((cert: any) => ({
        id: cert.id,
        name: cert.name,
        issuer: cert.issuer,
        issueDate: cert.issue_date || cert.issueDate,
        expiryDate: cert.expiry_date || cert.expiryDate || '',
        credentialId: cert.credential_id || cert.credentialId || '',
        credentialUrl: cert.credential_url || cert.credentialUrl || '',
      })),
      summary: backendProfile.professional_summary || '',
      resumeData: backendProfile.resume_data ? {
        filename: backendProfile.resume_data.filename,
        uploadDate: backendProfile.resume_data.upload_date,
        parsedData: backendProfile.resume_data.parsed_data,
        extractedText: backendProfile.resume_data.extracted_text,
        aiAnalysis: backendProfile.resume_data.ai_analysis,
        skillGaps: backendProfile.resume_data.skill_gaps,
        recommendations: backendProfile.resume_data.recommendations,
      } : undefined,
      completionPercentage: backendProfile.completion_percentage || 0,
      createdAt: backendProfile.created_at || new Date().toISOString(),
      updatedAt: backendProfile.updated_at || new Date().toISOString(),
    };
  },
};

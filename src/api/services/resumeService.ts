export interface ResumeAnalysisRequest {
  jobRole: string;
  jobDescription?: string;
  userId?: string;
  resumeId?: string;
}

export interface ResumeAnalysisResponse {
  filename: string;
  file_size: number;
  upload_date: string;
  job_role: string;
  job_description: string;
  extracted_text: string;
  extracted_data: any;
  analysis: {
    overall_score: number;
    job_match_score: number;
    ats_score: number;
    strengths: string[];
    weaknesses: string[];
    skill_gaps: string[];
    recommendations: string[];
    keywords_found: string[];
    missing_keywords: string[];
    sections_analysis: any;
    improvement_priority: string[];
    role_specific_advice: string[];
  };
  processing_status: string;
}

export interface ProfileExtractionResponse {
  success: boolean;
  extraction_id: string;
  extracted_data: any;
  confidence_score: number;
  message: string;
  file_path: string;
}

import { gatewayAuthService } from './gatewayAuthService';

export const resumeService = {
  async analyzeResume(file: File | null, data: ResumeAnalysisRequest): Promise<ResumeAnalysisResponse> {
    const formData = new FormData();
    if (file) {
      formData.append('resume', file);
    } else if (data.resumeId) {
      formData.append('resume_id', data.resumeId);
    }
    
    formData.append('job_role', data.jobRole);
    if (data.jobDescription) {
      formData.append('job_description', data.jobDescription);
    }
    if (data.userId) {
      formData.append('user_id', data.userId);
    }

    const token = gatewayAuthService.getGatewayToken();

    const response = await fetch('http://localhost:8000/resume/analyze', {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error((errorData as any)?.detail || 'Failed to analyze resume');
    }

    return response.json();
  },

  async getAnalysisHistory(userId: string) {
    const token = gatewayAuthService.getGatewayToken();
    const response = await fetch(`http://localhost:8000/resume/analysis-history/${userId}`, {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });
    if (!response.ok) throw new Error('Failed to fetch analysis history');
    return response.json();
  },

  async getFullAnalysis(analysisId: string) {
    const token = gatewayAuthService.getGatewayToken();
    const response = await fetch(`http://localhost:8000/resume/analysis/${analysisId}/full`, {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });
    if (!response.ok) throw new Error('Failed to fetch analysis details');
    return response.json();
  },

  async suggestRoles(resumeText: string) {
    const token = gatewayAuthService.getGatewayToken();
    const formData = new FormData();
    formData.append('resume_text', resumeText);

    const response = await fetch('http://localhost:8000/resume/suggest-roles', {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    if (!response.ok) throw new Error('Failed to suggest roles');
    return response.json();
  },

  // This function is deprecated - use profileService.uploadResume instead
  async extractProfileData(file: File, userId: string): Promise<ProfileExtractionResponse> {
    throw new Error('This function has been deprecated. Please use profileService.uploadResume instead.');
  },
};
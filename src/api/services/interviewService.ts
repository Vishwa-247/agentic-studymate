import { apiClient } from '../client';
import { API_GATEWAY_URL } from '@/configs/environment';
import { MockInterviewType, InterviewQuestionType, InterviewAnalysisType } from '../../types';

export interface InterviewStartRequest {
  job_role: string;
  tech_stack: string;
  experience: string;
  interview_type?: 'technical' | 'behavioral' | 'mixed';
  question_count?: number;
}

export interface InterviewStartResponse {
  interview_id: string;
  questions: InterviewQuestionType[];
  estimated_duration: number;
}

export const interviewService = {
  async startInterview(request: InterviewStartRequest): Promise<InterviewStartResponse> {
    const response = await fetch(`${API_GATEWAY_URL}/interviews/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request)
    });
    
    if (!response.ok) {
      throw new Error('Failed to start interview');
    }
    
    return await response.json();
  },

  async getInterviews(): Promise<MockInterviewType[]> {
    const response = await fetch(`${API_GATEWAY_URL}/interviews`);
    const data = await response.json();
    return data || [];
  },

  async getInterview(interviewId: string): Promise<MockInterviewType & { questions: InterviewQuestionType[] }> {
    const response = await fetch(`${API_GATEWAY_URL}/interviews/${interviewId}`);
    return await response.json();
  },

  async analyzeInterview(interviewId: string, analysisData: any): Promise<InterviewAnalysisType> {
    const response = await fetch(`${API_GATEWAY_URL}/interviews/${interviewId}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(analysisData)
    });
    return await response.json();
  },

  // Legacy methods for compatibility
  async createMockInterview(interviewData: Partial<MockInterviewType>): Promise<MockInterviewType> {
    const request: InterviewStartRequest = {
      job_role: interviewData.job_role || 'Software Developer',
      tech_stack: interviewData.tech_stack || 'JavaScript',
      experience: interviewData.experience || 'intermediate',
      interview_type: 'mixed',
      question_count: 5
    };
    
    const response = await this.startInterview(request);
    
    // Return mock interview object for compatibility
    return {
      id: response.interview_id,
      user_id: 'current_user',
      job_role: request.job_role,
      tech_stack: request.tech_stack,
      experience: request.experience,
      created_at: new Date().toISOString(),
      completed: false
    };
  },

  async getInterviewQuestions(interviewId: string): Promise<InterviewQuestionType[]> {
    const interview = await this.getInterview(interviewId);
    return interview.questions || [];
  },

  async submitInterviewResponses(interviewId: string, responses: any[]): Promise<void> {
    // This would update the interview with user responses
    console.log('Submit interview responses:', interviewId, responses);
  }
};
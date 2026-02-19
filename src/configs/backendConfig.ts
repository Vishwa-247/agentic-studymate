export const BACKEND_CONFIG = {
  DSA_SERVICE: {
    BASE_URL: import.meta.env.PROD ? '/api/dsa' : 'http://localhost:8000/api/dsa',
    ENDPOINTS: {
      FEEDBACK_SUGGESTIONS: '/feedback/generate-suggestions',
      CHATBOT: '/feedback/chatbot-response',
      YOUTUBE_RECS: '/feedback/youtube-recommendations',
      FEEDBACK_HISTORY: '/feedback/history'
    }
  },
  PROFILE_SERVICE: {
    BASE_URL: import.meta.env.PROD ? '/api/profile' : 'http://localhost:8000/api/profile',
  },
  RESUME_SERVICE: {
    BASE_URL: import.meta.env.PROD ? '/api/resume' : 'http://localhost:8000',
  }
};

export const getDSAUrl = (endpoint: string) => {
  return `${BACKEND_CONFIG.DSA_SERVICE.BASE_URL}${endpoint}`;
};

export const getProfileUrl = (endpoint: string) => {
  return `${BACKEND_CONFIG.PROFILE_SERVICE.BASE_URL}${endpoint}`;
};

export const getResumeUrl = (endpoint: string) => {
  return `${BACKEND_CONFIG.RESUME_SERVICE.BASE_URL}${endpoint}`;
};

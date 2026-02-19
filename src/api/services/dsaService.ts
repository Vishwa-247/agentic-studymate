import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface DSAProgress {
  userId: string;
  topicId: string;
  problemName: string;
  completed: boolean;
  completedAt?: Date;
}

export interface DSAFilters {
  difficulty: string[];
  category: string[];
  companies: string[];
  searchQuery?: string;
}

export interface DSAUserPreferences {
  userId: string;
  filters: DSAFilters;
  favorites: string[];
  lastVisited: string[];
}

class DSAService {
  // Progress tracking
  async updateProgress(progress: Omit<DSAProgress, 'completedAt'>): Promise<DSAProgress> {
    const response = await api.post('/dsa/progress', {
      ...progress,
      completedAt: new Date()
    });
    return response.data;
  }

  async getProgress(userId: string): Promise<DSAProgress[]> {
    const response = await api.get(`/dsa/progress/${userId}`);
    return response.data;
  }

  async getTopicProgress(userId: string, topicId: string): Promise<DSAProgress[]> {
    const response = await api.get(`/dsa/progress/${userId}/${topicId}`);
    return response.data;
  }

  // Filter preferences
  async saveFilters(userId: string, filters: DSAFilters): Promise<void> {
    await api.post('/dsa/filters', { userId, filters });
  }

  async getFilters(userId: string): Promise<DSAFilters | null> {
    try {
      const response = await api.get(`/dsa/filters/${userId}`);
      return response.data;
    } catch (error) {
      return null;
    }
  }

  // User preferences
  async savePreferences(preferences: DSAUserPreferences): Promise<void> {
    await api.post('/dsa/preferences', preferences);
  }

  async getPreferences(userId: string): Promise<DSAUserPreferences | null> {
    try {
      const response = await api.get(`/dsa/preferences/${userId}`);
      return response.data;
    } catch (error) {
      return null;
    }
  }

  // Favorites
  async addToFavorites(userId: string, itemId: string): Promise<void> {
    await api.post('/dsa/favorites', { userId, itemId });
  }

  async removeFromFavorites(userId: string, itemId: string): Promise<void> {
    await api.delete(`/dsa/favorites/${userId}/${itemId}`);
  }

  async getFavorites(userId: string): Promise<string[]> {
    try {
      const response = await api.get(`/dsa/favorites/${userId}`);
      return response.data;
    } catch (error) {
      return [];
    }
  }

  // Analytics
  async getAnalytics(userId: string): Promise<{
    totalProblems: number;
    solvedProblems: number;
    difficulty: Record<string, number>;
    category: Record<string, number>;
    streakDays: number;
    lastActivity: Date;
  }> {
    const response = await api.get(`/dsa/analytics/${userId}`);
    return response.data;
  }

  // Bulk operations
  async bulkUpdateProgress(progressItems: Omit<DSAProgress, 'completedAt'>[]): Promise<DSAProgress[]> {
    const response = await api.post('/dsa/progress/bulk', progressItems);
    return response.data;
  }

  async exportProgress(userId: string): Promise<Blob> {
    const response = await api.get(`/dsa/export/${userId}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  async importProgress(userId: string, file: File): Promise<{ imported: number; errors: string[] }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);
    
    const response = await api.post('/dsa/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
}

export const dsaService = new DSAService();
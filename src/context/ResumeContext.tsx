import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CachedResume {
  id: string;
  filename: string;
  fileData: string; // base64
  uploadDate: string;
  lastAnalyzed?: string;
  analysisCount: number;
}

interface ResumeContextType {
  cachedResumes: CachedResume[];
  addResume: (file: File) => Promise<void>;
  removeResume: (id: string) => void;
  getResume: (id: string) => CachedResume | undefined;
  clearAll: () => void;
}

const ResumeContext = createContext<ResumeContextType | undefined>(undefined);

const STORAGE_KEY = 'studymate_cached_resumes';
const MAX_CACHED_RESUMES = 5;

export const ResumeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cachedResumes, setCachedResumes] = useState<CachedResume[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setCachedResumes(parsed);
      }
    } catch (error) {
      console.error('Failed to load cached resumes:', error);
    }
  }, []);

  // Save to localStorage whenever cachedResumes changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedResumes));
    } catch (error) {
      console.error('Failed to save cached resumes:', error);
    }
  }, [cachedResumes]);

  const addResume = async (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        const fileData = reader.result as string;
        const newResume: CachedResume = {
          id: `${Date.now()}-${file.name}`,
          filename: file.name,
          fileData,
          uploadDate: new Date().toISOString(),
          analysisCount: 0,
        };

        setCachedResumes(prev => {
          // Add new resume at the beginning
          const updated = [newResume, ...prev];
          // Keep only the last MAX_CACHED_RESUMES
          return updated.slice(0, MAX_CACHED_RESUMES);
        });
        
        resolve();
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsDataURL(file);
    });
  };

  const removeResume = (id: string) => {
    setCachedResumes(prev => prev.filter(r => r.id !== id));
  };

  const getResume = (id: string): CachedResume | undefined => {
    return cachedResumes.find(r => r.id === id);
  };

  const clearAll = () => {
    setCachedResumes([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <ResumeContext.Provider
      value={{
        cachedResumes,
        addResume,
        removeResume,
        getResume,
        clearAll,
      }}
    >
      {children}
    </ResumeContext.Provider>
  );
};

export const useResumeCache = () => {
  const context = useContext(ResumeContext);
  if (!context) {
    throw new Error('useResumeCache must be used within ResumeProvider');
  }
  return context;
};


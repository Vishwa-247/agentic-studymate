// Backend Service Integration for StudyMate AI Agents

export interface ServiceHealthStatus {
  service: string;
  status: 'online' | 'offline' | 'error';
  port: number;
  lastChecked: string;
}

class BackendServiceManager {
  private services = {
    'api-gateway': { port: 8000, path: '/health' },
    'profile-service': { port: 8000, path: '/health' },
    'resume-analyzer': { port: 8000, path: '/health' },
  };

  async checkServiceHealth(serviceName: string): Promise<ServiceHealthStatus> {
    const service = this.services[serviceName as keyof typeof this.services];
    if (!service) {
      throw new Error(`Unknown service: ${serviceName}`);
    }

    try {
      const response = await fetch(`http://localhost:${service.port}${service.path}`, {
        method: 'GET',
        timeout: 5000,
      } as any);

      return {
        service: serviceName,
        status: response.ok ? 'online' : 'error',
        port: service.port,
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      console.warn(`Service ${serviceName} health check failed:`, error);
      return {
        service: serviceName,
        status: 'offline',
        port: service.port,
        lastChecked: new Date().toISOString(),
      };
    }
  }

  async checkAllServices(): Promise<ServiceHealthStatus[]> {
    const healthChecks = Object.keys(this.services).map(service => 
      this.checkServiceHealth(service)
    );
    
    return Promise.all(healthChecks);
  }

  async callService(serviceName: string, endpoint: string, options: RequestInit = {}): Promise<Response> {
    const service = this.services[serviceName as keyof typeof this.services];
    if (!service) {
      throw new Error(`Unknown service: ${serviceName}`);
    }

    const url = `http://localhost:${service.port}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok && response.status >= 500) {
        console.error(`Service ${serviceName} returned ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      console.error(`Failed to call ${serviceName} service:`, error);
      throw new Error(`Service ${serviceName} is unavailable`);
    }
  }

  // Specific service methods
  async extractProfileData(file: File, userId: string) {
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('user_id', userId);

    return this.callService('api-gateway', '/api/profile/extract-profile', {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set content-type for multipart
    });
  }

  async analyzeResume(file: File, jobRole: string, jobDescription: string = '') {
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('job_role', jobRole);
    formData.append('job_description', jobDescription);

    return this.callService('api-gateway', '/resume/analyze', {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set content-type for multipart
    });
  }

  async chatWithDSABot(message: string, context: string = 'dsa_learning') {
    return this.callService('api-gateway', '/api/dsa/chat', {
      method: 'POST',
      body: JSON.stringify({ message, context }),
    });
  }

  async generateCourse(courseData: any) {
    return this.callService('api-gateway', '/courses/generate', {
      method: 'POST',  
      body: JSON.stringify(courseData),
    });
  }
}

export const backendService = new BackendServiceManager();

// Health monitoring hook
export const useServiceHealth = () => {
  const [healthStatus, setHealthStatus] = useState<ServiceHealthStatus[]>([]);
  const [loading, setLoading] = useState(false);

  const checkHealth = async () => {
    setLoading(true);
    try {
      const status = await backendService.checkAllServices();
      setHealthStatus(status);
    } catch (error) {
      console.error('Health check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return { healthStatus, loading, checkHealth };
};

// React imports for the hook
import { useState, useEffect } from 'react';
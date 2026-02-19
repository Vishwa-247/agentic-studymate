import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, RefreshCw, AlertCircle } from 'lucide-react';

interface ServiceStatus {
  name: string;
  url: string;
  port: number;
  status: 'checking' | 'online' | 'offline' | 'error';
  responseTime?: number;
  error?: string;
}

const BackendHealthCheck: React.FC = () => {
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: 'API Gateway', url: 'http://localhost:8000/health', port: 8000, status: 'offline' },
    { name: 'Interview Coach', url: 'http://localhost:8002/health', port: 8002, status: 'offline' },
    { name: 'Resume Analyzer', url: 'http://localhost:8003/health', port: 8003, status: 'offline' },
    { name: 'DSA Service', url: 'http://localhost:8004/health', port: 8004, status: 'offline' },
    { name: 'Profile Service', url: 'http://localhost:8006/health', port: 8006, status: 'offline' },
    { name: 'Course Generation', url: 'http://localhost:8008/health', port: 8008, status: 'offline' },
  ]);

  const [isChecking, setIsChecking] = useState(false);

  const checkServiceHealth = async (service: ServiceStatus): Promise<ServiceStatus> => {
    const startTime = Date.now();
    
    try {
      const response = await fetch(service.url, {
        method: 'GET',
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        return {
          ...service,
          status: 'online',
          responseTime,
          error: undefined,
        };
      } else {
        return {
          ...service,
          status: 'error',
          responseTime,
          error: `HTTP ${response.status}`,
        };
      }
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      return {
        ...service,
        status: 'offline',
        responseTime,
        error: error.message || 'Connection failed',
      };
    }
  };

  const checkAllServices = async () => {
    setIsChecking(true);
    
    // Set all services to checking state
    setServices(prev => prev.map(service => ({ ...service, status: 'checking' })));
    
    try {
      const servicePromises = services.map(checkServiceHealth);
      const results = await Promise.all(servicePromises);
      setServices(results);
    } catch (error) {
      console.error('Error checking services:', error);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkAllServices();
    // Check services every 30 seconds
    const interval = setInterval(checkAllServices, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'checking':
        return <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />;
      case 'online':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'offline':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'checking':
        return <Badge variant="outline">Checking...</Badge>;
      case 'online':
        return <Badge className="bg-green-500/10 text-green-700 border-green-500/20">Online</Badge>;
      case 'offline':
        return <Badge variant="destructive">Offline</Badge>;
      case 'error':
        return <Badge className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">Error</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const onlineServices = services.filter(s => s.status === 'online').length;
  const totalServices = services.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Backend Services Health</CardTitle>
          <Button
            onClick={checkAllServices}
            disabled={isChecking}
            size="sm"
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          {onlineServices} of {totalServices} services online
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {services.map((service) => (
            <div
              key={service.port}
              className="flex items-center justify-between p-3 rounded-lg border bg-card"
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(service.status)}
                <div>
                  <div className="font-medium">{service.name}</div>
                  <div className="text-sm text-muted-foreground">
                    Port {service.port}
                    {service.responseTime && (
                      <span className="ml-2">({service.responseTime}ms)</span>
                    )}
                  </div>
                  {service.error && (
                    <div className="text-xs text-red-500 mt-1">{service.error}</div>
                  )}
                </div>
              </div>
              {getStatusBadge(service.status)}
            </div>
          ))}
        </div>

        {onlineServices === 0 && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <div className="font-medium text-red-800">No Backend Services Running</div>
                <div className="text-sm text-red-700 mt-1">
                  To start the services, run <code className="bg-red-100 px-2 py-1 rounded">start_all_services.bat</code> from the project root.
                </div>
                <div className="text-xs text-red-600 mt-2">
                  Make sure you have Python and the required dependencies installed.
                </div>
              </div>
            </div>
          </div>
        )}

        {onlineServices > 0 && onlineServices < totalServices && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div>
                <div className="font-medium text-yellow-800">Some Services Offline</div>
                <div className="text-sm text-yellow-700 mt-1">
                  Some features may not work properly. Make sure all services are running.
                </div>
              </div>
            </div>
          </div>
        )}

        {onlineServices === totalServices && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <div className="font-medium text-green-800">All Services Online</div>
                <div className="text-sm text-green-700 mt-1">
                  Your backend is ready! Resume upload and other AI features should work.
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BackendHealthCheck;
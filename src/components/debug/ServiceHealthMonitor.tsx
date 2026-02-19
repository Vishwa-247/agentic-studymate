import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  RefreshCcw,
  Server,
  Wifi,
  WifiOff 
} from 'lucide-react';
import { useServiceHealth } from '@/api/services/backendService';

const ServiceHealthMonitor: React.FC<{ className?: string }> = ({ className }) => {
  const { healthStatus, loading, checkHealth } = useServiceHealth();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "text-primary bg-primary/10";
      case "offline":
        return "text-destructive bg-destructive/10";
      case "error":
        return "text-destructive bg-destructive/10";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="w-4 h-4" />;
      case 'offline': return <WifiOff className="w-4 h-4" />;
      case 'error': return <AlertCircle className="w-4 h-4" />;
      default: return <Server className="w-4 h-4" />;
    }
  };

  const onlineServices = healthStatus.filter(s => s.status === 'online').length;
  const totalServices = healthStatus.length;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="w-5 h-5" />
            Backend Services
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={onlineServices === totalServices ? 'default' : 'destructive'}>
              {onlineServices}/{totalServices} Online
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={checkHealth}
              disabled={loading}
              className="w-8 h-8 p-0"
            >
              <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {healthStatus.map((service) => (
          <div key={service.service} className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
            <div className="flex items-center gap-3">
              <div className={`p-1.5 rounded-full ${getStatusColor(service.status)}`}>
                {getStatusIcon(service.status)}
              </div>
              <div>
                <div className="font-medium text-sm capitalize">
                  {service.service.replace('-', ' ')}
                </div>
                <div className="text-xs text-muted-foreground">
                  Port: {service.port}
                </div>
              </div>
            </div>
            <div className="text-right">
              <Badge 
                variant={service.status === 'online' ? 'default' : 'destructive'}
                className="text-xs"
              >
                {service.status}
              </Badge>
              <div className="text-xs text-muted-foreground mt-1">
                {new Date(service.lastChecked).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        
        {healthStatus.length === 0 && !loading && (
          <div className="text-center p-6 text-muted-foreground">
            <Server className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No services configured</p>
          </div>
        )}
        
        {loading && (
          <div className="text-center p-6 text-muted-foreground">
            <RefreshCcw className="w-8 h-8 mx-auto mb-2 animate-spin" />
            <p className="text-sm">Checking service health...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ServiceHealthMonitor;
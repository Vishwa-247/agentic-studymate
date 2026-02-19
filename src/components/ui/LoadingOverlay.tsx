
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  subMessage?: string;
  minimal?: boolean;
  autoDismiss?: number | false; // Time in ms after which to auto-dismiss, false to disable
  progress?: number; // Optional progress percentage (0-100)
  onDismissed?: () => void;
}

const LoadingOverlay = ({ 
  isLoading, 
  message = "Processing", 
  subMessage = "Please wait while we process your request.",
  minimal = false,
  autoDismiss = false, // Default is no auto-dismiss
  progress,
  onDismissed
}: LoadingOverlayProps) => {
  const [visible, setVisible] = useState(isLoading);
  const [loadingDots, setLoadingDots] = useState('');
  
  // Add animated loading dots
  useEffect(() => {
    if (visible) {
      const interval = setInterval(() => {
        setLoadingDots(prev => {
          if (prev.length >= 3) return '';
          return prev + '.';
        });
      }, 500);
      return () => clearInterval(interval);
    }
  }, [visible]);
  
  useEffect(() => {
    setVisible(isLoading);
    
    if (isLoading && autoDismiss) {
      const timer = setTimeout(() => {
        setVisible(false);
        if (onDismissed) onDismissed();
      }, autoDismiss);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading, autoDismiss, onDismissed]);
  
  if (!visible) return null;
  
  if (minimal) {
    return (
      <div className="fixed top-4 right-4 bg-card p-3 rounded-lg shadow-lg z-50 flex items-center space-x-2 animate-in fade-in slide-in-from-right duration-300">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm font-medium">{message}{loadingDots}</span>
        {progress !== undefined && (
          <span className="text-xs text-muted-foreground">{progress}%</span>
        )}
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-300">
      <div className="bg-card p-8 rounded-lg shadow-lg max-w-md w-full text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
        <h3 className="text-xl font-semibold">{message}{loadingDots}</h3>
        <p className="text-muted-foreground">
          {subMessage}
        </p>
        {progress !== undefined && progress > 0 && (
          <div className="w-full mt-4">
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300 ease-in-out" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">{progress}% complete</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingOverlay;

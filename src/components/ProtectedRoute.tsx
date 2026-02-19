import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useOnboardingGuard } from '@/hooks/useOnboardingGuard';
import LoadingOverlay from '@/components/ui/LoadingOverlay';

interface ProtectedRouteProps {
  children: ReactNode;
  skipOnboarding?: boolean; // For routes that don't need onboarding check
}

export const ProtectedRoute = ({ children, skipOnboarding = false }: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  
  // Skip onboarding check on /onboarding route to avoid redirect loop
  const isOnboardingPage = location.pathname === '/onboarding';
  const shouldCheckOnboarding = !skipOnboarding && !isOnboardingPage;
  
  // Check onboarding status only if user is authenticated
  const { isLoading: onboardingLoading, isCompleted } = useOnboardingGuard(
    shouldCheckOnboarding ? user?.id : undefined
  );

  // Show loading while checking auth
  if (authLoading) {
    return <LoadingOverlay isLoading={true} />;
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Show loading while checking onboarding
  if (shouldCheckOnboarding && onboardingLoading) {
    return <LoadingOverlay isLoading={true} />;
  }

  // useOnboardingGuard handles redirect to /onboarding internally
  // So we just render children here - the hook takes care of navigation

  return <>{children}</>;
};
import { Navigate } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/useAuth';

export function ProtectedRoute({ children }) {
  const { data: user, isLoading, isError } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        Loading...
      </div>
    );
  }

  if (isError || !user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
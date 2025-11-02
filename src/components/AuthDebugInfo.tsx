import { useAuth } from "@/contexts/AuthContext";

export function AuthDebugInfo() {
  const { user, isLoading, isInitialized, userRole, isPasswordRecovery } = useAuth();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs font-mono z-50">
      <div className="space-y-1">
        <div>🔐 Auth Debug:</div>
        <div>User: {user ? '✅' : '❌'} {user?.email}</div>
        <div>Loading: {isLoading ? '⏳' : '✅'}</div>
        <div>Initialized: {isInitialized ? '✅' : '❌'}</div>
        <div>Role: {userRole || 'none'}</div>
        <div>Recovery: {isPasswordRecovery ? '🔄' : '❌'}</div>
      </div>
    </div>
  );
}

import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

const AuthDebugger = () => {
  const [isVisible, setIsVisible] = useState(false);
  const authState = useAuth();

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-red-500 text-white px-2 py-1 text-xs rounded opacity-50 hover:opacity-100 z-50"
      >
        Debug Auth
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded text-xs max-w-sm z-50">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">Auth Debug</h3>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-red-400 hover:text-red-300"
        >
          ✕
        </button>
      </div>
      <div className="space-y-1">
        <div>isLoading: <span className={authState.isLoading ? 'text-red-400' : 'text-green-400'}>{String(authState.isLoading)}</span></div>
        <div>isAuthenticated: <span className={authState.isAuthenticated ? 'text-green-400' : 'text-red-400'}>{String(authState.isAuthenticated)}</span></div>
        <div>hasUser: <span className={authState.user ? 'text-green-400' : 'text-red-400'}>{String(!!authState.user)}</span></div>
        <div>userRole: <span className="text-blue-400">{authState.userRole || 'null'}</span></div>
        <div>isPasswordRecovery: <span className={authState.isPasswordRecovery ? 'text-yellow-400' : 'text-gray-400'}>{String(authState.isPasswordRecovery)}</span></div>
        <div>email: <span className="text-cyan-400">{authState.user?.email || 'null'}</span></div>
        <div>timestamp: <span className="text-gray-400">{new Date().toLocaleTimeString()}</span></div>
      </div>
    </div>
  );
};

export default AuthDebugger;

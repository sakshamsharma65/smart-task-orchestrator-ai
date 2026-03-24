import { toast } from '@/components/ui/sonner';
import React, { createContext, useContext, useState, useEffect } from 'react';

// Simple auth context to replace Supabase auth
// For now, we'll use a mock user until proper authentication is implemented
interface User {
  id: string;
  email: string;
  user_name?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  /// NEW: 2FA State and Methods
  mfaPending: boolean;
  tempToken: string | null;
  verify2FA: (code: string) => Promise<void>;
  resend2FA: () => Promise<void>;
  setMfaPending: (pending: boolean) => void;
  logout: () => void;
  loading: boolean;
  checkSystemStatus: () => Promise<{ hasUsers: boolean }>;
  registerSuperAdmin: (name: string, email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // NEW: Internal 2FA State
  const [mfaPending, setMfaPending] = useState(false);
  const [tempToken, setTempToken] = useState<string | null>(null);
const [limitReached, setLimitReached] = useState(false);

  useEffect(() => {
    // Check for stored session
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

const login = async (email: string, password: string) => {
  setLoading(true);
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json(); // always read JSON

    if (!response.ok) {
      // Forward backend error message to UI
      throw {
        status: response.status,
        message: data.error || "Login failed",
      };
    }
    // THE FORK: If 2FA is required, update internal state and return
      if (response.status === 202 && data.mfaRequired) {
        setTempToken(data.tempToken);
        setMfaPending(true);
        return; // Exits without calling setUser, keeping user as null
      }

      // SUCCESS: No 2FA required
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
    } finally {
      setLoading(false);
    }
  };

  // NEW: Verification Logic
  const verify2FA = async (code: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken, code }),
      });

      const data = await response.json();
    if (response.status === 429) {
    
  setLimitReached(true);

  toast({
    title: "Limit reached",
    description: "Too many attempts. Please login again after 15 minutes.",
    variant: "destructive",
  });

  return;
}
      if (!response.ok) {
        throw { status: response.status, message: data.error || "Verification failed" };
      }

      // Success! Clear MFA state and set user
      setMfaPending(false);
      setTempToken(null);

    setUser(data);
    localStorage.setItem('user', JSON.stringify(data));
  } finally {
    setLoading(false);
  }
};
const resend2FA = async () => {
    if (!tempToken) return;
    const response = await fetch('/api/auth/resend-2fa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tempToken }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw { status: response.status, message: data.error || "Failed to resend" };
    }
    // Update with the new token returned by the resend route
    setTempToken(data.tempToken);
  };


  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const checkSystemStatus = async () => {
    const response = await fetch('/api/auth/system-status');
    if (!response.ok) {
      throw new Error('Failed to check system status');
    }
    return response.json();
  };

  const registerSuperAdmin = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/register-super-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      
      if (response.ok) {
        const user = await response.json();
        setUser(user);
        localStorage.setItem('user', JSON.stringify(user));
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, checkSystemStatus, registerSuperAdmin,mfaPending, tempToken, verify2FA, resend2FA, setMfaPending }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Legacy Supabase auth hooks for compatibility
export function useSupabaseSession() {
  const { user, loading } = useAuth();
  return {
    session: user ? { user } : null,
    loading,
  };
}

export function useSupabaseUser() {
  const { user, loading } = useAuth();
  return {
    user,
    loading,
  };
}
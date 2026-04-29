import { toast } from '@/components/ui/sonner';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// --- SECURITY CONFIGURATION ---
const MAX_IDLE_TIME = 6 * 60 * 60 * 1000; // 6 Hours of inactivity
const MAX_SESSION_AGE = 12 * 60 * 60 * 1000; // 12 Hours total session life

interface User {
  id: string;
  email: string;
  user_name?: string;
  session_started_at?: number; // Needed for expiration tracking
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  mfaPending: boolean;
  tempToken: string | null;
  verify2FA: (code: string) => Promise<void>;
  resend2FA: () => Promise<void>;
  setMfaPending: (pending: boolean) => void;
  logout: () => void;
  loading: boolean;
  checkSystemStatus: () => Promise<{ hasUsers: boolean }>;
  registerSuperAdmin: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mfaPending, setMfaPending] = useState(false);
  const [tempToken, setTempToken] = useState<string | null>(null);

  // 1. Unified Logout Function
  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('user');
    setMfaPending(false);
    setTempToken(null);
  }, []);

  // 2. Helper to save user with security timestamp
  const saveUserWithTimestamp = useCallback((userData: any) => {
    const userWithTime = { ...userData, session_started_at: Date.now() };
    setUser(userWithTime);
    localStorage.setItem('user', JSON.stringify(userWithTime));
  }, []);

  // 3. Initial Session Validation (Merged duplicate effects)
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed: User = JSON.parse(storedUser);
        const currentTime = Date.now();
        const sessionAge = currentTime - (parsed.session_started_at || 0);

        // Kill session if older than 12 hours total or if timestamp is missing
        if (!parsed.session_started_at || sessionAge > MAX_SESSION_AGE) {
          logout();
          toast.error("Session expired. Please login again.");
        } else {
          setUser(parsed);
        }
      } catch (e) {
        logout();
      }
    }
    setLoading(false);
  }, [logout]);

  // 4. Idle Timeout Logic (6 Hour Inactivity Tracker)
  useEffect(() => {
    if (!user) return;

    let idleTimer: NodeJS.Timeout;

    const handleIdleLogout = () => {
      logout();
      toast("Session Timed Out", {
        description: "You have been logged out after 6 hours of inactivity.",
      });
    };

    const resetTimer = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(handleIdleLogout, MAX_IDLE_TIME);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => document.addEventListener(event, resetTimer));
    
    resetTimer(); // Initialize timer

    return () => {
      clearTimeout(idleTimer);
      events.forEach(event => document.removeEventListener(event, resetTimer));
    };
  }, [user, logout]);

  // --- AUTH ACTIONS ---

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) throw { status: response.status, message: data.error || "Login failed" };

      if (response.status === 202 && data.mfaRequired) {
        setTempToken(data.tempToken);
        setMfaPending(true);
        return;
      }

      saveUserWithTimestamp(data);
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (credential: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      });

      const data = await response.json();
      if (!response.ok) throw { status: response.status, message: data.error || "Google login failed" };

      if (response.status === 202 && data.mfaRequired) {
        setTempToken(data.tempToken);
        setMfaPending(true);
        return;
      }

      saveUserWithTimestamp(data);
    } catch (error: any) {
      toast.error(error.message || "Google Auth Error");
    } finally {
      setLoading(false);
    }
  };

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
        toast.error("Too many attempts. Please wait 15 minutes.");
        return;
      }
      if (!response.ok) throw { status: response.status, message: data.error || "Verification failed" };

      setMfaPending(false);
      setTempToken(null);
      saveUserWithTimestamp(data);
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
    if (!response.ok) throw { status: response.status, message: data.error || "Failed to resend" };
    setTempToken(data.tempToken);
  };

  const checkSystemStatus = async () => {
    const response = await fetch('/api/auth/system-status');
    if (!response.ok) throw new Error('Failed to check system status');
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
      
      const data = await response.json();
      if (response.ok) {
        saveUserWithTimestamp(data);
      } else {
        throw new Error(data.error || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, login, logout, loading, checkSystemStatus, 
      registerSuperAdmin, mfaPending, tempToken, verify2FA, 
      resend2FA, setMfaPending, loginWithGoogle 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

// Legacy Supabase hooks...
export function useSupabaseSession() {
  const { user, loading } = useAuth();
  return { session: user ? { user } : null, loading };
}

export function useSupabaseUser() {
  const { user, loading } = useAuth();
  return { user, loading };
}
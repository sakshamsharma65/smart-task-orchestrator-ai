
import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { ClipboardList, Users2, ShieldCheck } from "lucide-react";
import Logo from "@/components/Logo";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import SuperAdminRegistration from "@/components/SuperAdminRegistration";

const AuthPage: React.FC = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [systemHasUsers, setSystemHasUsers] = useState<boolean | null>(null);
  const {mfaPending, verify2FA, resend2FA, setMfaPending } = useAuth();
  const [otpCode, setOtpCode] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [checkingSystem, setCheckingSystem] = useState(true);
  const navigate = useNavigate();
  const { user, login, loading, checkSystemStatus } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [resendClicks, setResendClicks] = useState(false);
  const [isLockedOut, setIsLockedOut] = useState(false);
  // useEffect(() => {
  //   if (user) {
  //     // If user is already logged in, redirect to home (which will handle role-based routing)
  //     navigate("/", { replace: true });
  //   }
  // }, [user, navigate]);

  useEffect(() => {
    // Check if system has any users
    const checkSystem = async () => {
      try {
        const status = await checkSystemStatus();
        setSystemHasUsers(status.hasUsers);
      } catch (error) {
        console.error('Failed to check system status:', error);
        // Default to showing login if check fails
        setSystemHasUsers(true);
      } finally {
        setCheckingSystem(false);
      }        
    };

    checkSystem();
  }, [checkSystemStatus]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      await login(form.email, form.password);
      // toast({ title: "Login successful!" });
      // navigate("/admin/dashboard", { replace: true });

      // Navigation will happen automatically via useEffect when user state changes
    } 
    catch (error: any) {
  if (error.status === 403 && error.message.toLowerCase().includes("deactivated")) {
    toast({
      title: "Account Deactivated",
      description: "Your account is deactivated. Please contact your admin.",
      variant: "destructive",
    }
  );
    return;
  }

  toast({
    title: "Login Failed",
    description: error.message || "Invalid email or password",
    variant: "destructive",
  });
}

  };
  // Handle Navigation after Login or MFA
useEffect(() => {
  // Only navigate if we have a user and we aren't waiting for MFA
  if (user && !mfaPending) {
    navigate("/dashboard", { replace: true });
  }
}, [user, mfaPending, navigate]);
// Inside your AuthPage component...
useEffect(() => {
  let interval: NodeJS.Timeout;
  if (resendTimer > 0) {
    interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
  }
  return () => clearInterval(interval);
}, [resendTimer]);

const handleResend = async () => {
  if (resendTimer > 0 || isLockedOut) return;
  setError(null);
  try {
    await resend2FA();
    setResendTimer(60);
    toast({ title: "New code sent!" });
  } catch (error: any) {
    if (error.status === 429) {
      setIsLockedOut(true);
      setError("Resend limit reached. Please try again later.");
    } else {
      setError(error.message || "Failed to resend");
    }
  }
};
// New OTP Submission
const onOtpSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);
  try {
    await verify2FA(otpCode);
    toast({ title: "Verification successful!" });
  } catch (error: any) {
    // Check for Rate Limit status
    if (error.status === 429) {
      setIsLockedOut(true);
      setError("Too many attempts. Please wait 15 minutes or contact admin.");
    } else {
      setError(error.message || "Invalid code");
    }
  }
};


  // Show loading spinner while checking system status
  if (checkingSystem) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg">Initializing system...</p>
        </div>
      </div>
    );
  }

  // Show registration page if no users exist
  if (systemHasUsers === false) {
    return <SuperAdminRegistration />;
  }

  // Show login page if users exist
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-400/5 rounded-full blur-3xl animate-ping"></div>
      </div>
      
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 items-center">
          
          {/* Left Side - Branding & Features */}
          <div className="hidden lg:block space-y-8 text-white">
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                {/* <Logo /> */}
              <img
  src="/tazq-logo.png"
  alt="Tazq Logo"
  className="
    w-32        /* mobile */
    sm:w-40     /* ≥640px */
    md:w-48     /* ≥768px */
    lg:w-52     /* ≥1024px */
    h-auto
    
  "
/>


                {/* <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Tazq
                </span> */}
              </div>
              <div className="space-y-4">
                <h1 className="text-5xl font-bold leading-tight">
                  Smart Task
                  <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Management
                  </span>
                </h1>
                <p className="text-xl text-slate-300 leading-relaxed max-w-lg">
                  Streamline your workflow with intelligent task organization, team collaboration, and real-time progress tracking.
                </p>
              </div>
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-1 gap-6 max-w-lg">
              <div className="flex items-start space-x-4 group">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                  <ClipboardList className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Intelligent Organization</h3>
                  <p className="text-slate-400 text-sm">AI-powered task prioritization and smart categorization</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4 group">
                <div className="flex-shrink-0 w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                  <Users2 className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Team Collaboration</h3>
                  <p className="text-slate-400 text-sm">Real-time updates and seamless team communication</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4 group">
                <div className="flex-shrink-0 w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                  <ShieldCheck className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Enterprise Security</h3>
                  <p className="text-slate-400 text-sm">Bank-grade encryption and compliance standards</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
        {/* Right Side - Login Form */}
{/* Right Side - Login Form */}
<div className="flex items-center justify-center">
  <div className="w-full max-w-md">
    {/* Glass morphism card */}
    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">
      
      {!mfaPending ? (
        /* --- LOGIN STATE --- */
        <>
          <div className="text-center mb-8">
            <div className="lg:hidden flex justify-center mb-6">
              <Logo />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
            <p className="text-slate-300">Sign in to your account to continue</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-4">
              <Input
                type="email"
                name="email"
                placeholder="Enter your email"
                required
                value={form.email}
                onChange={handleInput}
                disabled={loading}
                className="w-full h-12 bg-white/10 border-white/20 text-white rounded-xl placeholder:text-slate-400"
              />
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  required
                  value={form.password}
                  onChange={handleInput}
                  disabled={loading}
                  className="w-full h-12 bg-white/10 border-white/20 text-white rounded-xl placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-white/70 hover:text-white"
                >
                  {showPassword ? <FaEye size={20} /> : <FaEyeSlash size={20} />}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg transition-all transform hover:scale-[1.02]"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </div>
              ) : "Sign In"}
            </Button>

            <div className="text-center">
              <button 
                type="button" 
                onClick={() => navigate("/forgot-password")} 
                className="text-sm text-white hover:text-blue-300 transition-colors"
              >
                Forgot Password?
              </button>
            </div>
          </form>
        </>
      ) : (
        /* --- MFA / OTP STATE --- */
        <>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Verify Your Identity</h2>
            <p className="text-slate-300 text-sm">We've sent a 6-digit code to your email.</p>
          </div>

          <form onSubmit={onOtpSubmit} className="space-y-6">
            <div className="space-y-4">
              <Input
                type="text"
                placeholder="000000"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                disabled={loading}
                className="w-full h-14 text-center text-2xl tracking-[0.5em] bg-white/10 border-white/20 text-white rounded-xl font-mono focus:border-blue-400 focus:ring-blue-400/20"
              />
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3">
                <p className="text-red-300 text-sm text-center">{error}</p>
              </div>
            )}

            <Button 
              type="submit" 
              disabled={loading || otpCode.length !== 6|| isLockedOut} 
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg transition-all transform hover:scale-[1.02]"
            >
              {loading ? "Verifying..." : "Verify & Login"}
            </Button>

            <div className="text-center space-y-4">
    
<button 
  type="button" 
  onClick={handleResend}
  // Disable if timer is active OR if locked out
  disabled={resendTimer > 0 || isLockedOut || loading}
  className="text-sm text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
>
  {isLockedOut 
    ? "Action Blocked" 
    : resendTimer > 0 
      ? `Resend code in ${resendTimer}s` 
      : "Didn't get a code? Resend"}
</button>
              
              <button 
                type="button" 
                onClick={() => setMfaPending(false)}
                className="block w-full text-xs text-blue-400 hover:text-blue-300 hover:underline transition-colors"
              >
                Back to Login
              </button>
            </div>
          </form>
        </>
      )}

      {/* Shared Footer Info */}
      <div className="mt-8 text-center border-t border-white/10 pt-6">
        <p className="text-slate-400 text-sm">Secured by enterprise-grade encryption</p>
        <div className="flex items-center justify-center space-x-2 mt-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-green-400 text-sm font-medium">System Online</span>
        </div>
        <div className="mt-4 text-xs text-slate-500">
          &copy; {new Date().getFullYear()} TaskRep. All rights reserved.
        </div>
      </div>

    </div>
  </div>
</div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;

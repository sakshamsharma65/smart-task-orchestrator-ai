import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import axios from "axios";
// 1. Import useNavigate instead of Navigate
import { useNavigate } from "react-router-dom"; 
import { X } from "lucide-react";
const ResetPassword = ({ email, token }: { email: string; token: string }) => {
  const [password, setPassword] = useState("");
  const [password1, setPassword1] = useState("");
  const [loading, setLoading] = useState(false);
  
  // 2. Initialize the hook
  const navigate = useNavigate(); 
const handleClose = () => {  
  navigate("/verify-otp");
 } 
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  if (password !== password1) {
    toast({
      title: "Error",
      description: "Passwords do not match.",
    });

    setLoading(false);
    return;
  }

  // Password Validation Regex
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,}$/;

  if (!passwordRegex.test(password)) {
    toast({
      title: "Invalid Password",
      description:
        "Password must be at least 6 characters and include uppercase, lowercase, number, and special character.",
    });

    setLoading(false);
    return;
  }

  try {
    await axios.post("/api/auth/reset-password", {
      email,
      token,
      newPassword: password,
    });

    toast({ title: "Password reset successful!" });

    setTimeout(() => {
      navigate("/auth");
    }, 1000);

  } catch (err: any) {
    toast({
      title: "Error",
      description: err.response?.data?.error || err.message,
    });
  }

  setLoading(false);
};

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-[#EFF3FF] fixed top-0 left-0">
      <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-8 border border-gray-100 relative">
        <h2 className="text-2xl font-semibold text-center mb-2 text-gray-800">
          Reset Password
        </h2>
        <button onClick={handleClose} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={20} />
                </button>
        <p className="text-sm text-gray-500 text-center mb-6">
          Enter your new password for <span className="font-medium text-indigo-600">{email}</span>
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter new password"
            required
            className="rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
          />
          <Input
            type="password"
            value={password1}
            onChange={(e) => setPassword1(e.target.value)}
            placeholder="Confirm new password"
            required
            className="rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
          />

          <Button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-2 transition-all duration-200"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </Button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          Make sure to remember your new password for future logins.
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";

const VerifyOtp = ({ email, onVerified }: { email: string; onVerified: (token: string) => void }) => {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
const handleClose = () => {  
  navigate("/forgot-password");
 } 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post("/api/auth/verify-otp", { email, otp });
      toast({ title: "OTP verified!" });
      onVerified(res.data.resetToken);
    } catch (err: any) {
      toast({ title: "Error", description: err.response?.data?.error || err.message });
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-[#EFF3FF] fixed top-0 left-0">
      <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-8 border border-gray-100 relative">
        <h2 className="text-2xl font-semibold text-center mb-2 text-gray-800  ">
          Verify OTP
        </h2>
        <button onClick={handleClose} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors">
          <X size={20} />
        </button>
        <p className="text-sm text-gray-500 text-center mb-6">
          Enter the 6-digit OTP sent to <span className="font-medium text-indigo-600">{email}</span>
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter OTP"
            required
            maxLength={6}
            className="text-center tracking-widest text-lg rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
          />
          <Button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-2 transition-all duration-200"
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </Button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          Didn’t receive the OTP? Check your spam folder.
        </p>
      </div>
    </div>
  );
};

export default VerifyOtp;

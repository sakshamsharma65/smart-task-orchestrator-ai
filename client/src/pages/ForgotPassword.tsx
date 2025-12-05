import React, { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "axios";

const ForgotPassword = ({ onOtpSent }: { onOtpSent: (email: string) => void }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post("/api/auth/request-reset", { email });
      toast({ title: "OTP sent!", description: "Check your email for the OTP." });
      onOtpSent(email);
    } catch (err: any) {
      toast({ title: "Error", description: err.response?.data?.error || err.message });
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-[#EFF3FF] fixed top-0 left-0">
      <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-8 border border-gray-100">
        <h2 className="text-2xl font-semibold text-center mb-2 text-gray-800">
          Forgot Password
        </h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          Enter your registered email address. We’ll send you an OTP to reset your password.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            className="rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
          />
          <Button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-2 transition-all duration-200"
          >
            {loading ? "Sending OTP..." : "Send OTP"}
          </Button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          We’ll never share your email with anyone.
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;

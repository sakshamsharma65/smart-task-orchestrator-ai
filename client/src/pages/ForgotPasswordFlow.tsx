import React, { useState } from "react";
import ForgotPassword from "./ForgotPassword";
import VerifyOtp from "./VerifyOtp";
import ResetPassword from "./ResetPassword";

const ForgotPasswordFlow = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");

  return (
    <div className="max-w-md mx-auto p-4">
      {step === 1 && <ForgotPassword onOtpSent={(e) => { setEmail(e); setStep(2); }} />}
      {step === 2 && <VerifyOtp email={email} onVerified={(token) => { setResetToken(token); setStep(3); }} />}
      {step === 3 && <ResetPassword email={email} token={resetToken} />}
    </div>
  );
};

export default ForgotPasswordFlow;

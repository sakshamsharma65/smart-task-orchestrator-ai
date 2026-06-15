
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { apiClient } from "@/lib/api";
import { useNavigate } from "react-router-dom";


interface ResetUserPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
  userEmail: string | undefined;
}

const ResetUserPasswordDialog: React.FC<ResetUserPasswordDialogProps> = ({
  open,
  onOpenChange,
  userId,
  userEmail,
}) => {
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate(); 
  // const navigateToLogin = () => {
  //   navigate("/auth");
  // }


  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,}$/;

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !password) return;

    if (!passwordRegex.test(password)) {
      toast({
        title: "Invalid Password",
        description:
          "Password must be at least 6 characters and include uppercase, lowercase, number, and special character.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      await apiClient.resetUserPassword(userId, password);
      toast({ 
        title: "Password reset", 
        description: `Password was successfully updated for ${userEmail}` 
      });
      setPassword("");
      onOpenChange(false);
    } catch (err: any) {
      toast({ 
        title: "Password reset failed", 
        description: err.response?.data?.error || err.message || "Error occurred." 
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleReset} className="space-y-3">
          <div>
            <div className="text-xs text-muted-foreground mb-2">
              Reset password for <span className="font-semibold">{userEmail}</span>
            </div>
            <Input
              type="password"
              placeholder="New password (uppercase, lowercase, number, special char)"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
            />
            {password && !passwordRegex.test(password) && (
              <p className="text-xs text-red-500 mt-1">
                Password must include uppercase, lowercase, number, and special character.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving || !password}>
              {saving ? "Saving..." : "Reset Password"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ResetUserPasswordDialog;

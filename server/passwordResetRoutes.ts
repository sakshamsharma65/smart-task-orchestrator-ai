import express from "express";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { Pool } from "pg";
import { db } from "./db";
import { eq } from "drizzle-orm";




const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // or your DB config
});
const router = express.Router();

type ResetEntry = {
  otp: string;
  resetToken: string;
  expiresAt: number;
};

// In-memory store for OTP/reset tokens (dev only). TTL = 15 minutes
const resetStore = new Map<string, ResetEntry>();
const TTL_MS = 15 * 60 * 1000;

// Helper to generate numeric OTP
function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// Request reset: generate OTP and a resetToken, email is simulated (log)
router.post("/api/auth/request-reset", async (req, res) => {
  try {
    const { email } = req.body;

    // 1. Fetch Email Settings from DB
    const settings = await storage.getEmailSettings();
    
    // if (!settings ||true) {
    //   return res.status(500).json({ 
    //     error: "Email service is not configured or verified. Please contact administrator." 
    //   });
    // }

    // 2. Check if user exists
    const userResult = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "No user found with this email" });
    }

    // 3. Generate and Save OTP (Keep your existing logic)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await pool.query(
      `INSERT INTO password_reset_otps (email, otp_hash, expires_at, attempts, used, created_at)
       VALUES ($1, $2, $3, 0, false, NOW())`,
      [email, otpHash, expiresAt]
    );

    // 4. Configure Transporter using DB Settings
    const transporter = nodemailer.createTransport({
      host: settings.host,
      port: Number(settings.port),
      secure: Number(settings.port) === 465, // Use SSL for port 465
      auth: { 
        user: settings.username, 
        pass: settings.password 
      },
      // Many modern SMTP servers require this if using self-signed certs
      tls: {
        rejectUnauthorized: false 
      }
    });

    // 5. Send the Email
    await transporter.sendMail({
      from: `"${settings.fromName || 'Smart Task Orchestrator'}" <${settings.fromEmail}>`,
      to: email,
      subject: "🔐 Task Management – Password Reset OTP",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 10px;">
          <h2 style="color: #4a90e2; text-align: center;">Password Reset Request</h2>
          <p>You requested a password reset. Use the code below to proceed:</p>
          <div style="background: #f4f7ff; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4a90e2; border-radius: 8px;">
            ${otp}
          </div>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">
            This code will expire in 5 minutes. If you didn't request this, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error("Error in request-reset:", err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});


// Verify OTP and return reset token (one-time)


router.post("/api/auth/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    console.log("🔹 Incoming verify request:", { email, otp });

    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required" });
    }

    const { rows } = await pool.query(
      `SELECT * FROM password_reset_otps
       WHERE email = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [email]
    );

    if (rows.length === 0) {
      return res.status(400).json({ error: "No reset request found for this email" });
    }

    const entry = rows[0];
    console.log("📦 DB Entry Found:", entry);

    if (entry.used) {
      return res.status(400).json({ error: "This OTP has already been used" });
    }

    const now = new Date();
    if (now > new Date(entry.expires_at)) {
      return res.status(400).json({ error: "OTP has expired" });
    }

    const isMatch = await bcrypt.compare(String(otp), entry.otp_hash);
    console.log("🧩 OTP match result:", isMatch);

    if (!isMatch) {
      await pool.query(
        "UPDATE password_reset_otps SET attempts = attempts + 1 WHERE id = $1",
        [entry.id]
      );
      return res.status(400).json({ error: "Invalid OTP" });
    }

    // await pool.query("UPDATE password_reset_otps SET used = true WHERE id = $1", [entry.id]);

    const resetToken = crypto.randomBytes(32).toString("hex");
    await pool.query(
      "UPDATE password_reset_otps SET reset_token = $1 WHERE id = $2",
      [resetToken, entry.id]
    );

    console.log("✅ OTP verified successfully for:", email);
    res.json({ message: "OTP verified successfully", resetToken });
  } catch (err) {
    console.error("🔥 verify-otp error:", err);
    res.status(500).json({ error: "Failed to verify OTP" });
  }
}); 


// Reset password using token
router.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { email, newPassword, token } = req.body;

    if (!email || !newPassword || !token) {
      return res.status(400).json({ error: "Email, new password, and token are required" });
    }

    // Fetch latest OTP entry
    const { rows } = await pool.query(
      `SELECT * FROM password_reset_otps
       WHERE email = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [email]
    );

    if (rows.length === 0) {
      return res.status(400).json({ error: "No OTP found" });
    }

    const otpRecord = rows[0];

    // Validate reset token EXACTLY
    if (otpRecord.reset_token !== token) {
      return res.status(403).json({ error: "Invalid or expired reset token" });
    }

 // Password Validation Regex
const passwordRegex =
/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,}$/;

if (!passwordRegex.test(newPassword.trim())) {
  return res.status(400).json({
    error:
      "Password must be at least 6 characters and include uppercase, lowercase, number, and special character",
  });
}

// Hash new password
const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await pool.query(
      `UPDATE users 
       SET password_hash = $1 
       WHERE email = $2`,
      [hashedPassword, email]
    );

    // Mark the reset token as used
    await pool.query(
      "UPDATE password_reset_otps SET used = true WHERE id = $1",
      [otpRecord.id]
    );

    return res.json({ message: "Password reset successfully" });

  } catch (error) {
    console.error("reset-password error:", error);
    res.status(500).json({ error: "Failed to reset password" });
  }
});








export default router;

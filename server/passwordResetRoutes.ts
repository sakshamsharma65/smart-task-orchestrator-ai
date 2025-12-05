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

    // Check if user exists in `users` table
    const userResult = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "No user found with this email" });
    }

    // Generate OTP and hash
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Insert into `password_reset_otps`
    await pool.query(
      `INSERT INTO password_reset_otps (email, otp_hash, expires_at, attempts, used, created_at)
       VALUES ($1, $2, $3, 0, false, NOW())`,
      [email, otpHash, expiresAt]
    );

    console.log(`Password reset OTP for ${email}: ${otp}`);

    // Send email
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

await transporter.sendMail({
  from: `"Smart Task Orchestrator" <${process.env.FROM_EMAIL}>`,
  to: email,
  subject: "🔐 Task Management – Password Reset OTP",
  html: `
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:20px;">
    <tr>
      <td align="center">

        <table width="500" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;padding:20px;">
          <tr>
            <td align="center" style="padding-bottom:20px;">
              <h2 style="color:#4a90e2;margin:0;font-family:Arial,sans-serif;">
                Task Management System
              </h2>
            </td>
          </tr>

          <tr>
            <td style="font-family:Arial,sans-serif;font-size:15px;color:#555;">
              Dear User,<br><br>
              You have requested to reset your password. Use the OTP below:
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:25px 0;">
              <div style="
                background:#4a90e2;
                color:#ffffff;
                font-size:32px;
                font-weight:bold;
                font-family:Arial,sans-serif;
                padding:15px 0;
                border-radius:6px;
                letter-spacing:6px;
                width:80%;
              ">
                ${otp}
              </div>
            </td>
          </tr>

          <tr>
            <td style="font-family:Arial,sans-serif;font-size:14px;color:#666;">
              This OTP expires in <b>5 minutes</b>. If you did not request this, ignore this email.
            </td>
          </tr>

          <tr>
            <td align="center" style="padding-top:20px;">
              <hr style="border:0;border-top:1px solid #eee;width:100%;">
              <p style="font-size:12px;color:#999;font-family:Arial,sans-serif;">
                © ${new Date().getFullYear()} Task Management System
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
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

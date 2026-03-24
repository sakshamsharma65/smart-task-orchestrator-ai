import nodemailer, {
  Transporter
} from "nodemailer";

import type {
  EmailSettings
} from "@shared/schema";



export class EmailService {

  private transporter: Transporter;

  private settings: EmailSettings;



  constructor(settings: EmailSettings) {

    this.settings = settings;

    this.transporter =
      this.createTransporter(settings);

  }



  // ====================================
  // Create transporter
  // ====================================

  private createTransporter(
    settings: EmailSettings
  ): Transporter {

    switch (settings.provider) {

      case "gmail":

        return nodemailer.createTransport({

          service: "gmail",

          auth: {

            user: settings.username,

            pass: settings.password,

          },

        });



      case "outlook":

        return nodemailer.createTransport({

          service: "hotmail",

          auth: {

            user: settings.username,

            pass: settings.password,

          },

        });



      case "sendgrid":

        return nodemailer.createTransport({

          host: "smtp.sendgrid.net",

          port: 587,

          secure: false,

          auth: {

            user: "apikey",

            pass: settings.password,

          },

        });



      case "smtp":

      default:

        return nodemailer.createTransport({

          host: settings.host,

          port: settings.port,

          secure: settings.secure,

          auth: {

            user: settings.username,

            pass: settings.password,

          },

        });

    }

  }

// Add this inside your EmailService class
/**
 * Generic notification wrapper that checks if the specific event toggle is enabled
 */
async sendNotification({
  event,
  to,
  subject,
  html,
}: {
  event: keyof Pick<EmailSettings, "sendOnTaskCreate" | "sendOnTaskUpdate" | "sendOnOverdue" | "sendOnGroupAddition">;
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  // 1. Check if the master switch is active
  if (!this.settings.isActive) {
    console.log(`[EmailService] Master switch is OFF. Skipping ${event}.`);
    return false;
  }

  // 2. Check if the specific event toggle is enabled in settings
  if (!this.settings[event]) {
    console.log(`[EmailService] Toggle for ${event} is OFF. Skipping email.`);
    return false;
  }

  // 3. If both are ON, send the email
  return this.sendEmail({ to, subject, html });
}
// Add this method to your EmailService class
async sendEventNotification(
  event: 'sendOnTaskCreate' | 'sendOnTaskUpdate' | 'sendOnOverdue' | 'sendOnGroupAddition',
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  // 1. Check master switch
  if (!this.settings.isActive) return false;

  // 2. Check specific toggle (dynamic property access)
  if (!this.settings[event]) {
    console.log(`[EmailService] Notification for ${event} is disabled in settings.`);
    return false;
  }

  // 3. Send if enabled
  return this.sendEmail({ to, subject, html });
}
  // ====================================
  // Test SMTP connection
  // ====================================

  async testConnection(): Promise<boolean> {

    try {

      await this.transporter.verify();

      return true;

    } catch (error) {

      console.log(
        "Email connection failed:",
        error
      );

      return false;

    }

  }



  // ====================================
  // Send test email
  // ====================================

  async sendTestEmail(
    to: string
  ): Promise<boolean> {

    try {

      await this.transporter.sendMail({

        from: `${this.settings.fromName} <${this.settings.fromEmail}>`,

        to,

        subject:
          "Email Configuration Test",

        html: `
          <h2>Email Configuration Successful</h2>
          <p>Your email settings are working correctly.</p>
          <p>Provider: ${this.settings.provider}</p>
          <p>Time: ${new Date().toLocaleString()}</p>
        `,

      });

      return true;

    } catch (error) {

      console.error(
        "Test email failed:",
        error
      );

      return false;

    }

  }



  // ====================================
  // Send normal email
  // ====================================

  async sendEmail({

    to,

    subject,

    html,

  }: {

    to: string;

    subject: string;

    html: string;

  }): Promise<boolean> {

    try {

      await this.transporter.sendMail({

        from: `${this.settings.fromName} <${this.settings.fromEmail}>`,

        to,

        subject,

        html,

      });

      return true;

    } catch (error) {

      console.error(
        "Email send failed:",
        error
      );

      return false;

    }

  }


// Inside your EmailService class in the backend
async sendLoginOTP(to: string, code: string, userName: string): Promise<boolean> {
  return this.sendEmail({
    to,
    subject: "Security Verification Code",
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #333; text-align: center;">Login Verification</h2>
        <p>Hello <strong>${userName}</strong>,</p>
        <p>Use the following code to complete your sign-in request. This code is valid for <strong>5 minutes</strong>.</p>
        <div style="background: #f9f9f9; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2563eb; border: 1px dashed #2563eb; border-radius: 8px; margin: 20px 0;">
          ${code}
        </div>
        <p style="font-size: 12px; color: #666; text-align: center;">If you did not request this code, please ignore this email or contact your administrator.</p>
      </div>
    `,
  });
}
  // ====================================
  // Send password reset email
  // ====================================

  async sendPasswordResetEmail({

    to,

    resetLink,

  }: {

    to: string;

    resetLink: string;

  }): Promise<boolean> {

    return this.sendEmail({

      to,

      subject: "Password Reset",

      html: `
        <h2>Password Reset Request</h2>
        <p>Click below to reset your password:</p>
        <a href="${resetLink}">
          Reset Password
        </a>
      `,

    });

  }

}

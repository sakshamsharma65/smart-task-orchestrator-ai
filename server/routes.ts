import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import passwordResetRouter from "./passwordResetRoutes";
import { licenseManager, APP_ID } from "./license-manager";
import { insertUserSchema, insertTaskSchema, insertTeamSchema, insertTaskGroupSchema, insertRoleSchema, insertOfficeLocationSchema, userRoles } from "@shared/schema";
import { db } from "./db";
import bcrypt from "bcrypt";
import { toast } from "@/hooks/use-toast";
import { log } from "console";
import { activityLog } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import rateLimit from "express-rate-limit";
import {
  insertEmailSettingsSchema,
} from "@shared/schema";

import { EmailService } from "./services/email.service";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { taskAttachments } from "@shared/schema";

import fs from "fs";

// Multer configuration for file uploads
const storageConfig = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadsDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});
const upload = multer({ storage: storageConfig });

// Role-based access control middleware
// Cache roles and user roles to avoid repeated database calls
let rolesCache: any[] = [];
let rolesCacheTime = 0;
const userRolesCache = new Map<string, { roles: string[]; time: number }>();
const CACHE_TTL = 60000; // 1 minute 

// Rate limiter for 2FA verification to prevent brute force
const verify2FALimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 verify attempts per window
  message: { error: "Too many verification attempts, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for resending emails to prevent spam
const resend2FALimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // Limit each IP to 3 resend requests per window
  message: { error: "Too many resend requests, please wait a few minutes." },
});
 // Add this helper function in routes.ts (near requireRole)




 // Add this helper function in routes.ts (near requireRole)



function requireRole(allowedRoles: string[]) {
  return async (req: any, res: any, next: any) => {
    try {
      const userId = req.headers['x-user-id'];
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Check user roles cache first
      const userCacheEntry = userRolesCache.get(userId);
      let roleNames: string[];
      
      if (userCacheEntry && Date.now() - userCacheEntry.time < CACHE_TTL) {
        roleNames = userCacheEntry.roles;
      } else {
        // Get user roles (this query is already optimized with indexes)
        const userRoles = await storage.getUserRoles(userId);
        
        // Use cached roles if available and fresh
        let allRoles = rolesCache;
        if (!allRoles.length || Date.now() - rolesCacheTime > CACHE_TTL) {
          allRoles = await storage.getAllRoles();
          rolesCache = allRoles;
          rolesCacheTime = Date.now();
        }
        
        roleNames = userRoles.map(ur => {
          const role = allRoles.find(r => r.id === ur.role_id);
          return role?.name;
        }).filter(Boolean);
        
        // Cache user roles
        userRolesCache.set(userId, { roles: roleNames, time: Date.now() });
      }

      // Check if user has any of the allowed roles
      const hasPermission = allowedRoles.some(role => roleNames.includes(role)) || 
                           roleNames.includes('admin'); // Admin always has access

      if (!hasPermission) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }

      req.userRoles = roleNames;
      next();
    } catch (error) {
      console.error('Role check error:', error);
      return res.status(500).json({ error: "Authorization failed" });
    }
  };
}

// Convenience middleware functions
const requireAdmin = requireRole(['admin']);
const requireManagerOrAdmin = requireRole(['admin', 'manager', 'team_manager']);
const requireAnyAuthenticated = async (req: any, res: any, next: any) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
};

// Get user's visibility scope for data filtering
async function getUserVisibilityScope(userId: string): Promise<{ scope: string; roleNames: string[] }> {
  try {
    // Check user roles cache first
    const userCacheEntry = userRolesCache.get(userId);
    let roleNames: string[];
    
    if (userCacheEntry && Date.now() - userCacheEntry.time < CACHE_TTL) {
      roleNames = userCacheEntry.roles;
    } else {
      // Get user roles
      const userRoles = await storage.getUserRoles(userId);
      
      // Use cached roles if available
      let allRoles = rolesCache;
      if (!allRoles.length || Date.now() - rolesCacheTime > CACHE_TTL) {
        allRoles = await storage.getAllRoles();
        rolesCache = allRoles;
        rolesCacheTime = Date.now();
      }
      
      roleNames = userRoles.map(ur => {
        const role = allRoles.find(r => r.id === ur.role_id);
        return role?.name;
      }).filter(Boolean);
      
      // Cache user roles
      userRolesCache.set(userId, { roles: roleNames, time: Date.now() });
    }

    // Determine visibility scope based on roles
    let scope = "user"; // Default to most restrictive
    
    if (roleNames.includes('admin')) {
      scope = "organization";
    } else if (roleNames.includes('manager') || roleNames.includes('team_manager')) {
      scope = "team";
    }
    
    return { scope, roleNames };
  } catch (error) {
    console.error('Error getting user visibility scope:', error);
    return { scope: "user", roleNames: [] };
  }
}
export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  // Check if system has any users (for initial setup)
const uploadsDir = path.join(process.cwd(), "uploads");
  
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log("📁 'uploads' directory created.");
  }
  app.use('/uploads', express.static('uploads'));
  app.get("/api/auth/system-status", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json({ hasUsers: users.length > 0 });
    } catch (error) {
      console.error('System status check error:', error);
      res.status(500).json({ error: "Failed to check system status" });
    }
  });

  // First-time super admin registration
  app.post("/api/auth/register-super-admin", async (req, res) => {
    try {
      const { name, email, password } = req.body;
      
      if (!name || !email || !password) {
        return res.status(400).json({ error: "Name, email and password are required" });
      }

      // Check if system already has users
      const existingUsers = await storage.getAllUsers();
      if (existingUsers.length > 0) {
        return res.status(403).json({ error: "System already has users. Registration not allowed." });
      }

      // Check if email is already used
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: "Email already exists" });
      }

      // Hash password
      const saltRounds = 10;
      const password_hash = await bcrypt.hash(password, saltRounds);

      // Create super admin user
      const newUser = await storage.createUser({
        
        user_name: name,
        email: email,
        password_hash: password_hash,
        department: "Administration",
        phone: "",
        manager: "",
        is_active: true,
        benchmarking_excluded: false
      });
      

      // Get admin role
      const adminRole = await storage.getAllRoles().then(roles => 
        roles.find(role => role.name === 'admin')
      );

      if (adminRole) {
        // Assign admin role to user
        await storage.assignUserRole(newUser.id, adminRole.id);
      }

      // Return user info (excluding password)
      const { password_hash: _, ...userInfo } = newUser;
      res.json(userInfo);
    } catch (error) {
      console.error('Super admin registration error:', error);
      res.status(500).json({ error: "Registration failed" });
    }
  });
  app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }
    
    const user = await storage.getUserByEmail(email);
    
    if (user?.is_active === false) {
      return res.status(403).json({ error: "User account is deactivated" });
    }
    
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    if (user.password_hash) {
      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
    }
    
    // ==========================================
    // THE FORK: Check if 2FA is enabled
    // ==========================================
    if (user.is_2fa_enabled) {
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const otpHash = await bcrypt.hash(otpCode, 10);
      const tempToken = uuidv4();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry
      
      // Clear old OTPs and create new one
      await storage.invalidateOldLoginOtps(user.id);
      await storage.createLoginOtp(user.id, tempToken, otpHash, expiresAt);
      
      // Fetch dynamic email settings
      const emailSettings = await storage.getEmailSettings();
      if (!emailSettings || !emailSettings.isActive) {
        return res.status(500).json({ error: "System error: Email provider not configured." });
      }
      
      const emailService = new EmailService(emailSettings);
      
      try {
        // You will need to ensure this method exists in your EmailService class
        await emailService.sendLoginOTP(user.email, otpCode, user.user_name || "User");
      } catch (emailError) {
        console.error("Failed to send 2FA email:", emailError);
        return res.status(500).json({ error: "Failed to send verification code." });
      }
      
      // Return 202 Accepted. Do NOT return user info yet.
      return res.status(202).json({ 
        mfaRequired: true, 
        tempToken: tempToken,
        message: "Verification code sent to your email." 
      });
    }

    // ==========================================
    // LEGACY FLOW: 2FA Disabled
    // ==========================================
    const { password_hash, ...userInfo } = user;
    res.json(userInfo);
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: "Login failed" });
  }
});

app.post("/api/auth/verify-2fa", verify2FALimiter, async (req, res) => {
  try {
    const { tempToken, code } = req.body;

    if (!tempToken || !code) {
      return res.status(400).json({ error: "Token and code are required" });
    }

    const otpRecord = await storage.getLoginOtpByTempToken(tempToken);

    if (!otpRecord) {
      return res.status(401).json({ error: "Invalid session. Please log in again." });
    }

    if (otpRecord.used) {
      return res.status(401).json({ error: "This code has already been used." });
    }

    if (new Date() > new Date(otpRecord.expires_at)) {
      return res.status(401).json({ error: "This code has expired. Please request a new one." });
    }

    if (otpRecord.attempts >= 5) {
      await storage.invalidateOldLoginOtps(otpRecord.user_id);
      return res.status(429).json({ error: "Too many failed attempts. Please log in again." });
    }

    const isValidCode = await bcrypt.compare(code, otpRecord.otp_hash);

    if (!isValidCode) {
      await storage.incrementOtpAttempts(otpRecord.id);
      return res.status(401).json({ error: "Invalid verification code." });
    }

    // Success! 
    await storage.markOtpAsUsed(otpRecord.id);
    
    const user = await storage.getUser(otpRecord.user_id); 
    
    if (!user || user.is_active === false) {
      return res.status(403).json({ error: "User account is deactivated" });
    }

    const { password_hash, ...userInfo } = user;
    
    // Return the full user info so the frontend can complete the login
    res.status(200).json(userInfo);

  } catch (error) {
    console.error('2FA verification error:', error);
    res.status(500).json({ error: "Verification failed" });
  }
});
app.post("/api/auth/resend-2fa", resend2FALimiter, async (req, res) => {
  try {
    const { tempToken } = req.body;

    if (!tempToken) {
      return res.status(400).json({ error: "Session token required" });
    }

    // Identify the user from the existing temp token
    const oldOtpRecord = await storage.getLoginOtpByTempToken(tempToken);
    
    if (!oldOtpRecord) {
      return res.status(401).json({ error: "Session invalid or expired. Please log in again." });
    }

    const user = await storage.getUser(oldOtpRecord.user_id);
    if (!user || !user.is_active) {
      return res.status(403).json({ error: "Account unavailable" });
    }

    // Generate new code and new token
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otpCode, 10);
    const newTempToken = uuidv4();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Invalidate the old ones, create the new one
    await storage.invalidateOldLoginOtps(user.id);
    await storage.createLoginOtp(user.id, newTempToken, otpHash, expiresAt);

    // Send the email
    const emailSettings = await storage.getEmailSettings();
    if (emailSettings && emailSettings.isActive) {
      const emailService = new EmailService(emailSettings);
      await emailService.sendLoginOTP(user.email, otpCode, user.user_name || "User");
    } else {
      return res.status(500).json({ error: "Email service unavailable." });
    }

    // Return the new token to the frontend
    res.status(200).json({ 
      tempToken: newTempToken, 
      message: "A new verification code has been sent." 
    });

  } catch (error) {
    console.error('2FA resend error:', error);
    res.status(500).json({ error: "Failed to resend code" });
  }
});
// Add this to your Express routes file
app.patch("/api/users/:id/2fa", requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const { enabled } = req.body; // Expecting { enabled: true/false }

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ error: "Invalid 'enabled' value. Must be boolean." });
    }

    // Update the user record in the DB
    await storage.updateUser2FAStatus(userId, enabled);

    res.json({ 
      success: true, 
      message: `2FA has been ${enabled ? 'enabled' : 'disabled'} for this user.` 
    });
  } catch (error) {
    console.error("Error toggling 2FA:", error);
    res.status(500).json({ error: "Failed to update 2FA status" });
  }
});

  // app.post("/api/auth/login", async (req, res) => {
  //   try {
  //     const { email, password } = req.body;
      
  //     if (!email || !password) {
  //       return res.status(400).json({ error: "Email and password required" });
  //     }
      
  //     const user = await storage.getUserByEmail(email);
  //     if(user?.is_active === false){
        
  //       return res.status(403).json({ error: "User account is deactivated" });
  //     }
  //     if (!user) {
  //       return res.status(401).json({ error: "Invalid credentials" });
  //     }
      
  //     // Check password if user has one, otherwise allow login with any password (for migrated users)
  //     if (user.password_hash) {
  //       const isValid = await bcrypt.compare(password, user.password_hash);
  //       if (!isValid) {
  //         return res.status(401).json({ error: "Invalid credentials" });
  //       }
  //     }
      
  //     // Return user info (excluding password)
  //     const { password_hash, ...userInfo } = user;
  //     res.json(userInfo);
  //   } catch (error) {
  //     res.status(500).json({ error: "Login failed" });
  //   }
  // });

  // Mount password reset routes (forgot password flow)
  app.use(passwordResetRouter);

  // User management routes - Admin/Manager only
  app.get("/api/users",  async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] as string;
      const { scope, roleNames } = await getUserVisibilityScope(userId);
      
      let users;
      
      if (scope === "organization") {
        // Admin can see all users
        users = await storage.getAllUsers();
      } else if (scope === "team") {
        // Manager/Team Manager can only see their direct reports and team members
        const currentUser = await storage.getUser(userId);
        if (!currentUser) {
          return res.status(403).json({ error: "User not found" });
        }
        
        // Get all users where current user is the manager
        const allUsers = await storage.getAllUsers();
        const directReports = allUsers.filter(user => user.manager === userId);
        
        // Also get users in the same teams as the current user
        const userTeams = await storage.getTeamsByUser(userId);
        const teamMemberIds = new Set<string>();
        
        for (const team of userTeams) {
          const teamMembers = await storage.getTeamMembers(team.id);
          teamMembers.forEach(member => teamMemberIds.add(member.user_id));
        }
        
        // Combine direct reports and team members, avoiding duplicates
        const visibleUserIds = new Set([
          ...directReports.map(u => u.id),
          ...teamMemberIds,
          userId // Include self
        ]);
        
        users = allUsers.filter(user => visibleUserIds.has(user.id));
      } else {
        // Regular user can only see themselves
        users = [await storage.getUser(userId)].filter(Boolean);
      }
      
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });
  app.get("/api/usersName", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      return res.status(401).json({ error: "Missing user id" });
    }

    // 1. Fetch current user
    const currentUser = await storage.getUser(userId);
    if (!currentUser) {
      return res.status(404).json({ error: "User not found" });
    }



    // 3. Fetch all users (only id + name)
    const allUsers = await storage.getAllUsers();
    const result = allUsers.map(u => ({
      id: u.id,
      name: u.user_name,
    }));

    return res.json(result);
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.put("/api/users/:id", async (req, res) => {
  const userId = req.params.id;
  const actingUserId = req.user?.id; // whoever is logged in

  try {
    // 1️⃣ Fetch old user details (before update)
    const [oldUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    // 2️⃣ Update the user
    await db
      .update(users)
      .set({
        user_name: req.body.user_name,
        department: req.body.department,
        phone: req.body.phone,
        manager: req.body.manager,
      })
      .where(eq(users.id, userId));

    // 3️⃣ Fetch new user details (after update)
    const [newUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    // 4️⃣ Log only changed fields
    const summary: any = {};

    if (oldUser.user_name !== newUser.user_name) {
      summary.user_name = { from: oldUser.user_name, to: newUser.user_name };
    }

    if (oldUser.department !== newUser.department) {
      summary.department = { from: oldUser.department, to: newUser.department };
    }

    if (oldUser.phone !== newUser.phone) {
      summary.phone = { from: oldUser.phone, to: newUser.phone };
    }

    if (oldUser.manager !== newUser.manager) {
      summary.manager = { from: oldUser.manager, to: newUser.manager };
    }

    // If something changed, log it
    if (Object.keys(summary).length > 0) {
      await storage.logActivity({
        source_table: "users",
        event_type: "UPDATE",
        record_id: userId,
        summary,
        performed_by: actingUserId,
      });
    }

    res.json({ message: "User updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Update failed" });
  }
});
// ================= ACTIVITY LOG API ======================
app.get("/api/activity-log",  async (req, res) => {
  try {
    const logs = await db
      .select()
      .from(activityLog)
      .orderBy(desc(activityLog.occurred_at));

    res.json(logs);
  } catch (error) {
    console.error("Failed to fetch activity log:", error);
    res.status(500).json({ error: "Error fetching activity log" });
  }
});
// Inside registerRoutes in routes.ts

// PATCH: Update specific email/notification settings
app.patch("/api/email-settings/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    // Partial update allows us to send only the toggles
    const updatedSettings = await storage.updateEmailSettings(id, req.body);
    
    // await storage.logActivity({
    //   source_table: "email_settings",
    //   event_type: "UPDATE_NOTIFICATIONS",
    //   record_id: id.toString(),
    //   summary: req.body,
    //   performed_by: req.headers["x-user-id"] as string,
    // });

    res.json(updatedSettings);
  } catch (error: any) {
    console.error("Failed to update notification settings:", error);
    res.status(500).json({ error: "Failed to update settings" });
  }
});





  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

app.post("/api/users", requireAdmin, async (req, res) => {
  try {
    // --- License check logic (no changes) ---
    const actingUserId = req.headers["x-user-id"] as string;
    const currentUser = await storage.getUser(actingUserId);
    const settings = await storage.getOrganizationSettings(); 
  
  // 2. Set the default 2FA status based on org requirements
  const newUser = {
    ...req.body,
    is_2fa_enabled: settings?.user_2fa_required || false 
  };

    if (!currentUser) {
      return res.status(403).json({ error: "User not found" });
    }

    const allUsers = await storage.getAllUsers();
    const activeUserCount =
      allUsers.filter((user) => user.is_active !== false).length;

    const licenseStatus = await licenseManager.getLicenseStatus(currentUser.id);

    if (licenseStatus.hasLicense && licenseStatus.userLimits) {
      const { maximum } = licenseStatus.userLimits;
      if (activeUserCount >= maximum) {
        return res.status(400).json({
          error: `Cannot create or activate user. License limit reached (${activeUserCount}/${maximum} users).`,
          licenseLimit: maximum,
          currentUsers: activeUserCount,
        });
      }
    }

    // ----------------------------------------------------------
    // STEP 1: Extract fields & hash password
    // ----------------------------------------------------------
    const { password, role, ...restOfBody } = req.body;
    const roleId = role;

    let password_hash = null;

    if (password && typeof password === "string" && password.length > 0) {
      const saltRounds = 10;
      password_hash = await bcrypt.hash(password, saltRounds);
    } else {
      return res
        .status(400)
        .json({ error: "Password is required for new user creation." });
    }

    // Construct final payload
    const userPayload = {
      ...restOfBody,
      password_hash,
      is_active: true,
    };

    // Validate with Zod
    const userData = insertUserSchema.parse(userPayload);

    // ----------------------------------------------------------
    // STEP 2: Create the user
    // ----------------------------------------------------------
    const user = await storage.createUser(userData);

    // ----------------------------------------------------------
    // STEP 3: Assign Role
    // ----------------------------------------------------------
    if (user && user.id && roleId) {
      try {
        await storage.assignUserRole(user.id, roleId);

        // ⭐ Log role assignment also
        await storage.logActivity({
          source_table: "user_roles",
          event_type: "ROLE_ADDED",
          record_id: user.id,
          summary: { role_added: roleId },
          performed_by: actingUserId,
        });
      } catch (err) {
        console.error(
          `Failed to assign role ${roleId} to new user ${user.id}:`,
          err
        );
      }
    }

    // ----------------------------------------------------------
    // ⭐ STEP 4: Log USER CREATION EVENT
    // ----------------------------------------------------------
    await storage.logActivity({
      source_table: "users",
      event_type: "CREATED_USER",
      record_id: user.id,
      summary: {
        user_name: user.user_name,
        email: user.email,
        department: user.department,
      },
      performed_by: actingUserId, // Admin who created the user
    });

    // ----------------------------------------------------------
    // STEP 5: Respond
    // ----------------------------------------------------------
    return res.status(201).json(user);
  } catch (error: any) {
    console.error("API ERROR:", error);

    if (error.name === "ZodError") {
      return res.status(400).json({
        error: "Invalid input",
        details: error.errors,
      });
    }

    if (
      error.code === "23505" ||
      error?.message?.includes("duplicate key") ||
      error?.detail?.includes("already exists")
    ) {
      return res.status(400).json({ error: "Email already exists" });
    }

    if (error.message?.includes("License limit reached")) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(400).json({ error: "Invalid user data" });
  }
});

// ... (End of surrounding code context)

  app.patch("/api/users/:id", requireManagerOrAdmin, async (req, res) => {
    try {
      const user = await storage.updateUser(req.params.id, req.body);
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // Deactivate user (admin only)
app.patch("/api/users/:id/deactivate", requireAdmin, async (req, res) => {
  try {
    const targetUserId = req.params.id;

    // Fetch user's roles
    const targetUserRoles = await storage.getUserRoles(targetUserId);
    const isTargetUserAdmin = targetUserRoles.some(ur => ur.role?.name === "admin");

    if (isTargetUserAdmin) {
      // Count total ACTIVE admins
      const allUsers = await storage.getAllUsers();

      const activeAdmins = allUsers.filter(
        user => user.role_name === "admin" && user.is_active === true
      );
      

      // If only one admin remains, block deactivation
      if (activeAdmins.length <= 1) {
        return res.status(400).json({
          error: "Cannot deactivate user. At least one active admin must remain in the system."
        });
      }
    }

    // Proceed with deactivation
    const user = await storage.deactivateUser(targetUserId);
    res.json(user);
    await storage.logActivity({
  source_table: "users",
  event_type: "DEACTIVATED",
  record_id: targetUserId,
  summary: { message: "User deactivated",
  user_name: user.user_name,
  email: user.email
   },
   performed_by: Array.isArray(req.headers["x-user-id"])
    ? req.headers["x-user-id"][0]
    : req.headers["x-user-id"] ?? null,
});


  } catch (error) {
    console.error("Error deactivating user:", error);
    res.status(500).json({ error: "Failed to deactivate user" });
  }
});


  // Activate user (admin only)
  app.patch("/api/users/:id/activate", requireAdmin, async (req, res) => {
    console.log('saksham activate ribhu api hit')
    try {
      console.log('activate ribhu api hit')
      // Check license user limits before activating user
      const userId = req.headers['x-user-id'] as string;
      const currentUser = await storage.getUser(userId);
      if (!currentUser) {
        console.log('User not found during activation') ;
        return res.status(403).json({ error: "User not found" });
      }

      // Get current active user count
      const allUsers = await storage.getAllUsers();
      const activeUserCount = allUsers.filter(user => user.is_active !== false).length;
      console.log("activesak", activeUserCount);

      // Check license limits
      const licenseStatus = await licenseManager.getLicenseStatus(currentUser.id);
      console.log("licenseStatus", licenseStatus);
      console.log("hasLicense", licenseStatus.hasLicense);
      if (licenseStatus.hasLicense && licenseStatus.userLimits) {
        console.log(" ribhu Inside license check");
        const { maximum } = licenseStatus.userLimits;
        console.log("max", maximum);
        if (activeUserCount > maximum) {
          return res.status(400).json({ 
            error: `Cannot activate user. License limit reached (${activeUserCount}/${maximum} users). Please upgrade your license or deactivate other users first.`,
            licenseLimit: maximum,
            currentUsers: activeUserCount
          });
        }
      }

      const user = await storage.activateUser(req.params.id);
      await storage.logActivity({
  source_table: "users",
  event_type: "ACTIVATED",
  record_id: req.params.id,
  summary: { 
  message: "User activated",
  user_name: user.user_name,
  email: user.email
},

  performed_by: Array.isArray(req.headers["x-user-id"])
    ? req.headers["x-user-id"][0]
    : req.headers["x-user-id"] ?? null,
});

      res.json(user);
    } catch (error) {
      console.error("Error activating user:", error);
      res.status(500).json({ error: "Failed to activate user" });
    }
  });

  // Reset user password (admin only)
  app.patch("/api/users/:id/reset-password", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { password } = req.body;

      if (!password || password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters long" });
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Update user's password
      const updatedUser = await storage.updateUser(id, {
        password_hash: hashedPassword,
        updated_at: new Date()
      });
      await storage.logActivity({
  source_table: "users",
  event_type: "PASSWORD_RESET",
  record_id: id,
  summary: { message: "Password reset by admin" },
performed_by: Array.isArray(req.headers["x-user-id"])
    ? req.headers["x-user-id"][0]
    : req.headers["x-user-id"] ?? null,
});


      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({ error: "Failed to reset password" });
    }
  });
app.post("/api/tasks", requireAnyAuthenticated, upload.array('attachments'), async (req, res) => {
    try {
      const userId = req.headers["x-user-id"] as string;
      const currentUser = await storage.getUser(userId);

      if (!currentUser) {
        return res.status(403).json({ error: "User not found or deleted" });
      }

      // Convert Multer's string-based body back to proper types for Zod
      const rawBody = {
        ...req.body,
        priority: req.body.priority ? Number(req.body.priority) : 2,
        estimated_hours: req.body.estimated_hours ? Number(req.body.estimated_hours) : null,
        is_time_managed: req.body.is_time_managed === 'true',
        // If team_id is an empty string, set it to null
        team_id: req.body.team_id || null,
        todos_enabled: req.body.todos_enabled === 'true'
      };

      // 1. Create the Task
      const taskData = insertTaskSchema.parse(rawBody);
      const task = await storage.createTask(taskData);

      // 2. Handle File Attachments (if any)
      if (req.files && Array.isArray(req.files)) {
        const filePromises = (req.files as Express.Multer.File[]).map(file => {
          return storage.createTaskAttachment({
            task_id: task.id,
            filename: file.originalname,
            file_url: `/uploads/${file.filename}`, // Virtual path
            mimetype: file.mimetype,
            uploaded_by: userId
          });
        });
        await Promise.all(filePromises);
      }
      const settings = await storage.getEmailSettings();
if (settings && task.assigned_to) {
  const assignee = await storage.getUser(task.assigned_to);
  if (assignee?.email) {
    const emailService = new EmailService(settings);
    // Fires notification only if sendOnTaskCreate is true
    emailService.sendNotification({
      event: "sendOnTaskCreate",
      to: assignee.email,
      subject: `New Task: ${task.title}`,
      html: `<p>Hi ${assignee.user_name}, you have a new task: <b>${task.title}</b></p>`
    });
  }
}
      await storage.logTaskActivity({
      task_id: task.id,
      action_type: "created",
      old_value: null,
      new_value: task.assigned_to,
      acted_by: task.created_by,
    });

      // 3. Log Activity
      await storage.logActivity({
        source_table: "tasks",
        event_type: "created",
        record_id: task.id,
        summary: { 
          title: task.title, 
          has_attachments: !!req.files?.length ,
          assigned_to: task.assigned_to,
        },
        performed_by: userId,
      });

      return res.status(201).json(task);
    } catch (error: any) {
      console.error("[ERROR] Task creation failed:", error);
      return res.status(400).json({ 
        error: "Invalid task data", 
        details: error.message 
      });
    }
  });
  app.get("/api/tasks/:id/attachments", requireAnyAuthenticated, async (req, res) => {
try{
  const { id } = req.params;
  const attachments = await storage.getTaskAttachments(id);
  return res.json(attachments);

}
catch(error){

  console.error("Failed to fetch attachments:", error);
  return res.status(500).json({error:"failed to load attachments"})
}



  });
  // Delete user (admin only)
  // app.delete("/api/users/:id", requireAdmin, async (req, res) => {
  //   try {
  //     const deletedBy = req.headers['x-user-id'];
  //     if (!deletedBy) {
  //       return res.status(401).json({ error: "User not authenticated" });
  //     }
  //     console.log('Deleting user', req.params.id, 'by', deletedBy);
  //     const result = await storage.deleteUser(req.params.id, deletedBy);
    //   await storage.logActivity({
    //   source_table: "users",
    //   event_type: "DELETE",
    //   record_id: userId,
    //   summary: {
    //     email: oldUser.email,
    //     user_name: oldUser.user_name,
    //     department: oldUser.department,
    //   },
    //   performed_by: deletedBy,
    // });
  //     res.json(result);
  //   } catch (error) {
  //     console.error("Error deleting user:", error);
  //     res.status(500).json({ error: "Failed to delete user" });
  //   }
     
  // });
app.delete("/api/users/:id", requireAdmin, async (req, res) => {
  try {
    const deletedBy = Array.isArray(req.headers["x-user-id"])
      ? req.headers["x-user-id"][0]
      : req.headers["x-user-id"] ?? null;

    const userId = req.params.id;
    if (!deletedBy) return res.status(401).json({ error: "User not authenticated" });

    const oldUser = await storage.getUser(userId);
    if (!oldUser) return res.status(404).json({ error: "User not found" });

    // 1️⃣ Log activity BEFORE deletion
    const tasksAssigned = await storage.getTasksByUser(userId);
    const taskAssignedTitles = tasksAssigned.map(t => t.title).join(", ");
   
    await storage.logActivity({
      source_table: "users",
      event_type: "DELETED_USER",
      record_id: userId,
      summary: {
      email: oldUser.email,
      user_name: oldUser.user_name,
      department: oldUser.department,
      tasks_assigned_count: tasksAssigned.length,
}
,
      performed_by: deletedBy,
    });

    // 2️⃣ Remove MANAGER references (teams where user is manager)
    const teamsManaged = await storage.getTeamsManagedBy(userId);
    for (const team of teamsManaged) {
      await storage.updateTeam(team.id, { manager_id: null });
    }

    // 3️⃣ Remove USER from team MEMBERSHIPS
    const teamsWhereMember = await storage.getTeamsByUser(userId);
    for (const team of teamsWhereMember) {
      await storage.removeTeamMember(team.id, userId);
    }

    // 4️⃣ Finally delete user
    const result = await storage.deleteUser(userId, deletedBy);

    res.json(result);
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
});






  // Get deleted users (admin only)
  app.get("/api/deleted-users", requireAdmin, async (req, res) => {
    try {
      const deletedUsers = await storage.getAllDeletedUsers();
      res.json(deletedUsers);
    } catch (error) {
      console.error("Error fetching deleted users:", error);
      res.status(500).json({ error: "Failed to fetch deleted users" });
    }
  });
// Get ALL task group memberships (group_id ↔ user_id)
   app.get("/api/task-group-members", requireAnyAuthenticated, async (req, res) => {
   try {
    const memberships = await storage.getAllTaskGroupMembers(); 
    // Must return array like:
    // [ { group_id: "...", user_id: "..." }, ... ]
    res.json(memberships);
  } catch (error) {
    console.error("Failed to fetch task group memberships:", error);
    res.status(500).json({ error: "Failed to fetch task group memberships" });
  }
});

  // Get deleted user tasks (admin only)
  app.get("/api/deleted-users/:id/tasks", requireAdmin, async (req, res) => {
    try {
      const tasks = await storage.getDeletedUserTasks(req.params.id);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching deleted user tasks:", error);
      res.status(500).json({ error: "Failed to fetch deleted user tasks" });
    }
  });

  // Bulk user upload (replacing Supabase Edge Function)
  app.post("/api/admin/bulk-upload-users", async (req, res) => {
    try {
      let { users } = req.body;
      if (!Array.isArray(users)) {
        return res.status(400).json({ error: "No users array in payload." });
      }

      // Normalize and validate users
      users = users
        .map((u) => ({
          email: (u.email || u.Email || "").trim(),
          user_name: u.user_name || u["Employee Name"] || "",
          department: u.department || u.Department || "",
          manager: u.manager || u.Manager || "",
          phone: u.phone || u.Phone || "",
        }))
        .filter((u) => u.email && /^[\w.-]+@[\w.-]+\.\w+$/.test(u.email));

      if (users.length === 0) {
        return res.status(400).json({ error: "No valid users to process." });
      }

      // Check for existing emails
      const allUsers = await storage.getAllUsers();
      const existingEmailSet = new Set(allUsers.map((u) => u.email.toLowerCase()));

      const toInsert = users.filter((u) => !existingEmailSet.has(u.email.toLowerCase()));
      const skipped = users.filter((u) => existingEmailSet.has(u.email.toLowerCase()));

      let insertCount = 0;
      let insertError = null;

      // Insert new users
      for (const user of toInsert) {
        try {
          await storage.createUser(user);
          insertCount++;
        } catch (error) {
          insertError = `Failed to insert user ${user.email}`;
          break;
        }
      }

      res.json({
        success: true,
        inserted: insertCount,
        skipped: skipped.length,
        skipped_emails: skipped.map((u) => u.email),
        error: insertError,
        status: insertError ? "partial" : "success",
        message: insertError
          ? `Inserted ${insertCount}, skipped ${skipped.length} (duplicates), error: ${insertError}`
          : `Inserted ${insertCount}, skipped ${skipped.length} (duplicates).`,
      });
    } catch (error) {
      res.status(500).json({ error: "An unexpected error occurred." });
    }
  });

  // Task management routes - Visibility-aware access
  app.get("/api/tasks", requireAnyAuthenticated, async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] as string;
      const { scope, roleNames } = await getUserVisibilityScope(userId);

      
      let tasks;
      
      if (scope === "organization") {
        // Admin can see all tasks
        tasks = await storage.getAllTasks();
      } else if (scope === "team") {
        // Manager/Team Manager can see tasks for their team members
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }
        
        // Get all users that this manager can see (including themselves)
        const allUsers = await storage.getAllUsers();
        const visibleUserIds = allUsers
          .filter(u => u.manager === userId || u.id === userId)
          .map(u => u.id);
        
        // Get tasks for visible users only
        const allTasks = await storage.getAllTasks();
        tasks = allTasks.filter(task => visibleUserIds.includes(task.assigned_to));
      } else {
        // User scope - can only see their own tasks
        tasks = await storage.getTasksByUser(userId);
      }
      
          // === NEW MANAGER TEAM LOGIC (attach additional tasks) ===
      const managerTeamTasks = await storage.getTasksForManager(userId);

      // Combine tasks + managerTeamTasks safely
      const merged = [...tasks, ...managerTeamTasks];

      // === REMOVE DUPLICATES BY task.id ===
      const dedupedTasks = Array.from(
        new Map(merged.map((task) => [task.id, task])).values()
      );

      return res.json(dedupedTasks);
    } catch (error) {
      console.error('Error fetching tasks with visibility scope:', error);
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });
  // app.get("/api/tasks", requireAnyAuthenticated, async (req, res) => {
  //   try {
  //     const userId = req.headers["x-user-id"] as string;

  //     // === NORMAL EXISTING LOGIC (unchanged) ===
  //     let tasks;

  //     const user = await storage.getUser(userId);
  //     if (!user) {
  //       return res.status(404).json({ error: "User not found" });
  //     }

  //     if (user.isAdmin) {
  //       // Admin logic
  //       tasks = await storage.getAllTasks();
  //     } else if (user.isManager) {
  //       // Old manager logic
  //       const allUsers = await storage.getAllUsers();
  //       const visibleUserIds = allUsers
  //         .filter((u) => u.manager === userId || u.id === userId)
  //         .map((u) => u.id);

  //       const allTasks = await storage.getAllTasks();
  //       tasks = allTasks.filter((task) =>
  //         visibleUserIds.includes(task.assigned_to)
  //       );
  //     } else {
  //       // Normal user logic
  //       tasks = await storage.getTasksByUser(userId);
  //     }

  //     // === NEW MANAGER TEAM LOGIC (attach additional tasks) ===
  //     const managerTeamTasks = await storage.getTasksForManager(userId);

  //     // Combine tasks + managerTeamTasks safely
  //     const merged = [...tasks, ...managerTeamTasks];

  //     // === REMOVE DUPLICATES BY task.id ===
  //     const dedupedTasks = Array.from(
  //       new Map(merged.map((task) => [task.id, task])).values()
  //     );

  //     return res.json(dedupedTasks);

  //   } catch (error) {
  //     console.error("Error fetching tasks:", error);
  //     return res.status(500).json({ error: "Failed to fetch tasks" });
  //   }
  // });



  app.get("/api/tasks/:id", async (req, res) => {
    try {
      const task = await storage.getTask(req.params.id);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch task" });
    }
  });




 app.post("/api/tasks", requireAnyAuthenticated, async (req, res) => {
  debugger
  try {
    const userId = req.headers["x-user-id"] as string;

    const currentUser = await storage.getUser(userId);
    if (!currentUser) {
      return res.status(403).json({ error: "Your account has been Deleted by admin" });
    }

    console.log("[DEBUG] Task creation request body:", JSON.stringify(req.body, null, 2));
    const taskData = insertTaskSchema.parse(req.body);
    const task = await storage.createTask(taskData);
    await storage.logTaskActivity({
      task_id: task.id,
      action_type: "created",
      old_value: null,
      new_value: task.assigned_to,
      acted_by: task.created_by,
    });
    // AFTER task is created
await storage.logActivity({
  source_table: "tasks",
  event_type: "CREATED_TASK",
  record_id: task.id,
  summary: {
    title: task.title,
    assigned_to: task.assigned_to,
    created_at: task.created_at,
  },
  performed_by: userId,
});
// After const task = await storage.createTask(taskData);

  const settings = await storage.getEmailSettings();

  // PRODUCTION LOGIC: Skip email if creator is the assignee or if it's a personal task
  const isSelfAssignment = task.created_by === task.assigned_to;
  const isPersonal = req.body.type?.toLowerCase() === "personal";

  if (settings?.sendOnTaskCreate && task.assigned_to && !isSelfAssignment && !isPersonal) {
    const assignee = await storage.getUser(task.assigned_to);
    if (assignee?.email) {
      const service = new EmailService(settings);
      service.sendNotification({
        event: "sendOnTaskCreate",
        to: assignee.email,
        subject: `New Assignment: ${task.title}`,
        html: `<p>Hi ${assignee.user_name}, a new task has been assigned to you by a team member.</p>`
      });
    }
  }


    return res.status(201).json(task);
  } catch (error) {
    console.error("[ERROR] Task creation failed:", error);
    return res.status(400).json({
      error: "Invalid task data",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});


  app.patch("/api/tasks/:id", requireAnyAuthenticated, async (req, res) => {
    try {
      console.log("[DEBUG] Task update request body:", JSON.stringify(req.body, null, 2));
      const oldTask = await storage.getTask(req.params.id);
      const actingUserId = req.headers['x-user-id'] as string;
      const taskId = req.params.id;
      if (req.body.status.toLowerCase() === "completed") {
      // Check if this task has todos enabled
      if (oldTask?.todos_enabled) {
        const pendingCount = await storage.countPendingTaskTodos(taskId);
        
        if (pendingCount > 0) {
          // We return a 400 with a specific error code so the UI knows to show the POPUP
          return res.status(400).json({ 
            error: "PENDING_TODOS_REMAINING", 
            count: pendingCount,
            message: `Cannot complete task. There are ${pendingCount} pending todos that must be finished first.` 
          });
        }
      }
    }
      // Check daily hour limit if task is being Completed
      if (req.body.status === "Completed" && oldTask && oldTask.status.toLowerCase() !== "completed") {
        const userId = req.headers['x-user-id'] as string || oldTask.assigned_to || oldTask.created_by;
        const settings = await storage.getOrganizationSettings();
        
        if (settings?.daily_hour_limit_enabled) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          
          // Get all user tasks for today
          const userTasks = await storage.getTasksByUser(userId);
          const todayTasks = userTasks.filter(task => {
            const taskDate = task.updated_at ? new Date(task.updated_at) : new Date(task.created_at);
            return taskDate >= today && taskDate < tomorrow;
          });
          
          // Calculate current daily hours
          let currentDailyHours = 0;
          for (const task of todayTasks) {
            if (task.id === oldTask.id) continue; // Skip the current task being updated
            
            if (task.is_time_managed && task.time_spent_minutes > 0) {
              currentDailyHours += task.time_spent_minutes / 60;
            } else if (!task.is_time_managed && task.status === 'Completed' && task.estimated_hours > 0) {
              currentDailyHours += task.estimated_hours;
            }
          }
          
          // Calculate hours for current task being Completed
          let taskHours = 0;
          if (oldTask.is_time_managed && oldTask.time_spent_minutes > 0) {
            taskHours = oldTask.time_spent_minutes / 60;
          } else if (!oldTask.is_time_managed && oldTask.estimated_hours > 0) {
            taskHours = oldTask.estimated_hours;
          }
          
          const totalHours = currentDailyHours + taskHours;
          
          if (totalHours > settings.max_daily_hours_limit) {
            return res.status(400).json({
              error: "Daily hour limit exceeded",
              details: `Completing this task would result in ${totalHours.toFixed(1)} hours for today, which exceeds the daily limit of ${settings.max_daily_hours_limit} hours. Current daily hours: ${currentDailyHours.toFixed(1)}, Task hours: ${taskHours.toFixed(1)}.`
            });
          }
        }
      }
      
      // Validate the update data using the insert schema (partial update)
      const updateData = insertTaskSchema.partial().parse(req.body);
      
      const task = await storage.updateTask(req.params.id, updateData);
      const emailSettings = await storage.getEmailSettings();
const assignedUser = task.assigned_to
  ? await storage.getUser(task.assigned_to)
  : null;
      const userId = req.headers['x-user-id'] as string || task.assigned_to || task.created_by;
      
      // Log various activity changes
      if (oldTask) {
        console.log("[DEBUG] Checking for activity changes - userId:", userId);
        // Status change
        if (req.body.status && oldTask.status !== req.body.status) {
          console.log("[DEBUG] Status change detected:", oldTask.status, "->", req.body.status);
          
          await storage.logTaskActivity({
            task_id: task.id,
            action_type: "status_changed",
            old_value: oldTask.status,
            new_value: req.body.status,
            acted_by: userId,
          });
          await storage.logActivity({
  source_table: "tasks",
  event_type: "STATUS_CHANGED",
  record_id: task.id,
  summary: {
    title: task.title,
     old_value: oldTask.status,
            new_value: req.body.status,
    assigned_to: task.assigned_to,
    created_at: task.created_at,
  },
  performed_by: userId,
});

 if (emailSettings && assignedUser?.email) {
    await new EmailService(emailSettings).sendNotification({
      event: "sendOnTaskUpdate",
      to: assignedUser.email,
      subject: `Task Status Updated: ${task.title}`,
      html: `
        <p>Status of task <b>${task.title}</b> has been updated.</p>
        <p><b>Old Status:</b> ${oldTask.status}</p>
        <p><b>New Status:</b> ${req.body.status}</p>
      `,
    });
  }
          console.log("[DEBUG] Status change activity logged");
        }
          // const emailSettings = await storage.getEmailSettings();
          const newUser = req.body.assigned_to ? await storage.getUser(req.body.assigned_to) : null;
        // Assignment change
        if (req.body.assigned_to && oldTask.assigned_to !== req.body.assigned_to) {
          const oldUser = oldTask.assigned_to ? await storage.getUser(oldTask.assigned_to) : null;
          
        
          console.log("Email settings:", emailSettings);
          console.log("New user:", newUser);

  if (emailSettings && newUser?.email) {
    new EmailService(emailSettings).sendNotification({
      event: "sendOnTaskUpdate",
      to: newUser.email,
      subject: `Task Assigned: ${task.title}`,
      html: `<p>The task <b>${task.title}</b> is now assigned to you.</p>`
    });
  }

          await storage.logTaskActivity({
            task_id: task.id,
            action_type: "assignment_changed",
            old_value: oldUser?.user_name || "Unassigned",
            new_value: newUser?.user_name || "Unassigned",
            acted_by: userId,
          });
            await storage.logActivity({
  source_table: "tasks",
  event_type: "ASSIGNMENT_CHANGED",
  record_id: task.id,
  summary: {
            title:task.title,
            task_id: task.id,
            action_type: "assignment_changed",
            old_value: oldUser?.user_name || "Unassigned",
            new_value: newUser?.user_name || "Unassigned",
            acted_by: userId,
  },
  performed_by: userId,
});

          
        }
        
        // Priority change
        if (req.body.priority !== undefined && oldTask.priority !== req.body.priority) {
          const priorityNames = { 1: "Low", 2: "Medium", 3: "High", 4: "Critical" };
          await storage.logTaskActivity({
            task_id: task.id,
            action_type: "priority_changed",
            old_value: priorityNames[oldTask.priority as keyof typeof priorityNames] || `${oldTask.priority}`,
            new_value: priorityNames[req.body.priority as keyof typeof priorityNames] || `${req.body.priority}`,
            acted_by: userId,
          });
            await storage.logActivity({
        source_table: "tasks",
        event_type: "PRIORITY_CHANGED",
  record_id: task.id,
  summary: {
     task_id: task.id,  
     
            action_type: "priority_changed",
            old_value: priorityNames[oldTask.priority as keyof typeof priorityNames] || `${oldTask.priority}`,
            new_value: priorityNames[req.body.priority as keyof typeof priorityNames] || `${req.body.priority}`,
            acted_by: userId}});

        }
        
        // Due date change
      // 🔹 Due date change (normalized and accurate)
if (req.body.due_date) {
  const oldDate = oldTask.due_date ? new Date(oldTask.due_date) : null;
  const newDate = new Date(req.body.due_date);

  const normalize = (d: Date | null) => (d ? d.toISOString().split("T")[0] : null);

  const oldDateStr = normalize(oldDate);
  const newDateStr = normalize(newDate);

const assignedUser = task.assigned_to
  ? await storage.getUser(task.assigned_to)
  : null;

  // ✅ Only log if the normalized date values differ
  if (oldDateStr !== newDateStr) {
     if (emailSettings && assignedUser?.email) {
    await new EmailService(emailSettings).sendNotification({
      event: "sendOnTaskUpdate",
      to: assignedUser.email,
      subject: `Due Date Updated: ${task.title}`,
      html: `<p>The due date for task <b>${task.title}</b> has been updated to ${new Date(newDateStr).toLocaleDateString()}.</p>`
    });
  }
    await storage.logTaskActivity({
      task_id: task.id,
      action_type: "due_date_changed",
      old_value: oldDateStr
        ? new Date(oldDateStr).toLocaleDateString()
        : "No due date",
      new_value: new Date(newDateStr).toLocaleDateString(),
      acted_by: userId,
    });
  }
}

        
        // Title change
        if (req.body.title && oldTask.title !== req.body.title) {
          await storage.logTaskActivity({
            task_id: task.id,
            action_type: "title_changed",
            old_value: oldTask.title,
            new_value: req.body.title,
            acted_by: userId,
          });
          await storage.logActivity({
  source_table: "tasks",
  event_type: "TITLE_CHANGED",
  record_id: task.id,
  summary: {
    title: task.title,
    old_value: oldTask.title,
    new_value: req.body.title,
    assigned_to: task.assigned_to,
    created_at: task.created_at,
  },
  performed_by: userId,
});
        }
        
        // Description change
        if (req.body.description && oldTask.description !== req.body.description) {
          await storage.logTaskActivity({
            task_id: task.id,
            action_type: "description_changed",
            old_value: oldTask.description || "No description",
            new_value: req.body.description,
            acted_by: userId,
          });
        }
      }
      
      res.json(task);
    } catch (error) {
      console.error("[ERROR] Task update failed:", error);
      if (error instanceof Error) {
        console.error("[ERROR] Error message:", error.message);
      }
      res.status(500).json({ 
        error: "Failed to update task", 
        details: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

app.delete("/api/tasks/:id", requireAnyAuthenticated, async (req, res) => {
  try {
    // 1. Get the ID from the request parameters (the correct variable)
    const taskId = req.params.id; // <-- Define taskId here for clarity and safety
    
    // 2. You were trying to use req.params.id here, but without defining a variable
    const task = await storage.getTask(taskId); 
    const userId = req.headers['x-user-id'] as string;
    const user = await storage.getUser(userId);
    
    if (task) {
      await storage.logTaskActivity({
        message:"Task deleted",
        task_id: task.id,
        action_type: "deleted",

        old_value: null,
        new_value: `Task "${task.title}" was deleted`,
        acted_by: userId,
      });

    }

    // 3. The fix: Use the ID from the request parameters
    await storage.deleteTask(taskId);
    await storage.logActivity({
  source_table: "tasks",
  event_type: "DELETE",
  record_id: taskId,
  summary: {
    title: task.title,
     
        action_type: "deleted",
       
        // new_value: `Task "${task.title}" was deleted`,
        acted_by: user?.email,


  },
  performed_by: userId
});

    
    console.log("✅ Task deleted successfully!");
    res.status(204).send();
  } catch (error: any) { // Add ': any' for better type safety in catch
    console.error("❌ Failed to delete task:", error);
    res.status(500).json({
      error: "Failed to delete task",
      details: error.message,
    });
  }
});

  // Task activity routes
  app.get("/api/tasks/:id/activity", async (req, res) => {
    try {
      const activity = await storage.getTaskActivity(req.params.id);
      
      res.json(activity);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch task activity" });
    }
  });

  // Accept activity posts from clients and persist via storage.logTaskActivity
  app.post("/api/tasks/:id/activity", requireAnyAuthenticated, async (req, res) => {
    try {
      const taskId = req.params.id;
      const { action_type, old_value, new_value, acted_by } = req.body;

      if (!action_type) {
        return res.status(400).json({ error: "action_type is required" });
      }

      const logEntry = {
        task_id: taskId,
        action_type,
        old_value: old_value ?? null,
        new_value: new_value ?? null,
        acted_by: acted_by ?? req.headers['x-user-id'] ?? null,
      };
      

      const saved = await storage.logTaskActivity(logEntry as any);
      res.status(201).json(saved);
    } catch (error: any) {
      console.error('Failed to create task activity:', error);
      res.status(500).json({ error: 'Failed to create task activity', details: error.message });
    }
  });

  // Timer routes
  app.get("/api/users/:userId/active-timers", requireAnyAuthenticated, async (req, res) => {
    try {
      const activeTasks = await storage.getActiveTimerTasks(req.params.userId);
      res.json(activeTasks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch active timers" });
    }
  });

  app.post("/api/tasks/:id/timer/start", requireAnyAuthenticated, async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] as string;
      const task = await storage.startTaskTimer(req.params.id, userId);
      
      // Log timer start activity

      
      res.json(task);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to start timer" });
    }
  });

  app.post("/api/tasks/:id/timer/pause", requireAnyAuthenticated, async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] as string;
      const task = await storage.pauseTaskTimer(req.params.id, userId);
      
      // Log timer pause activity
   
      
      res.json(task);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to pause timer" });
    }
  });

  app.post("/api/tasks/:id/timer/stop", requireAnyAuthenticated, async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] as string;
      const task = await storage.stopTaskTimer(req.params.id, userId);
      
      // Log timer stop activity
   
      res.json(task);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to stop timer" });
    }
  });
  // --- TASK-SPECIFIC TODOS ---

// Get todos for a specific task
app.get("/api/tasks/:id/todos", requireAnyAuthenticated, async (req, res) => {
  try {
    const todos = await storage.getTaskTodos(req.params.id);
    res.json(todos);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch task todos" });
  }
});

// Toggle a todo (Checked/Unchecked)
app.patch("/api/task-todos/:id/toggle", requireAnyAuthenticated, async (req, res) => {
  try {
    const { is_completed } = req.body;
    const todo = await storage.updateTaskTodoStatus(req.params.id, is_completed);
    
    // Optional: Log activity on the parent task
    await storage.logTaskActivity({
      task_id: todo.task_id,
      action_type: "todo_toggled",
      old_value: (!is_completed).toString(),
      new_value: is_completed.toString(),
      acted_by: req.headers['x-user-id'] as string,
    });

    res.json(todo);
  } catch (error) {
    res.status(400).json({ error: "Failed to update todo status" });
  }
});
  // --- GLOBAL TODO DEFINITIONS (ADMIN) ---

// Get all master todos
app.get("/api/global-todos", requireAnyAuthenticated, async (req, res) => {
  try {
    const todos = await storage.getAllGlobalTodoDefinitions();
    res.json(todos);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch global todos" });
  }
});

// Create a new master todo
app.post("/api/global-todos", requireAdmin, async (req, res) => {
  try {
    const todo = await storage.createGlobalTodoDefinition(req.body);
    
    await storage.logActivity({
      source_table: "global_todo_definitions",
      event_type: "CREATE",
      record_id: todo.id,
      summary: { title: todo.title },
      performed_by: req.headers['x-user-id'] as string,
    });

    res.status(201).json(todo);
  } catch (error) {
    res.status(400).json({ error: "Failed to create global todo" });
  }
});

// Update or Deactivate a master todo
app.patch("/api/global-todos/:id", requireAdmin, async (req, res) => {
  try {
    const todo = await storage.updateGlobalTodoDefinition(req.params.id, req.body);
    res.json(todo);
  } catch (error) {
    res.status(400).json({ error: "Failed to update global todo" });
  }
});

  // Team management routes - Manager/Admin only
  app.get("/api/teams",  async (req, res) => {
    try {
      const teams = await storage.getAllTeams();
      res.json(teams);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch teams" });
    }
  });

  app.get("/api/teams/:id", async (req, res) => {
    try {
      const team = await storage.getTeam(req.params.id);
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }
      res.json(team);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch team" });
    }
  });

  app.post("/api/teams", requireManagerOrAdmin, async (req, res) => {
    try {
      // Derive the creator from the authenticated header rather than trusting the client
      const userId = req.headers['x-user-id'] as string;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required teams" });
      }

      // Build payload with authoritative created_by and validate
      const payload = { ...req.body, created_by: userId };
      const teamData = insertTeamSchema.parse(payload);
      const team = await storage.createTeam(teamData);
      console.debug("Team created by:", userId, "payload:", payload);
      await storage.logActivity({
  source_table: "teams",
  event_type: "CREATE",
  record_id: team.id,
  summary: { name: team.name },
  performed_by: userId,
});

      res.status(201).json(team);
    } catch (error) {
      console.error("Team creation error:", error);
      // If this is a Zod validation error, forward details to help debugging
      if ((error as any)?.errors) {
        return res.status(400).json({ error: "Invalid team data", details: (error as any).errors });
      }
      res.status(400).json({ error: "Invalid team data" });
    }
  });



  app.patch("/api/teams/:id", requireManagerOrAdmin, async (req, res) => {
    try {
      const team = await storage.updateTeam(req.params.id, req.body);
      res.json(team);
    } catch (error) {
      res.status(500).json({ error: "Failed to update team" });
    }
  });

app.delete("/api/teams/:id", requireManagerOrAdmin, async (req, res) => {
  try {
    const team = await storage.getTeam(req.params.id); // Fetch team details BEFORE deletion
    
    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }
    
    await storage.deleteTeam(req.params.id);
    
    // fire-and-forget logging
    storage.logActivity({
      source_table: "teams",
      event_type: "DELETE_TEAM",
      record_id: req.params.id,
      summary: { name: team.name,
        message: "Team deleted" },
      performed_by: Array.isArray(req.headers["x-user-id"])
        ? req.headers["x-user-id"][0]
        : req.headers["x-user-id"] ?? null,
    }).catch(err => {
      console.error("Activity log failed:", err);
    });

    return res.status(204).send();
  } catch (error) {
    console.error("Delete team error:", error);
    return res.status(500).json({ error: "Failed to delete team" });
  }
});


  // Team membership routes
 app.get("/api/teams/:id/members", async (req, res) => {
  try {
    const { role } = req.query; // e.g., ?role=manager or ?role=member
    const members = await storage.getTeamMembers(req.params.id, role as string);
    res.json(members);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch team members" });
  }
});

app.post("/api/teams/:teamId/members", async (req, res) => {
  try {
    const { userId, role } = req.body;
    const teamId = req.params.teamId;

    // Fetch readable info
    const team = await storage.getTeam(teamId);
    const user = await storage.getUser(userId);
    
    const membership = await storage.addTeamMember(teamId, userId, role);

    await storage.logActivity({
      source_table: "team_members",
      event_type: "ADD_MEMBER",
      record_id: teamId,
      summary: {
        // teamId,
        team_name: team?.name,
        added_user_name: user?.user_name,
        role_assigned: role,
        message: `${user?.user_name} was added to team ${team?.name} as ${role}`
      },
      performed_by: Array.isArray(req.headers["x-user-id"])
        ? req.headers["x-user-id"][0]
        : req.headers["x-user-id"] ?? null,
    });

    res.status(201).json(membership);
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: "Failed to add team member" });
  }
});


 app.delete("/api/teams/:teamId/members/:userId", async (req, res) => {
  const teamId = req.params.teamId;
  const userId = req.params.userId;

  // helper to read performed_by header consistently
  const getPerformingUserId = () =>
    Array.isArray(req.headers["x-user-id"])
      ? req.headers["x-user-id"][0]
      : req.headers["x-user-id"] ?? null;

  try {
    // Fetch readable data BEFORE removing the membership (so we can log it)
    const [team, removedUser, performingUser] = await Promise.all([
      storage.getTeam(teamId),              // { id, name, ... }
      storage.getUser(userId),              // { id, user_name, email, ... }
      getPerformingUserId()                 // id string or null
        ? storage.getUser(getPerformingUserId() as string)
        : Promise.resolve(null),
    ]);

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }
    if (!removedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Optionally: if you store a team-member record, fetch it to log the assigned role
    const membership = await storage.getTeamMembers(teamId, userId); // may return null

    // Remove member
    await storage.removeTeamMember(teamId, userId);

    // Build a friendly, useful summary for UI
    const summary = {
      teamId: team.id,
      team_name: team.name,
      // removed_user_id: removedUser.id,
      removed_user_name: removedUser.user_name,
      removed_user_email: removedUser.email,
      role_assigned: membership?.role ?? null,
      message: `${removedUser.user_name} (${removedUser.email}) was removed from team "${team.name}"${membership?.role ? ` (role: ${membership.role})` : ""}`
    };

    await storage.logActivity({
      source_table: "team_members",
      event_type: "REMOVE_MEMBER",
      record_id: teamId,
      summary,
      performed_by: getPerformingUserId(),
    });

    return res.status(204).send();
  } catch (error) {
    console.error("Failed to remove team member:", error);
    return res.status(500).json({ error: "Failed to remove team member" });
  }
});


  // Role management routes - Admin only for modifications, authenticated for read
  app.get("/api/roles", requireAnyAuthenticated, async (req, res) => {
    try {
      const roles = await storage.getAllRoles();
      res.json(roles);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch roles" });
    }
  });

  app.post("/api/roles", requireAdmin, async (req, res) => {
    try {
      const roleData = insertRoleSchema.parse(req.body);
      const role = await storage.createRole(roleData);
      res.status(201).json(role);
    } catch (error) {
      res.status(400).json({ error: "Invalid role data" });
    }
  });

  app.put("/api/roles/:id", requireAdmin, async (req, res) => {
    try {
      const role = await storage.updateRole(req.params.id, req.body);
      res.json(role);
    } catch (error) {
      res.status(500).json({ error: "Failed to update role" });
    }
  });

  app.delete("/api/roles/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteRole(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete role" });
    }
  });

  // Get all user-role relationships
  app.get("/api/user-roles", async (req, res) => {
    try {
      const allUserRoles = await db.select().from(userRoles);
      res.json(allUserRoles);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user roles" });
    }
  });

  app.get("/api/users/:id/roles", async (req, res) => {
    try {
      const userRoles = await storage.getUserRoles(req.params.id);
      res.json(userRoles);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user roles" });
    }
  });
app.post("/api/users/:userId/roles", requireAdmin, async (req, res) => {
  try {
    const actingUserId = Array.isArray(req.headers["x-user-id"])
      ? req.headers["x-user-id"][0]
      : req.headers["x-user-id"] ?? null;

    const { roleId } = req.body;
    const userId = req.params.userId;

    // Get roles BEFORE update
    const beforeRoles = await storage.getUserRoles(userId);
    const beforeRoleNames = beforeRoles.map(r => r.role?.name);

    // Assign the new role
    const userRole = await storage.assignUserRole(userId, roleId);

    // Get roles AFTER update
    const afterRoles = await storage.getUserRoles(userId);
    const afterRoleNames = afterRoles.map(r => r.role?.name);

    // Get user email only
    const user = await storage.getUser(userId);
    const userName = user?.user_name || "Unknown User";

    // Log activity
    await storage.logActivity({
      source_table: "user_roles",
      event_type: "ROLE_CHANGED",
      record_id: userId,
      performed_by: actingUserId,
      summary: {
        user_name: userName,
        // user_email: userEmail,
        roles_before: beforeRoleNames,
        roles_after: afterRoleNames,
        added_role: afterRoleNames.filter(r => !beforeRoleNames.includes(r))[0] || null
      },
    });

    res.status(201).json(userRole);

  } catch (error) {
    console.error(error);
    res.status(400).json({ error: "Failed to assign role" });
  }
});




  // app.post("/api/users/:userId/roles", requireAdmin, async (req, res) => {
  //   try {
  //     const { roleId } = req.body;
  //     const userRole = await storage.assignUserRole(req.params.userId, roleId);
  //     res.status(201).json(userRole);
  //   } catch (error) {
  //     res.status(400).json({ error: "Failed to assign role" });
  //   }
  // });

app.delete("/api/users/:userId/roles/:roleId", requireAdmin, async (req, res) => {
  try {
    const actingUserId = Array.isArray(req.headers["x-user-id"])
  ? req.headers["x-user-id"][0]
  : req.headers["x-user-id"] ?? null;


    await storage.removeUserRole(req.params.userId, req.params.roleId);

    // 🔥 Log role removal
    await storage.logActivity({
      source_table: "user_roles",
      event_type: "ROLE_REMOVED",
      record_id: req.params.userId,
      summary: { role_removed: req.params.roleId },
      performed_by: actingUserId,
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to remove role" });
  }
});


  // Task group routes
  app.get("/api/task-groups", requireAnyAuthenticated, async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] as string;
      const groups = await storage.getTaskGroupsForUser(userId);
      res.json(groups);
    } catch (error) {
      console.error('Error fetching task groups:', error);
      res.status(500).json({ error: "Failed to fetch task groups" });
    }
  });

  app.post("/api/task-groups", requireManagerOrAdmin, async (req, res) => {
    try {
      const groupData = insertTaskGroupSchema.parse(req.body);
      const group = await storage.createTaskGroup(groupData);
      res.status(201).json(group);
    } catch (error) {
      res.status(400).json({ error: "Invalid task group data" });
    }
  });

  app.delete("/api/task-groups/:id", requireManagerOrAdmin, async (req, res) => {
    try {
      await storage.deleteTaskGroup(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete task group" });
    }
  });

  app.get("/api/task-groups/:id/details", async (req, res) => {
    try {
      const details = await storage.getTaskGroupDetails(req.params.id);
      res.json(details);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch task group details" });
    }
  });

  app.get("/api/task-groups/:id/members", async (req, res) => {
    try {
      const members = await storage.getTaskGroupMembers(req.params.id);
      res.json(members);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch task group members" });
    }
  });

  app.post("/api/task-groups/:id/members",  async (req, res) => {
    try {
      const { userId, role } = req.body;
      const member = await storage.addTaskGroupMember(req.params.id, userId, role);
      // After const member = await storage.addTaskGroupMember(...)
const emailSettings = await storage.getEmailSettings();
const addedUser = await storage.getUser(userId);
if (emailSettings && addedUser?.email) {
  new EmailService(emailSettings).sendNotification({
    event: "sendOnGroupAddition",
    to: addedUser.email,
    subject: `Added to Group`,
    html: `<p>You have been added to a new task group.</p>`
  });
}
      res.status(201).json(member);
    } catch (error) {
      res.status(400).json({ error: "Failed to add task group member" });
    }
  });

  app.delete("/api/task-groups/:id/members/:userId", requireManagerOrAdmin, async (req, res) => {
    try {
      await storage.removeTaskGroupMember(req.params.id, req.params.userId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to remove task group member" });
    }
  });

  // Task-group assignment endpoints
  app.post("/api/task-groups/:groupId/tasks", requireAnyAuthenticated, async (req, res) => {
    try {
      const { taskId } = req.body;
      const { groupId } = req.params;
      
      await storage.assignTaskToGroup(groupId, taskId);
      res.status(201).json({ success: true, message: "Task assigned to group" });
    } catch (error) {
      console.error('Error assigning task to group:', error);
      res.status(500).json({ error: "Failed to assign task to group" });
    }
  });

  app.delete("/api/task-groups/:groupId/tasks/:taskId", requireAnyAuthenticated, async (req, res) => {
    try {
      const { groupId, taskId } = req.params;
      
      await storage.removeTaskFromGroup(groupId, taskId);
      res.status(204).send();
    } catch (error) {
      console.error('Error removing task from group:', error);
      res.status(500).json({ error: "Failed to remove task from group" });
    }
  });

  // Task status routes - Read open, modify admin only
  app.get("/api/task-statuses", requireAnyAuthenticated, async (req, res) => {
    try {
      const statuses = await storage.getAllTaskStatuses();
      res.json(statuses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch task statuses" });
    }
  });

  // Get default task status
  app.get("/api/task-statuses/default", async (req, res) => {
    try {
      const defaultStatus = await storage.getDefaultTaskStatus();
      res.json(defaultStatus);
    } catch (error) {
      console.error("Error fetching default task status:", error);
      res.status(500).json({ error: "Failed to fetch default task status" });
    }
  });

  // User tasks by assignment
  app.get("/api/users/:id/tasks", async (req, res) => {
    try {
      const tasks = await storage.getTasksByUser(req.params.id);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user tasks" });
      console.error(" sakshi Error fetching user tasks:", error);
    }
  });

  // Team tasks
  app.get("/api/teams/:id/tasks", async (req, res) => {
    try {
      const tasks = await storage.getTasksByTeam(req.params.id);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch team tasks" });
    }
  });

  // Task Group member management routes
  app.post("/api/task-groups/:id/members", requireAnyAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { userId, role = 'member' } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }
      
      const member = await storage.addTaskGroupMember(id, userId, role);
      res.status(201).json(member);
    } catch (error) {
      console.error("Failed to add task group member:", error);
      res.status(500).json({ error: "Failed to add task group member" });
    }
  });

  app.delete("/api/task-groups/:id/members/:userId", requireAnyAuthenticated, async (req, res) => {
    try {
      const { id, userId } = req.params;
      await storage.removeTaskGroupMember(id, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to remove task group member:", error);
      res.status(500).json({ error: "Failed to remove task group member" });
    }
  });

  // Task Group task assignment routes
  app.post("/api/task-groups/:id/tasks", requireAnyAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { taskId } = req.body;
      
      if (!taskId) {
        return res.status(400).json({ error: "taskId is required" });
      }
      
      // Note: This endpoint would need to be implemented in storage
      // For now, we'll just return success as task-group relationships 
      // are managed through the existing task creation/assignment process
      res.json({ success: true, message: "Task assigned to group" });
    } catch (error) {
      console.error("Failed to add task to group:", error);
      res.status(500).json({ error: "Failed to add task to group" });
    }
  });

  // Role permissions
  app.get("/api/roles/:roleId/permissions", async (req, res) => {
    try {
      const { roleId } = req.params;
      const permissions = await storage.getRolePermissions(roleId);
      res.json(permissions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch role permissions" });
    }
  });

  app.post("/api/role-permissions", requireAdmin, async (req, res) => {
    try {
      const permission = await storage.createRolePermission(req.body);
      res.json(permission);
    } catch (error) {
      res.status(500).json({ error: "Failed to create role permission" });
    }
  });

  app.patch("/api/role-permissions/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const permission = await storage.updateRolePermission(id, req.body);
      res.json(permission);
    } catch (error) {
      res.status(500).json({ error: "Failed to update role permission" });
    }
  });

  app.delete("/api/role-permissions/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteRolePermission(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete role permission" });
    }
  });

  app.patch("/api/roles/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const role = await storage.updateRole(id, req.body);
      res.json(role);
    } catch (error) {
      res.status(500).json({ error: "Failed to update role" });
    }
  });
app.get("/api/email-settings", async (req, res) => {
  try {
    const settings = await storage.getEmailSettings();
    // Return null if not found so the frontend knows it's a 'Create' mode
    res.json(settings ?? null);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to fetch email settings" });
  }
});

// 2. POST: Create new settings
app.post("/api/email-settings", async (req, res) => {
  try {
    // Validate request body against Zod schema
    const data = insertEmailSettingsSchema.parse(req.body);
    const settings = await storage.createEmailSettings(data);
    res.status(201).json(settings);
  } catch (error: any) {
    console.error("Create Error:", error);
    res.status(400).json({ message: error.message || "Validation failed" });
  }
});

// 3. PUT: Update existing settings
app.put("/api/email-settings/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

    const settings = await storage.updateEmailSettings(id, req.body);
    res.json(settings);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// 4. DELETE: Remove settings
app.delete("/api/email-settings/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await storage.deleteEmailSettings(id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// 5. POST: Test connection and send test email
app.post("/api/email-settings/test", async (req, res) => {
  try {
    const { verificationTestEmail, ...config } = req.body;

    if (!verificationTestEmail) {
      return res.status(400).json({ message: "Test email address is required" });
    }

    // Initialize service with the values currently in the form
    const emailService = new EmailService(config);

    // Step A: Verify connection
    const isConnected = await emailService.testConnection();
    if (!isConnected) {
      return res.status(400).json({ message: "SMTP Connection failed. Check your host/port/credentials." });
    }

    // Step B: Send the test email
    const isSent = await emailService.sendTestEmail(verificationTestEmail);
    if (!isSent) {
      return res.status(400).json({ message: "Connection succeeded, but failed to send the test email." });
    }

    // Step C: If these settings exist in DB, mark them as verified
    const currentSettings = await storage.getEmailSettings();
    if (currentSettings?.id) {
      await storage.markEmailSettingsAsVerified(currentSettings.id);
    }

    res.json({ success: true, message: "Verification email sent!" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});
  // Task status management routes - Admin only
  app.post("/api/task-statuses", requireAdmin, async (req, res) => {
    try {
      const { name, description, color, sequence_order } = req.body;
      if (!name || typeof sequence_order !== 'number') {
        return res.status(400).json({ error: "Name and sequence_order are required" });
      }
      
      const status = await storage.createTaskStatus({
        name,
        description,
        color: color || "#6b7280",
        sequence_order
      });
      res.status(201).json(status);
    } catch (error) {
      console.error("Failed to create task status:", error);
      res.status(500).json({ error: "Failed to create task status" });
    }
  });

  app.patch("/api/task-statuses/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const status = await storage.updateTaskStatus(id, req.body);
      res.json(status);
    } catch (error) {
      console.error("Failed to update task status:", error);
      res.status(500).json({ error: "Failed to update task status" });
    }
  });

  app.delete("/api/task-statuses/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteTaskStatus(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete task status:", error);
      res.status(500).json({ error: "Failed to delete task status" });
    }
  });

  app.get("/api/task-statuses/:id/deletion-preview", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      console.log("Getting deletion preview for status ID:", id);
      const preview = await storage.getStatusDeletionPreview(id);
      console.log("Deletion preview result:", preview);
      res.json(preview);
    } catch (error) {
      console.error("Failed to get status deletion preview:", error);
      console.error("Error details:", error.message, error.stack);
      res.status(500).json({ error: "Failed to get status deletion preview", details: error.message });
    }
  });

  app.post("/api/task-statuses/:id/delete-with-handling", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { action, newStatusName } = req.body;
      
      if (!action || !['delete_tasks', 'reassign_tasks'].includes(action)) {
        return res.status(400).json({ error: "Invalid action. Must be 'delete_tasks' or 'reassign_tasks'" });
      }

      if (action === 'reassign_tasks' && !newStatusName) {
        return res.status(400).json({ error: "newStatusName is required when action is 'reassign_tasks'" });
      }

      const result = await storage.deleteStatusWithTaskHandling(id, action, newStatusName);
      res.json(result);
    } catch (error) {
      console.error("Failed to delete status with task handling:", error);
      res.status(500).json({ error: "Failed to delete status with task handling" });
    }
  });

  // Task status transition endpoints
  app.get("/api/task-status-transitions", requireAnyAuthenticated, async (req, res) => {
    try {
      const transitions = await storage.getAllTaskStatusTransitions();
      res.json(transitions);
    } catch (error) {
      console.error("Failed to get task status transitions:", error);
      res.status(500).json({ error: "Failed to get task status transitions" });
    }
  });

  app.post("/api/task-status-transitions", requireAdmin, async (req, res) => {
    try {
      const { from_status, to_status } = req.body;
      if (!from_status || !to_status) {
        return res.status(400).json({ error: "from_status and to_status are required" });
      }
      
      const transition = await storage.createTaskStatusTransition({
        from_status,
        to_status
      });
      res.status(201).json(transition);
    } catch (error) {
      console.error("Failed to create task status transition:", error);
      res.status(500).json({ error: "Failed to create task status transition" });
    }
  });

  app.delete("/api/task-status-transitions/:id",  async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteTaskStatusTransition(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete task status transition:", error);
      res.status(500).json({ error: "Failed to delete task status transition" });
    }
  });

  // Organization settings routes - Managers can read, Admin can modify
  app.get("/api/organization-settings",  async (req, res) => {
    console.log('organization-settings GET endpoint hit');
    try {
      const settings = await storage.getOrganizationSettings();
      res.json(settings);
    } catch (error) {
      console.error("Failed to fetch organization settings:", error);
      res.status(500).json({ error: "Failed to fetch organization settings" });
    }
  });

  app.post("/api/organization-settings", requireAdmin, async (req, res) => {
    try {
      console.log("Creating organization settings with data:", req.body);
      
      // Validate the request body
      const { insertOrganizationSettingsSchema } = await import("../shared/schema");
      const validatedData = insertOrganizationSettingsSchema.parse(req.body);
      console.log("Validated data:", validatedData);
      
      const settings = await storage.createOrganizationSettings(validatedData);
      res.status(201).json(settings);
    } catch (error) {
      console.error("Failed to create organization settings:", error);
      console.error("Request body:", req.body);
      if (error.name === 'ZodError') {
        res.status(400).json({ error: "Validation error", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create organization settings", details: error.message });
      }
    }
  });

  app.patch("/api/organization-settings/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      console.log("Updating organization settings with ID:", id, "and data:", req.body);
      const oldSettings = await storage.getOrganizationSettings();
      console.log("Current organization settings before update:", oldSettings);
      // Validate the request body (partial update)
      const { insertOrganizationSettingsSchema } = await import("../shared/schema");
      const validatedData = insertOrganizationSettingsSchema.partial().parse(req.body);
      console.log("Validated data:", validatedData);
      if (validatedData.user_2fa_required === true) {
      console.log("Global 2FA enabled: Updating all users...");
      await storage.updateAllUser2FAStatus(true);
    }
    else{
       await storage.updateAllUser2FAStatus(false);

    }
      
      const settings = await storage.updateOrganizationSettings(id, validatedData);
      res.json(settings);
    } catch (error) {
      console.error("Failed to update organization settings:", error);
      console.error("Request body:", req.body);
      if (error.name === 'ZodError') {
        res.status(400).json({ error: "Validation error", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update organization settings", details: error.message });
      }
    }
  });

  // Office location routes
  app.get("/api/office-locations", requireManagerOrAdmin, async (req, res) => {
    try {
      const locations = await storage.getAllOfficeLocations();
      res.json(locations);
    } catch (error) {
      console.error("Failed to fetch office locations:", error);
      res.status(500).json({ error: "Failed to fetch office locations" });
    }
  });

  app.get("/api/office-locations/:id", requireManagerOrAdmin, async (req, res) => {
    try {
      const location = await storage.getOfficeLocation(req.params.id);
      if (!location) {
        return res.status(404).json({ error: "Office location not found" });
      }
      res.json(location);
    } catch (error) {
      console.error("Failed to fetch office location:", error);
      res.status(500).json({ error: "Failed to fetch office location" });
    }
  });

  app.post("/api/office-locations", requireManagerOrAdmin, async (req, res) => {
    try {
      console.log("Office location creation request body:", req.body);
      const locationData = insertOfficeLocationSchema.parse(req.body);
      console.log("Parsed location data:", locationData);
      const location = await storage.createOfficeLocation(locationData);
      res.status(201).json(location);
    } catch (error) {
      console.error("Failed to create office location:", error);
      if (error.name === 'ZodError') {
        console.error("Validation errors:", error.errors);
        res.status(400).json({ error: "Validation error", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create office location" });
      }
    }
  });

  app.patch("/api/office-locations/:id", requireManagerOrAdmin, async (req, res) => {
    try {
      const location = await storage.updateOfficeLocation(req.params.id, req.body);
      res.json(location);
    } catch (error) {
      console.error("Failed to update office location:", error);
      res.status(500).json({ error: "Failed to update office location" });
    }
  });

  app.delete("/api/office-locations/:id", requireManagerOrAdmin, async (req, res) => {
    try {
      await storage.deleteOfficeLocation(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete office location:", error);
      res.status(500).json({ error: "Failed to delete office location" });
    }
  });

  // Department management routes - Admin only
  app.get("/api/departments", requireAnyAuthenticated, async (req, res) => {
    try {
      const departments = await storage.getAllDepartments();
      res.json(departments);
    } catch (error) {
      console.error('Error fetching departments:', error);
      res.status(500).json({ error: "Failed to fetch departments" });
    }
  });

  app.post("/api/departments", requireAdmin, async (req, res) => {
    try {
      const { name, description } = req.body;
      
      if (!name || !name.trim()) {
        return res.status(400).json({ error: "Department name is required" });
      }

      const department = await storage.createDepartment({
        name: name.trim(),
        description: description || null
      });
      
      res.status(201).json(department);
    } catch (error) {
      console.error('Error creating department:', error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create department" });
    }
  });

  app.patch("/api/departments/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      if (name && !name.trim()) {
        return res.status(400).json({ error: "Department name cannot be empty" });
      }

      const department = await storage.updateDepartment(id, {
        name: name ? name.trim() : undefined,
        description: description !== undefined ? description : undefined
      });

      res.json(department);
    } catch (error) {
      console.error('Error updating department:', error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to update department" });
    }
  });

  app.delete("/api/departments/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteDepartment(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting department:', error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to delete department" });
    }
  });

  // License Management Routes (Admin only)
  app.get("/api/license/status", requireAdmin, async (req, res) => {
    try {
      console.log("License status endpoint hit");
      
      // First try to find any license in the database since we don't have client ID in headers
      const allLicenses = await storage.getAllLicenses();
      console.log("Found licenses:", allLicenses.length);
      
      if (allLicenses.length > 0) {
        const activeLicense = allLicenses.find(l => l.isActive) || allLicenses[0];
        const status = await licenseManager.getLicenseStatus(activeLicense.clientId);
        console.log("License status result:", status);
        res.json(status);
      } else {
        console.log("No licenses found in database");
        res.json({
          hasLicense: false,
          isValid: false,
          message: 'No license found'
        });
      }
    } catch (error) {
      console.error("Failed to get license status:", error);
      res.status(500).json({ 
        error: "Failed to get license status", 
        details: error.message,
        stack: error.stack 
      });
    }
  });

  // Get license info with current user count for user management
  app.get("/api/license/user-limits", requireAdmin, async (req, res) => {
    try {
      console.log("License user limits endpoint hit");
      
      // Get current active user count
      const allUsers = await storage.getAllUsers();
      const activeUserCount = allUsers.filter(user => user.is_active !== false).length;
      
      // Get license status
      const allLicenses = await storage.getAllLicenses();
      
      if (allLicenses.length > 0) {
        const activeLicense = allLicenses.find(l => l.isActive) || allLicenses[0];
        const licenseStatus = await licenseManager.getLicenseStatus(activeLicense.clientId);
        
        res.json({
          hasLicense: licenseStatus.hasLicense,
          isValid: licenseStatus.isValid,
          currentUsers: activeUserCount,
          userLimits: licenseStatus.userLimits,
          subscriptionType: licenseStatus.subscriptionType,
          expiresAt: licenseStatus.expiresAt,
          message: licenseStatus.message
        });
      } else {
        res.json({
          hasLicense: false,
          isValid: false,
          currentUsers: activeUserCount,
          userLimits: null,
          subscriptionType: null,
          expiresAt: null,
          message: 'No license found'
        });
      }
    } catch (error) {
      console.error('License user limits error:', error);
      res.status(500).json({ error: "Failed to get license user limits" });
    }
  });

  app.post("/api/license/acquire", requireAdmin, async (req, res) => {
    try {
      const { clientId, appId, baseUrl, licenseManagerUrl } = req.body;
      
      if (!clientId || !appId || !baseUrl) {
        return res.status(400).json({ error: "clientId, appId, and baseUrl are required" });
      }

      if (licenseManagerUrl) {
        licenseManager.setLicenseManagerUrl(licenseManagerUrl);
      }

      const result = await licenseManager.acquireLicense(clientId, baseUrl, appId);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error("Failed to acquire license:", error);
      res.status(500).json({ error: "Failed to acquire license" });
    }
  });

  app.post("/api/license/validate", requireAdmin, async (req, res) => {
    try {
      const { licenseManagerUrl } = req.body;
      
      if (!licenseManagerUrl) {
        return res.status(400).json({ error: "licenseManagerUrl is required" });
      }

      // Set the license manager URL
      licenseManager.setLicenseManagerUrl(licenseManagerUrl);

      // Get the client ID from the current user's license in database
      const userId = req.headers['x-user-id'] as string;
      if (!userId) {
        return res.status(401).json({ error: 'User ID required' });
      }

      // Get the first license from database (assuming one license per installation)
      const licenses = await storage.getAllLicenses();
      const license = licenses[0];
      
      if (!license) {
        return res.status(404).json({ 
          valid: false,
          message: 'No license found in database' 
        });
      }

      // Extract complete domain from request headers (including subdomain for Replit dev URLs)
      const origin = req.headers.origin || req.headers.host || 'localhost';
      const domain = origin.replace(/^https?:\/\//, '').replace(/:\d+$/, '');
      
      // For development, use the actual Replit dev URL instead of baseUrl
      const devDomain = domain.includes('replit.dev') ? domain : 'localhost';

      console.log(`Request headers - Origin: ${req.headers.origin}, Host: ${req.headers.host}`);
      console.log(`Extracted domain: ${domain}`);
      console.log(`Using domain for validation: ${devDomain}`);
      console.log(`Validating license for client: ${license.clientId}, domain: ${devDomain}`);
      
      const result = await licenseManager.validateLicense(license.clientId, devDomain);
      res.json(result);
    } catch (error) {
      console.error("Failed to validate license:", error);
      res.status(500).json({ error: "Failed to validate license" });
    }
  });

  app.get("/api/license/user-limits", requireAdmin, async (req, res) => {
    try {
      const clientId = req.headers['x-client-id'] as string || 'default-client';
      const limits = await licenseManager.getUserLimits(clientId);
      res.json({ limits });
    } catch (error) {
      console.error("Failed to get user limits:", error);
      res.status(500).json({ error: "Failed to get user limits" });
    }
  });

  app.post("/api/license/check-user-limit", requireAdmin, async (req, res) => {
    try {
      const { clientId, currentUserCount } = req.body;
      
      if (!clientId || typeof currentUserCount !== 'number') {
        return res.status(400).json({ error: "clientId and currentUserCount are required" });
      }

      const result = await licenseManager.checkUserLimit(clientId, currentUserCount);
      res.json(result);
    } catch (error) {
      console.error("Failed to check user limit:", error);
      res.status(500).json({ error: "Failed to check user limit" });
    }
  });

  app.get("/api/license/current", requireAdmin, async (req, res) => {
    try {
      const clientId = req.headers['x-client-id'] as string || 'default-client';
      const license = await licenseManager.getCurrentLicense(clientId);
      
      if (!license) {
        return res.status(404).json({ error: "No license found" });
      }

      // Return limited license info (don't expose sensitive data)
      const safeLicense = {
        id: license.id,
        applicationId: license.applicationId,
        clientId: license.clientId,
        subscriptionType: license.subscriptionType,
        validTill: license.validTill,
        isActive: license.isActive,
        lastValidated: license.lastValidated,
        createdAt: license.createdAt,
        updatedAt: license.updatedAt
      };

      res.json(safeLicense);
    } catch (error) {
      console.error("Failed to get current license:", error);
      res.status(500).json({ error: "Failed to get current license" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

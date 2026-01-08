#!/usr/bin/env tsx
/**
 * Seed role permissions
 * Assumes roles already exist in DB
 */

import { storage } from "../server/storage";

// ================================
// PERMISSION CONFIG (EXACT DATASET)
// ================================
const ROLE_PERMISSIONS: Record<
  string,
  { resource: string; permission_level: number }[]
> = {
  admin: [
    { resource: "dashboard", permission_level: 4 },
    { resource: "users", permission_level: 4 },
    { resource: "roles", permission_level: 4 },
    { resource: "roles-privileges", permission_level: 4 },
    { resource: "teams", permission_level: 4 },
    { resource: "team-management", permission_level: 4 },
    { resource: "tasks", permission_level: 4 },
    { resource: "my-tasks", permission_level: 4 },
    { resource: "task-groups", permission_level: 4 },
    { resource: "task-report", permission_level: 4 },
    { resource: "analytics", permission_level: 4 },
    { resource: "analytics-report", permission_level: 4 },
    { resource: "overdue-report", permission_level: 4 },
    { resource: "historical-tasks", permission_level: 4 },
    { resource: "settings", permission_level: 4 },
    { resource: "user-management", permission_level: 4 },
  ],

  manager: [
    { resource: "dashboard", permission_level: 3 },
    { resource: "users", permission_level: 2 },
    { resource: "teams", permission_level: 3 },
    { resource: "team-management", permission_level: 4 },
    { resource: "tasks", permission_level: 4 },
    { resource: "my-tasks", permission_level: 4 },
    { resource: "task-groups", permission_level: 4 },
    { resource: "task-report", permission_level: 4 },
    { resource: "analytics-report", permission_level: 4 },
    { resource: "overdue-report", permission_level: 0 },
    { resource: "historical-tasks", permission_level: 0 },
  ],

  team_manager: [
    { resource: "dashboard", permission_level: 3 },
    { resource: "users", permission_level: 1 },
    { resource: "teams", permission_level: 2 },
    { resource: "tasks", permission_level: 4 },
    { resource: "my-tasks", permission_level: 2 },
    { resource: "task-groups", permission_level: 0 },
    { resource: "task-report", permission_level: 1 },
    { resource: "historical-tasks", permission_level: 0 },
    { resource: "settings", permission_level: 4 },
  ],

  user: [
    { resource: "dashboard", permission_level: 0 },
    { resource: "tasks", permission_level: 1 },
    { resource: "my-tasks", permission_level: 1 },
    { resource: "task-report", permission_level: 1 },
    { resource: "historical-tasks", permission_level: 4 },
    { resource: "analytics-report", permission_level: 4 },
    { resource: "settings", permission_level: 4 },
  ],
};

// ================================
// SEED FUNCTION
// ================================
async function seedRolePermissions() {
  console.log("\n🔐 Seeding role permissions...\n");

  try {
    const roles = await storage.getAllRoles();

    if (!roles.length) {
      console.log("❌ No roles found. Run role seed first.");
      process.exit(1);
    }

    for (const role of roles) {
      const permissions = ROLE_PERMISSIONS[role.name];

      if (!permissions) {
        console.log(`⚠️  No permissions defined for role: ${role.name}`);
        continue;
      }

      console.log(`▶ ${role.name}`);

      for (const perm of permissions) {
        try {
          await storage.createRolePermission({
            role_id: role.id,
            resource: perm.resource,
            permission_level: perm.permission_level,
          });

          console.log(
            `   ✓ ${perm.resource} → Level ${perm.permission_level}`
          );
        } catch {
          console.log(
            `   ⚠️  ${perm.resource} already exists (skipped)`
          );
        }
      }
    }

    console.log("\n🎉 Role permission seeding completed successfully!\n");
  } catch (err) {
    console.error("❌ Permission seeding failed:", err);
    process.exit(1);
  }
}

// ================================
// RUN
// ================================
seedRolePermissions();

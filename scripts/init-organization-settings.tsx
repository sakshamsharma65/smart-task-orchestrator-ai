#!/usr/bin/env tsx
/**
 * Seed organization settings
 * Assumes organization does not already have settings
 */

import { storage } from "../server/storage";

// ================================
// ORGANIZATION SETTINGS DATA
// ================================
const ORGANIZATION_SETTINGS = {
  id: "5246bd81-42d5-4583-b148-bc4270bec533",
  organization_name: "Default Organization",
  date_format: "MM/dd/yyyy",
  time_zone: "Asia/Kolkata",

  daily_hour_limit_enabled: false,
  max_daily_hours_limit: 14,

  benchmarking_enabled: true,

  min_hours_per_day: 1,
  max_hours_per_day: 10,

  min_hours_per_week: 1,
  max_hours_per_week: 23,

  min_hours_per_month: 1,
  max_hours_per_month: 100,

  allow_user_level_override: true,

  created_at: new Date("2025-10-07T13:34:53.715Z"),
  updated_at: new Date("2025-12-16T12:32:14.883Z"),
};

// ================================
// SEED FUNCTION
// ================================
async function seedOrganizationSettings() {
  console.log("\n🏢 Seeding organization settings...\n");

  try {
    const existing = await storage.getOrganizationSettings?.();

    if (existing) {
      console.log("⚠️  Organization settings already exist (skipped)");
      process.exit(0);
    }

    await storage.createOrganizationSettings(ORGANIZATION_SETTINGS);

    console.log("✅ Organization settings seeded successfully!\n");
  } catch (err) {
    console.error("❌ Organization settings seeding failed:", err);
    process.exit(1);
  }
}

// ================================
// RUN
// ================================
seedOrganizationSettings();

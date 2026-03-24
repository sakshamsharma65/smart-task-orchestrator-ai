import { eq, desc, and, or, ne ,getTableColumns,sql} from "drizzle-orm";
import { db } from "./db";
import { alias } from "drizzle-orm/pg-core";
import { inArray } from "drizzle-orm";
import { emailSettings, loginTwoFactorOtps } from "@shared/schema";

import type { InsertEmailSettings,EmailSettings } from "@shared/schema";
import { 
  users, 
  tasks, 
  teams, 
  roles, 
  userRoles, 
  teamMemberships, 
  taskGroups, 
  taskGroupTasks,
  taskGroupMembers,
  taskActivity, 
  taskStatuses,
  taskAttachments,
  taskStatusTransitions,
  rolePermissions,
  deletedUsers,
  deletedTasks,
  organizationSettings,
  officeLocations,
  departments,
  licenses,
  User, 
  InsertUser, 
  Task, 
  InsertTask,
  Team,
  InsertTeam,
  Role,
  TaskGroup,
  InsertTaskGroup,
  TaskGroupMember,
  UserRole,
  TeamMembership,
  TaskActivity,
  TaskStatus,
  TaskStatusTransition,
  InsertTaskStatusTransition,
  RolePermission,
  InsertRolePermission,
  DeletedUser,
  DeletedTask,
  InsertDeletedUser,
  InsertDeletedTask,
  OrganizationSettings,
  InsertOrganizationSettings,
  OfficeLocation,
  InsertOfficeLocation,
  Department,
  InsertDepartment,
  License,
  InsertLicense,
  activityLog,
  globalTodoDefinitions,
  taskTodos

  
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  getAllUsers(): Promise<User[]>;
  deactivateUser(id: string): Promise<User>;
  activateUser(id: string): Promise<User>;
  deleteUser(id: string, deletedBy: string): Promise<{ deletedUser: any; deletedTasksCount: number }>;

  
  // Deleted user operations (admin only)
  getAllDeletedUsers(): Promise<any[]>;
  getDeletedUserTasks(userId: string): Promise<any[]>;
  restoreDeletedUser(id: string): Promise<User>;
  CreateEmailSettings(
  settings: InsertEmailSettings
): Promise<EmailSettings>;

updateEmailSettings(
  id: number,
  updates: Partial<InsertEmailSettings>
): Promise<EmailSettings>;

deleteEmailSettings(id: number): Promise<void>;

markEmailSettingsAsVerified(
  id: number
): Promise<void>;
  // Task operations
  getTask(id: string): Promise<Task | undefined>;
  getAllTasks(): Promise<Task[]>;
  getTasksByUser(userId: string): Promise<Task[]>;
  getTasksByTeam(teamId: string): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, updates: Partial<Task>): Promise<Task>;
  deleteTask(id: string): Promise<void>;
  
  // Team operations
  getTeam(id: string): Promise<Team | undefined>;
  getAllTeams(): Promise<Team[]>;
  getTeamsByUser(userId: string): Promise<Team[]>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: string, updates: Partial<Team>): Promise<Team>;
  deleteTeam(id: string): Promise<void>;
  
  // Role operations
  getAllRoles(): Promise<Role[]>;
  createRole(role: any): Promise<Role>;
  updateRole(id: string, updates: Partial<Role>): Promise<Role>;
  deleteRole(id: string): Promise<void>;
  getUserRoles(userId: string): Promise<UserRole[]>;
  assignUserRole(userId: string, roleId: string): Promise<UserRole>;
  removeUserRole(userId: string, roleId: string): Promise<void>;
  
  // Team membership operations
  getTeamMembers(teamId: string): Promise<TeamMembership[]>;
  addTeamMember(teamId: string, userId: string, role?: string): Promise<TeamMembership>;
  removeTeamMember(teamId: string, userId: string): Promise<void>;
  
  // Task group operations
  getAllTaskGroups(): Promise<TaskGroup[]>;
  getTaskGroupsForUser(userId: string): Promise<TaskGroup[]>;
  createTaskGroup(group: InsertTaskGroup): Promise<TaskGroup>;
  deleteTaskGroup(id: string): Promise<void>;
  getTaskGroupDetails(id: string): Promise<any>;
  getTaskGroupMembers(groupId: string): Promise<any[]>;
  addTaskGroupMember(groupId: string, userId: string, role?: string): Promise<any>;
  removeTaskGroupMember(groupId: string, userId: string): Promise<void>;
  assignTaskToGroup(groupId: string, taskId: string): Promise<void>;
  removeTaskFromGroup(groupId: string, taskId: string): Promise<void>;
  // Global Todo Definitions (Settings)
  getAllGlobalTodoDefinitions(): Promise<any[]>;
  createGlobalTodoDefinition(todo: any): Promise<any>;
  updateGlobalTodoDefinition(id: string, updates: any): Promise<any>;
  deleteGlobalTodoDefinition(id: string): Promise<void>;

  // Task-Specific Todos
  getTaskTodos(taskId: string): Promise<any[]>;
  updateTaskTodoStatus(todoId: string, isCompleted: boolean): Promise<any>;
  countPendingTaskTodos(taskId: string): Promise<number>;
  
  // Task activity operations
  getTaskActivity(taskId: string): Promise<TaskActivity[]>;
  logTaskActivity(activity: Omit<TaskActivity, 'id' | 'created_at'>): Promise<TaskActivity>;
  
  // Task status operations
  getAllTaskStatuses(): Promise<TaskStatus[]>;
  createTaskStatus(status: { name: string; description?: string; color?: string; sequence_order: number; is_default?: boolean; can_delete?: boolean }): Promise<TaskStatus>;
  updateTaskStatus(id: string, updates: Partial<TaskStatus>): Promise<TaskStatus>;
  deleteTaskStatus(id: string): Promise<void>;
  getDefaultTaskStatus(): Promise<TaskStatus | undefined>;
  
  // Enhanced status deletion operations
  getTasksByStatus(statusName: string): Promise<Task[]>;
  deleteStatusWithTaskHandling(statusId: string, action: 'delete_tasks' | 'reassign_tasks', newStatusName?: string): Promise<{ deletedTasks: number; reassignedTasks: number }>;
  getStatusDeletionPreview(statusId: string): Promise<{ statusName: string; taskCount: number; availableStatuses: TaskStatus[]; hasTransitions: boolean }>;

  // Role permissions operations
  getRolePermissions(roleId: string): Promise<RolePermission[]>;
  createRolePermission(permission: InsertRolePermission): Promise<RolePermission>;
  updateRolePermission(id: string, updates: Partial<RolePermission>): Promise<RolePermission>;
  deleteRolePermission(id: string): Promise<void>;

  // Timer operations
  getActiveTimerTasks(userId: string): Promise<Task[]>;
  startTaskTimer(taskId: string, userId: string): Promise<Task>;
  pauseTaskTimer(taskId: string, userId: string): Promise<Task>;
  stopTaskTimer(taskId: string, userId: string): Promise<Task>;
  updateTaskTimer(taskId: string, updates: { time_spent_minutes?: number; timer_state?: string; timer_started_at?: Date | null; timer_session_data?: string }): Promise<Task>;

  // Organization settings operations
  getOrganizationSettings(): Promise<OrganizationSettings | undefined>;
  createOrganizationSettings(settings: InsertOrganizationSettings): Promise<OrganizationSettings>;
  updateOrganizationSettings(id: string, updates: Partial<OrganizationSettings>): Promise<OrganizationSettings>;

  // Task status transition operations
  getAllTaskStatusTransitions(): Promise<TaskStatusTransition[]>;
  createTaskStatusTransition(transition: InsertTaskStatusTransition): Promise<TaskStatusTransition>;
  deleteTaskStatusTransition(id: string): Promise<void>;

  // Office location operations
  getAllOfficeLocations(): Promise<OfficeLocation[]>;
  getOfficeLocation(id: string): Promise<OfficeLocation | undefined>;
  createOfficeLocation(location: InsertOfficeLocation): Promise<OfficeLocation>;
  updateOfficeLocation(id: string, updates: Partial<OfficeLocation>): Promise<OfficeLocation>;
  deleteOfficeLocation(id: string): Promise<void>;
  
  // License operations
  getLicense(clientId: string): Promise<License | undefined>;
  getAllLicenses(): Promise<License[]>;
  createLicense(license: InsertLicense): Promise<License>;
  updateLicense(id: number, updates: Partial<License>): Promise<License>;
  deleteLicense(id: number): Promise<void>;
}
// Add to your IStorage interface
export interface IStorage {
  // ... existing methods
  createTaskAttachment(attachment: any): Promise<any>;
  getTaskAttachments(taskId: string): Promise<any[]>;
  deleteTaskAttachment(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }


  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }
  // 1. Create a new OTP record
  async createLoginOtp(userId: string, tempToken: string, otpHash: string, expiresAt: Date) {
    const [otp] = await db.insert(loginTwoFactorOtps)
      .values({
        user_id: userId,
        temp_token: tempToken,
        otp_hash: otpHash,
        expires_at: expiresAt,
        used: false,
        attempts: 0,
      })
      .returning();
    return otp;
  }

  // 2. Fetch the OTP record using the temp_token from the frontend
  async getLoginOtpByTempToken(tempToken: string) {
    const [otp] = await db.select()
      .from(loginTwoFactorOtps)
      .where(eq(loginTwoFactorOtps.temp_token, tempToken))
      .limit(1);
    return otp || null;
  }

  // 3. Increment the attempts count (to prevent brute-force guessing)
  async incrementOtpAttempts(otpId: string) {
    // First, get current attempts
    const [current] = await db.select({ attempts: loginTwoFactorOtps.attempts })
      .from(loginTwoFactorOtps)
      .where(eq(loginTwoFactorOtps.id, otpId))
      .limit(1);

    if (!current) return null;

    // Increment by 1
    const [updated] = await db.update(loginTwoFactorOtps)
      .set({ attempts: (current.attempts || 0) + 1 })
      .where(eq(loginTwoFactorOtps.id, otpId))
      .returning();
      
    return updated;
  }

  // 4. Mark the OTP as used so it cannot be reused (Replay attack protection)
  async markOtpAsUsed(otpId: string) {
    await db.update(loginTwoFactorOtps)
      .set({ used: true })
      .where(eq(loginTwoFactorOtps.id, otpId));
  }

  // 5. Invalidate old OTPs (Crucial for the "Resend Code" feature)
  async invalidateOldLoginOtps(userId: string) {
    await db.update(loginTwoFactorOtps)
      .set({ used: true })
      .where(
        and(
          eq(loginTwoFactorOtps.user_id, userId),
          eq(loginTwoFactorOtps.used, false)
        )
      );
  }
  async updateUser2FAStatus(id: string, enabled: boolean) {
  await db.update(users).set({ is_2fa_enabled: enabled }).where(eq(users.id, id));
}
async updateAllUser2FAStatus(enabled: boolean) {  
  await db.update(users).set({ is_2fa_enabled: enabled });}

  async  getAllTaskGroupMembers() {
  return db.select().from(taskGroupMembers);
  }

  async updateUserPasswordByEmail(email: string, newPasswordHash: string): Promise<User | null> {
  try {
    const result = await db
      .update(users)
      .set({ password_hash: newPasswordHash })
      .where(eq(users.email, email))
      .returning();

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("Error updating user password:", error);
    throw new Error("Failed to update user password");
  }
}
async updateTaskStatusForTask(taskId: string, newStatus: string) {
  const result = await db.update(tasks)
    .set({
      status: newStatus,
      updated_at: new Date()
    })
    .where(eq(tasks.id, taskId))
    .returning();

  return result[0];
}
async  logActivity({
  source_table,
  event_type,
  record_id = null,
  summary = {},
  performed_by = null,
}: {
  source_table: string;
  event_type: string;
  record_id?: string | null;
  summary?: any;
  performed_by?: string | null;
}) {
  try {
    await db.insert(activityLog).values({
      source_table,
      event_type,
      record_id,
      summary,
      performed_by,
    });
  } catch (error) {
    console.error("Activity Log Error:", error);
  }
}


  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    console.log("🧩 updateUser() called with:", { id, updates });

    return result[0];}


    // ===============================
  // Email Settings
  // ===============================

  async getEmailSettings(): Promise<EmailSettings | undefined> {

    const result = await db
      .select()
      .from(emailSettings)
      .where(eq(emailSettings.isActive, true))
      .limit(1);

    return result[0];

  }
//   async getOverdueTasksForNotification(): Promise<any[]> {
//   return await db
//     .select({
//       id: tasks.id,
//       title: tasks.title,
//       dueDate: tasks.due_date,
//       userEmail: users.email,
//       userName: users.user_name,
//     })
//     .from(tasks)
//     .innerJoin(users, eq(tasks.assigned_to, users.id))
//     .where(
//       and(
//         sql`${tasks.due_date} < NOW()`,
//         ne(tasks.status, "Completed"),
//         ne(tasks.status, "Done")
//       )
//     );
// }

// 3. Helper to get User with Email (Useful for Task Creation/Update triggers)
// Inside your DatabaseStorage class
// Inside DatabaseStorage class in storage.ts

async getPendingOverdueTasksWithManagers(): Promise<any[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // We use aliases to join the 'users' table twice (once for assignee, once for manager)
  const assignees = alias(users, "assignees");
  const managers = alias(users, "managers");

  return await db
    .select({
      taskId: tasks.id,
      taskTitle: tasks.title,
      dueDate: tasks.due_date,
      assigneeName: assignees.user_name,
      assigneeEmail: assignees.email,
      managerName: managers.user_name,
      managerEmail: managers.email,
      teamName: teams.name,
    })
    .from(tasks)
    .innerJoin(assignees, eq(tasks.assigned_to, assignees.id))
    .leftJoin(teams, eq(tasks.team_id, teams.id))
    .leftJoin(managers, eq(teams.manager_id, managers.id))
    .where(
      and(
        sql`${tasks.due_date} < ${today.toISOString()}`,
        sql`LOWER(${tasks.status}) != 'completed'`,
        or(
          sql`${tasks.last_overdue_notified_at} IS NULL`,
          sql`${tasks.last_overdue_notified_at} < NOW() - INTERVAL '23 hours'`
        )
      )
    );
}
// async markTaskAsNotified(taskId: string): Promise<void> {
//   await db
//     .update(tasks)
//     .set({ last_overdue_notified_at: new Date() })
//     .where(eq(tasks.id, taskId));
// }

async markTaskAsNotified(taskId: string): Promise<void> {
  await db
    .update(tasks)
    .set({ last_overdue_notified_at: new Date() })
    .where(eq(tasks.id, taskId));
}
async getUserWithEmail(userId: string): Promise<User | undefined> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return result[0];
}



  async createEmailSettings(
    settings: InsertEmailSettings
  ): Promise<EmailSettings> {

    const result = await db
      .insert(emailSettings)
      .values({
        ...settings,
        isActive: true,
      })
      .returning();

    return result[0];

  }



  async updateEmailSettings(
    id: number,
    updates: Partial<InsertEmailSettings>
  ): Promise<EmailSettings> {

    const result = await db
      .update(emailSettings)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(emailSettings.id, id))
      .returning();

    return result[0];

  }



  async deleteEmailSettings(
    id: number
  ): Promise<void> {

    await db
      .delete(emailSettings)
      .where(eq(emailSettings.id, id));

  }



  async markEmailSettingsAsVerified(
    id: number
  ): Promise<void> {

    await db
      .update(emailSettings)
      .set({

        isVerified: true,

        lastTestedAt: new Date(),

        updatedAt: new Date(),

      })
      .where(eq(emailSettings.id, id));

  }

 
async getAllUsers(): Promise<any[]> { // Note: Return type is now 'any[]' or a custom type
  return await db.select({
    ...getTableColumns(users), // Selects all columns from the 'users' table
    role_name: roles.name      // Selects the 'name' from 'roles' and aliases it as 'role_name'
  })
  .from(users)
  .leftJoin(userRoles, eq(users.id, userRoles.user_id))
  .leftJoin(roles, eq(userRoles.role_id, roles.id))
  .orderBy(users.user_name);
}
  async deactivateUser(id: string): Promise<User> {
    const result = await db.update(users).set({
      is_active: false,
      updated_at: new Date()
    }).where(eq(users.id, id)).returning();
    return result[0];
  }

  async activateUser(id: string): Promise<User> {
    const result = await db.update(users).set({
      is_active: true,
      updated_at: new Date()
    }).where(eq(users.id, id)).returning();
    return result[0];
  }

  async deleteUser(id: string, deletedBy: string): Promise<{ deletedUser: any; deletedTasksCount: number }> {
    // Get user data before deletion
  
    const user = await this.getUser(id);
    if (!user) {
      throw new Error('User not found');
    }

    // Get user's tasks before deletion
    const userTasks = await db.select().from(tasks).where(eq(tasks.assigned_to, id));

    // Move user to deleted_users table
    const deletedUser = await db.insert(deletedUsers).values({
      id: user.id,
      email: user.email,
      user_name: user.user_name,
      department: user.department,
      phone: user.phone,
      manager: user.manager,
      created_at: user.created_at!,
      updated_at: user.updated_at!,
      deleted_by: deletedBy
    }).onConflictDoNothing().returning();

    // Move user's tasks to deleted_tasks table
    let deletedTasksCount = 0;
    for (const task of userTasks) {
      // Get additional task information
      const assignedUser = task.assigned_to ? await this.getUser(task.assigned_to) : null;
      const createdUser = await this.getUser(task.created_by);
      const team = task.team_id ? await this.getTeam(task.team_id) : null;

      await db.insert(deletedTasks).values({
        id: task.id,
        task_number: task.task_number,
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
        due_date: task.due_date,
        estimated_hours: task.estimated_hours,
        actual_hours: task.actual_hours,
        assigned_to: task.assigned_to,
        assigned_to_name: assignedUser?.user_name || null,
        created_by: task.created_by,
        created_by_name: createdUser?.user_name || 'Unknown',
        team_id: task.team_id,
        team_name: team?.name || null,
        task_group_id: task.task_group_id,
        task_group_name: null, // Will get from task groups later if needed
        start_date: task.start_date,
        completion_date: task.actual_completion_date,
        created_at: task.created_at!,
        updated_at: task.updated_at!,
        deleted_by: deletedBy,
        original_user_id: id
      });
      deletedTasksCount++;
    }

    // Delete user's tasks from active tasks table
    await db.delete(tasks).where(eq(tasks.assigned_to, id));

    // Remove user from teams
    await db.delete(teamMemberships).where(eq(teamMemberships.user_id, id));

    // Remove user from task groups
    await db.delete(taskGroupMembers).where(eq(taskGroupMembers.user_id, id));

    // Remove user roles
    await db.delete(userRoles).where(eq(userRoles.user_id, id));

    // Finally delete the user
    await db.delete(users).where(eq(users.id, id));

    return { deletedUser: deletedUser[0], deletedTasksCount };
  }

  async getAllDeletedUsers(): Promise<any[]> {
    const result = await db.select().from(deletedUsers).orderBy(desc(deletedUsers.deleted_at));
    return result;
  }

  async getDeletedUserTasks(userId: string): Promise<any[]> {
    const result = await db.select().from(deletedTasks)
      .where(eq(deletedTasks.original_user_id, userId))
      .orderBy(desc(deletedTasks.created_at));
    return result;
  }

  async restoreDeletedUser(id: string): Promise<User> {
    // This could be implemented later if needed
    throw new Error('User restoration not implemented yet');
  }

  // Task operations
  async getTask(id: string): Promise<Task | undefined> {
    const result = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
    return result[0];
  }

 // Update this in your DatabaseStorage class
async getAllTasks(): Promise<Task[]> {
  const result = await db
    .select({
      // This spreads all the standard task columns
      ...getTableColumns(tasks),
      // This creates an array of group objects for each task
      groups: sql`
        COALESCE(
          json_agg(
            json_build_object('id', ${taskGroups.id}, 'name', ${taskGroups.name})
          ) FILTER (WHERE ${taskGroups.id} IS NOT NULL), 
          '[]'
        )
      `.as("groups"),
    })
    .from(tasks)
    .leftJoin(taskGroupTasks, eq(tasks.id, taskGroupTasks.task_id))
    .leftJoin(taskGroups, eq(taskGroupTasks.group_id, taskGroups.id))
    .groupBy(tasks.id)
    .orderBy(desc(tasks.created_at));

  return result as any; 
}
// --- Global Todo Methods ---
async getAllGlobalTodoDefinitions(): Promise<any[]> {
  return await db.select().from(globalTodoDefinitions).where(eq(globalTodoDefinitions.is_active, true));
}

async createGlobalTodoDefinition(todo: any): Promise<any> {
  const result = await db.insert(globalTodoDefinitions).values(todo).returning();
  return result[0];
}

async updateGlobalTodoDefinition(id: string, updates: any): Promise<any> {
  const result = await db.update(globalTodoDefinitions).set(updates).where(eq(globalTodoDefinitions.id, id)).returning();
  return result[0];
}

async deleteGlobalTodoDefinition(id: string): Promise<void> {
  await db.delete(globalTodoDefinitions).where(eq(globalTodoDefinitions.id, id));
}

// --- Task Todo Methods ---
async getTaskTodos(taskId: string): Promise<any[]> {
  return await db.select().from(taskTodos).where(eq(taskTodos.task_id, taskId));
}

async updateTaskTodoStatus(todoId: string, isCompleted: boolean): Promise<any> {
  const result = await db.update(taskTodos).set({ is_completed: isCompleted }).where(eq(taskTodos.id, todoId)).returning();
  return result[0];
}

async countPendingTaskTodos(taskId: string): Promise<number> {
  console.log(`[STORAGE] countPendingTaskTodos called for Task ID: ${taskId}`);

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(taskTodos)
    .where(
      and(
        eq(taskTodos.task_id, taskId), 
        eq(taskTodos.is_completed, false)
      )
    );

  const pendingCount = Number(result[0]?.count || 0);
  
  console.log(`[STORAGE] Query Result for ${taskId}: Found ${pendingCount} pending items.`);
  
  return pendingCount;
}

async getTasksByUser(userId: string): Promise<Task[]> {
    return await db.select().from(tasks).where(
      or(eq(tasks.assigned_to, userId), eq(tasks.created_by, userId))
    )
    .orderBy(desc(tasks.created_at));
}



  async getTasksByTeam(teamId: string): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.team_id, teamId)).orderBy(desc(tasks.created_at));
  }

  async createTask(task: InsertTask): Promise<Task> {
    const result = await db.insert(tasks).values(task).returning();
    // 2. Logic: If todos are enabled, snapshot the global list
  // We check the 'type' because 'todos_enabled' is a custom field you'll add to InsertTask
  if ((task as any).todos_enabled) {
    const globals = await this.getAllGlobalTodoDefinitions();
    
    if (globals.length > 0) {
      const todoSnapshots = globals.map(g => ({
        task_id: result[0].id,
        title: g.title,
        is_completed: false
      }));
      
      await db.insert(taskTodos).values(todoSnapshots);
    }
  }
    
    return result[0];
  }
  

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const result = await db.update(tasks).set(updates).where(eq(tasks.id, id)).returning();
    return result[0];
  }

  async deleteTask(id: string): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }
  // Add these inside your DatabaseStorage class in storage.ts
async createTaskAttachment(attachment: any): Promise<any> {
  // Use your drizzle 'db' instance to insert into taskAttachments table
  const [newRecord] = await db
    .insert(taskAttachments)
    .values(attachment)
    .returning();
  return newRecord;
}

async getTaskAttachments(taskId: string): Promise<any[]> {
  return await db
    .select()
    .from(taskAttachments)
    .where(eq(taskAttachments.task_id, taskId))
    .orderBy(desc(taskAttachments.uploaded_at));
}

async deleteTaskAttachment(id: string): Promise<void> {
  await db.delete(taskAttachments).where(eq(taskAttachments.id, id));
}

  // Team operations
  async getTeam(id: string): Promise<Team | undefined> {
    const result = await db
      .select({
        id: teams.id,
        name: teams.name,
        description: teams.description,
        created_by: teams.created_by,
        manager_id: teams.manager_id,
        created_at: teams.created_at,
        manager: {
          id: users.id,
          user_name: users.user_name,
          email: users.email,
        }
      })
      .from(teams)
      .leftJoin(users, eq(teams.manager_id, users.id))
      .where(eq(teams.id, id))
      .limit(1);
    return result[0];
  }
  
 async getAllTeams(): Promise<Team[]> {
    return await db
      .select({
        id: teams.id,
        name: teams.name,
        description: teams.description,
        created_by: teams.created_by,
        manager_id: teams.manager_id,
        created_at: teams.created_at,
        manager: {
          id: users.id,
          user_name: users.user_name,
          email: users.email,
        }
      })
      .from(teams)
      .leftJoin(users, eq(teams.manager_id, users.id))
      .orderBy(teams.name);
  }  

  async getTeamsByUser(userId: string): Promise<Team[]> {
    return await db
      .select({
        id: teams.id,
        name: teams.name,
        description: teams.description,
        created_by: teams.created_by,
        manager_id: teams.manager_id,
        created_at: teams.created_at,
        manager: {
          id: users.id,
          user_name: users.user_name,
          email: users.email,
        }
      })
      .from(teams)
      .leftJoin(users, eq(teams.manager_id, users.id))
      .innerJoin(teamMemberships, eq(teams.id, teamMemberships.team_id))
      .where(eq(teamMemberships.user_id, userId))
      .orderBy(teams.name);
  }
  async getTeamsManagedBy(userId: string): Promise<Team[]> {
  return await db
    .select({
      id: teams.id,
      name: teams.name,
      description: teams.description,
      created_by: teams.created_by,
      manager_id: teams.manager_id,
      created_at: teams.created_at
    })
    .from(teams)
    .where(eq(teams.manager_id, userId));
}

  async  getTasksForManager(userId: string) {
  // 1. Get all teams managed by this user
  const managedTeams = await db
    .select({
      id: teams.id,
      name: teams.name,
    })
    .from(teams)
    .where(eq(teams.manager_id, userId));

  if (managedTeams.length === 0) {
    return []; // user manages no teams → no tasks
  }

  const teamIds = managedTeams.map(t => t.id);

  // 2. Get all team members for these teams
  const teamMembers = await db
    .select({
      user_id: teamMemberships.user_id
    })
    .from(teamMemberships)
    .where(inArray(teamMemberships.team_id, teamIds));

  const userIds = teamMembers.map(m => m.user_id);

  if (userIds.length === 0) {
    return []; // no members → no tasks
  }

  // 3. Get all tasks assigned to these users
  const taskList = await db
    .select()
    .from(tasks) // your tasks table
    .where(inArray(tasks.assigned_to, userIds));

  return taskList;
}


  async createTeam(team: InsertTeam): Promise<Team> {
    const result = await db.insert(teams).values(team).returning();
    return result[0];
  }

  async updateTeam(id: string, updates: Partial<Team>): Promise<Team> {
    const result = await db.update(teams).set(updates).where(eq(teams.id, id)).returning();
    return result[0];
  }

  async deleteTeam(id: string): Promise<void> {
    await db.delete(teams).where(eq(teams.id, id));
  }

  // Role operations
  async getAllRoles(): Promise<Role[]> {
    return await db.select().from(roles);
  }

  async createRole(role: any): Promise<Role> {
    const result = await db.insert(roles).values(role).returning();
    return result[0];
  }

  async updateRole(id: string, updates: Partial<Role>): Promise<Role> {
    const result = await db.update(roles).set(updates).where(eq(roles.id, id)).returning();
    return result[0];
  }

  async deleteRole(id: string): Promise<void> {
    await db.delete(roles).where(eq(roles.id, id));
  }

  async getUserRoles(userId: string): Promise<UserRole[]> {
    return await db
      .select({
        id: userRoles.id,
        user_id: userRoles.user_id,
        role_id: userRoles.role_id,
        assigned_by: userRoles.assigned_by,
        assigned_at: userRoles.assigned_at,
        role: {
          id: roles.id,
          name: roles.name,
          description: roles.description,
          created_at: roles.created_at,
          updated_at: roles.updated_at,
        }
      })
      .from(userRoles)
      .leftJoin(roles, eq(userRoles.role_id, roles.id))
      .where(eq(userRoles.user_id, userId))
      .limit(10); // Add limit to prevent runaway queries
  }

  async assignUserRole(userId: string, roleId: string): Promise<UserRole> {
    // First, remove any existing roles for this user (enforce single role per user)
    await db.delete(userRoles).where(eq(userRoles.user_id, userId));
    
    // Then assign the new role
    const result = await db.insert(userRoles).values({
      user_id: userId,
      role_id: roleId
    }).returning();
    return result[0];
  }

  async removeUserRole(userId: string, roleId: string): Promise<void> {
    await db.delete(userRoles).where(
      and(eq(userRoles.user_id, userId), eq(userRoles.role_id, roleId))
    );
  }

  // Team membership operations
 // Inside your DatabaseStorage class
async getTeamMembers(teamId: string, role?: string): Promise<any[]> {
  // 1. Get the primary manager_id from the teams table
  const teamResult = await db
    .select({ manager_id: teams.manager_id })
    .from(teams)
    .where(eq(teams.id, teamId))
    .limit(1);
  
  const primaryManagerId = teamResult[0]?.manager_id;

  // 2. Build the membership query
  let query = db
    .select({
      id: teamMemberships.id,
      user_id: teamMemberships.user_id,
      role_within_team: teamMemberships.role_within_team,
      user: {
        id: users.id,
        user_name: users.user_name,
        email: users.email,
      }
    })
    .from(teamMemberships)
    .leftJoin(users, eq(teamMemberships.user_id, users.id))
    .where(eq(teamMemberships.team_id, teamId));

  // 3. Apply specific filtering logic
  if (role === 'manager') {
    // Return users assigned as 'manager' OR the user who is the primary manager_id
    return await query.where(
      and(
        eq(teamMemberships.team_id, teamId),
        or(
          eq(teamMemberships.role_within_team, 'manager'),
          primaryManagerId ? eq(teamMemberships.user_id, primaryManagerId) : undefined
        )
      )
    );
  } else if (role === 'member') {
    // Return users assigned as 'member' or where the role is NULL (default member)
    // AND ensure they aren't the primary manager
    return await query.where(
      and(
        eq(teamMemberships.team_id, teamId),
        or(
          eq(teamMemberships.role_within_team, 'member'),
          sql`${teamMemberships.role_within_team} IS NULL`
        ),
        primaryManagerId ? ne(teamMemberships.user_id, primaryManagerId) : undefined
      )
    );
  }

  return await query;
}

async addTeamMember(teamId: string, userId: string, role?: string) {
  await db.execute(sql`BEGIN`);

  try {
    if (role === "manager") {
      // Set previous manager roles to NULL
      await db.execute(sql`
        UPDATE team_memberships
        SET role_within_team = NULL
        WHERE team_id = ${teamId}
        AND user_id <> ${userId}
        AND role_within_team = 'manager';
      `);
    }

    // UPSERT new role
    const result = await db.execute(sql`
      INSERT INTO team_memberships (team_id, user_id, role_within_team)
      VALUES (${teamId}, ${userId}, ${role || null})
      ON CONFLICT (team_id, user_id)
      DO UPDATE SET role_within_team = EXCLUDED.role_within_team
      RETURNING *;
    `);

    await db.execute(sql`COMMIT`);
    return result.rows[0];

  } catch (err) {
    await db.execute(sql`ROLLBACK`);
    throw err;
  }
}






async removeTeamMember(teamId: string, userId: string): Promise<void> {
  console.log(`Removing user ${userId} from team ${teamId}  heheheheheheh`);
  // 1. Delete from team_memberships
  await db.delete(teamMemberships).where(
    and(eq(teamMemberships.team_id, teamId), eq(teamMemberships.user_id, userId))
  );

  // 2. Clear manager_id if this user is manager
//  const a= await db.update(teams)
//     .set({ manager_id: null })
//     .where(
//       and(eq(teams.id, teamId), eq(teams.manager_id, userId))
//     ).returning();
//     console.log(`Cleared manager_id for team ${teamId} if user was manager. hehehehe`);
//     console.log('saksham',a)
}



  // Task group operations
  async getAllTaskGroups(): Promise<TaskGroup[]> {
    return await db.select({
      id: taskGroups.id,
      name: taskGroups.name,
      description: taskGroups.description,
      visibility: taskGroups.visibility,
      owner_id: taskGroups.owner_id,
      created_at: taskGroups.created_at,
      owner: {
        id: users.id,
        user_name: users.user_name,
        email: users.email,
      }
    }).from(taskGroups)
    .leftJoin(users, eq(taskGroups.owner_id, users.id));
  }

  // Get task groups visible to a specific user based on their role and permissions
async getTaskGroupsForUser(userId: string): Promise<TaskGroup[]> {
  const userRoles = await this.getUserRoles(userId);
  const roleNames = userRoles.map(ur => ur.role?.name).filter(Boolean);

  // 🧩 Define base query with COUNT + JOINs
  let query = db
    .select({
      id: taskGroups.id,
      name: taskGroups.name,
      description: taskGroups.description,
      visibility: taskGroups.visibility,
      owner_id: taskGroups.owner_id,
      created_at: taskGroups.created_at,
      owner: {
        id: users.id,
        user_name: users.user_name,
        email: users.email,
      },
      task_count: sql<number>`COALESCE(COUNT(${taskGroupTasks.task_id}), 0)`.as("task_count"),
    })
    .from(taskGroups)
    .leftJoin(taskGroupTasks, eq(taskGroups.id, taskGroupTasks.group_id))
    .leftJoin(users, eq(taskGroups.owner_id, users.id))
    .groupBy(
      taskGroups.id,
      taskGroups.name,
      taskGroups.description,
      taskGroups.visibility,
      taskGroups.owner_id,
      taskGroups.created_at,
      users.id,
      users.user_name,
      users.email
    );

  // 🧠 Role-based filtering
  if (roleNames.includes("admin")) {
    // Admins see all
    console.log("[DEBUG] Admin SQL:", query.toSQL().sql);
    return await query;
  }

  if (roleNames.includes("manager") || roleNames.includes("team_manager")) {
    query = query.where(
      or(
        eq(taskGroups.owner_id, userId),
        eq(taskGroups.visibility, "all_team_members"),
        eq(taskGroups.visibility, "managers_admin_only")
      )
    );
    console.log("[DEBUG] Manager SQL:", query.toSQL().sql);
    return await query;
  }

  query = query.where(
    or(
      eq(taskGroups.owner_id, userId),
      eq(taskGroups.visibility, "all_team_members")
    )
  );
  console.log("[DEBUG] User SQL:", query.toSQL().sql);
  return await query;
}
  async createTaskGroup(group: InsertTaskGroup): Promise<TaskGroup> {
    const result = await db.insert(taskGroups).values(group).returning();
    return result[0];
  }

  async deleteTaskGroup(id: string): Promise<void> {
    await db.delete(taskGroups).where(eq(taskGroups.id, id));
  }
  

  async getTaskGroupDetails(id: string): Promise<any> {
    const group = await db.select({
      id: taskGroups.id,
      name: taskGroups.name,
      description: taskGroups.description,
      visibility: taskGroups.visibility,
      owner_id: taskGroups.owner_id,
      created_at: taskGroups.created_at,
      owner: {
        id: users.id,
        user_name: users.user_name,
        email: users.email,
      }
    }).from(taskGroups)
    .leftJoin(users, eq(taskGroups.owner_id, users.id))
    .where(eq(taskGroups.id, id)).limit(1);
    
    if (group.length === 0) {
      throw new Error('Task group not found');
    }

    // Get group tasks with task details
    const groupTasks = await db
      .select({
        id: taskGroupTasks.id,
        task: {
          id: tasks.id,
          task_number: tasks.task_number,
          title: tasks.title,
          description: tasks.description,
          priority: tasks.priority,
          status: tasks.status,
          due_date: tasks.due_date,
          estimated_hours: tasks.estimated_hours,
          assigned_to: tasks.assigned_to,
          assigned_user: {
            id: users.id,
            user_name: users.user_name,
            email: users.email,
          }
        }
      })
      .from(taskGroupTasks)
      .innerJoin(tasks, eq(taskGroupTasks.task_id, tasks.id))
      .leftJoin(users, eq(tasks.assigned_to, users.id))
      .where(eq(taskGroupTasks.group_id, id));

    // Get group members
    const groupMembers = await db
      .select({
        id: taskGroupMembers.id,
        user_id: taskGroupMembers.user_id,
        role: taskGroupMembers.role,
        created_at: taskGroupMembers.created_at,
        user: {
          id: users.id,
          user_name: users.user_name,
          email: users.email,
          department: users.department,
        }
      })
      .from(taskGroupMembers)
      .innerJoin(users, eq(taskGroupMembers.user_id, users.id))
      .where(eq(taskGroupMembers.group_id, id));

    return {
      ...group[0],
      tasks: groupTasks,
      members: groupMembers,
    };
  }

  async getTaskGroupMembers(groupId: string): Promise<any[]> {
    return await db
      .select({
        id: taskGroupMembers.id,
        user_id: taskGroupMembers.user_id,
        role: taskGroupMembers.role,
        created_at: taskGroupMembers.created_at,
        user: {
          id: users.id,
          user_name: users.user_name,
          email: users.email,
          department: users.department,
        }
      })
      .from(taskGroupMembers)
      .innerJoin(users, eq(taskGroupMembers.user_id, users.id))
      .where(eq(taskGroupMembers.group_id, groupId));
  }

  async addTaskGroupMember(groupId: string, userId: string, role: string = 'member'): Promise<any> {
    // Check if user is already a member
    const existingMember = await db.select().from(taskGroupMembers)
      .where(and(
        eq(taskGroupMembers.group_id, groupId),
        eq(taskGroupMembers.user_id, userId)
      ))
      .limit(1);
    
    if (existingMember.length > 0) {
      throw new Error('User is already a member of this group');
    }
    
    const result = await db.insert(taskGroupMembers).values({
      group_id: groupId,
      user_id: userId,
      role,
    }).returning();
    return result[0];
  }

  async removeTaskGroupMember(groupId: string, userId: string): Promise<void> {
    await db.delete(taskGroupMembers).where(
      and(eq(taskGroupMembers.group_id, groupId), eq(taskGroupMembers.user_id, userId))
    );
  }

  async assignTaskToGroup(groupId: string, taskId: string): Promise<void> {
    await db.insert(taskGroupTasks).values({
      group_id: groupId,
      task_id: taskId
    });
  }

  async removeTaskFromGroup(groupId: string, taskId: string): Promise<void> {
    await db.delete(taskGroupTasks).where(
      and(eq(taskGroupTasks.group_id, groupId), eq(taskGroupTasks.task_id, taskId))
    );
  }

  // Task activity operations
  async getTaskActivity(taskId: string): Promise<TaskActivity[]> {
    return await db.select().from(taskActivity)
      .where(eq(taskActivity.task_id, taskId))
      .orderBy(desc(taskActivity.created_at));
  }
 
  // async logTaskActivity(activity: Omit<TaskActivity, 'id' | 'created_at'>): Promise<TaskActivity> {
  //   console.log("[DEBUG] Logging task activity:", activity);
  //   const result = await db.insert(taskActivity).values(activity).returning();
  //   console.log("[DEBUG] Task activity logged successfully:", result[0]);
  //   return result[0];
  // }
  async logTaskActivity(activity: Omit<TaskActivity, "id" | "created_at">): Promise<TaskActivity> {
  const { task_id, action_type, old_value, new_value, acted_by } = activity;

  // 1️⃣ Get last activity for this task
  const last = await db.select()
    .from(taskActivity)
    .where(eq(taskActivity.task_id, task_id))
    .orderBy(desc(taskActivity.created_at))
    .limit(1);

  const lastRow = last[0];

  // 2️⃣ Prevent duplicates
  if (
    lastRow &&
    lastRow.action_type === action_type &&
    lastRow.old_value === old_value &&
    lastRow.new_value === new_value &&
    lastRow.acted_by === acted_by
  ) {
    console.log("⛔ Duplicate activity prevented");
    return lastRow;
  }

  // 3️⃣ Insert activity
  const result = await db.insert(taskActivity).values(activity).returning();
  return result[0];
}


  // Task status operations
  async getAllTaskStatuses(): Promise<TaskStatus[]> {
    return await db.select().from(taskStatuses).orderBy(taskStatuses.sequence_order);
  }

  async createTaskStatus(status: { name: string; description?: string; color?: string; sequence_order: number; is_default?: boolean }): Promise<TaskStatus> {
    // If this is being set as default, first remove default from all other statuses
    if (status.is_default) {
      await db.update(taskStatuses).set({ is_default: false }).where(eq(taskStatuses.is_default, true));
    }
    
    const result = await db.insert(taskStatuses).values({
      name: status.name,
      description: status.description || null,
      color: status.color || "#6b7280",
      sequence_order: status.sequence_order,
      is_default: status.is_default || false
    }).returning();
    return result[0];
  }

  async updateTaskStatus(id: string, updates: Partial<TaskStatus>): Promise<TaskStatus> {
    // If this is being set as default, first remove default from all other statuses
    if (updates.is_default) {
      await db.update(taskStatuses).set({ is_default: false }).where(eq(taskStatuses.is_default, true));
    }
    
    const result = await db.update(taskStatuses).set({
      ...updates,
      updated_at: new Date()
    }).where(eq(taskStatuses.id, id)).returning();
    return result[0];
  }

  async deleteTaskStatus(id: string): Promise<void> {
    await db.delete(taskStatuses).where(eq(taskStatuses.id, id));
  }

  async getTasksByStatus(statusName: string): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.status, statusName));
  }

  async deleteStatusWithTaskHandling(statusId: string, action: 'delete_tasks' | 'reassign_tasks', newStatusName?: string): Promise<{ deletedTasks: number; reassignedTasks: number }> {
    let deletedTasks = 0;
    let reassignedTasks = 0;

    // Get the status to be deleted
    const statusToDelete = await db.select().from(taskStatuses).where(eq(taskStatuses.id, statusId)).limit(1);
    if (statusToDelete.length === 0) {
      throw new Error('Status not found');
    }

    const statusName = statusToDelete[0].name;

    // Get tasks using this status
    const tasksWithStatus = await this.getTasksByStatus(statusName);

    if (action === 'delete_tasks') {
      // Delete all tasks with this status
      for (const task of tasksWithStatus) {
        await this.deleteTask(task.id);
        deletedTasks++;
      }
    } else if (action === 'reassign_tasks' && newStatusName) {
      // Reassign all tasks to new status
      await db.update(tasks)
        .set({ status: newStatusName, updated_at: new Date() })
        .where(eq(tasks.status, statusName));
      reassignedTasks = tasksWithStatus.length;

      // Log activity for each reassigned task
      for (const task of tasksWithStatus) {
        await this.logTaskActivity({
          task_id: task.id,
          action_type: 'status_changed',
          old_value: statusName,
          new_value: newStatusName,
          acted_by: null // System action
        });
      }
    }

    // Delete the status
    await db.delete(taskStatuses).where(eq(taskStatuses.id, statusId));

    return { deletedTasks, reassignedTasks };
  }

  async getStatusDeletionPreview(statusId: string): Promise<{ statusName: string; taskCount: number; availableStatuses: TaskStatus[]; hasTransitions: boolean }> {
    // Get the status to be deleted
    const statusToDelete = await db.select().from(taskStatuses).where(eq(taskStatuses.id, statusId)).limit(1);
    if (statusToDelete.length === 0) {
      throw new Error('Status not found');
    }

    const statusName = statusToDelete[0].name;

    // Count tasks using this status
    const tasksWithStatus = await this.getTasksByStatus(statusName);
    const taskCount = tasksWithStatus.length;

    // Get all other available statuses for reassignment
    const availableStatuses = await db.select().from(taskStatuses).where(ne(taskStatuses.id, statusId));

    // Check if this status has transitions (this would need to be implemented based on how transitions are stored)
    // For now, we'll assume it has transitions if it's not the default status
    const hasTransitions = !statusToDelete[0].is_default;

    return {
      statusName,
      taskCount,
      availableStatuses,
      hasTransitions
    };
  }

  async getDefaultTaskStatus(): Promise<TaskStatus | undefined> {
    const result = await db.select().from(taskStatuses).where(eq(taskStatuses.is_default, true)).limit(1);
    return result[0];
  }

  // Role permissions operations
  async getRolePermissions(roleId: string): Promise<RolePermission[]> {
    const result = await db.select().from(rolePermissions).where(eq(rolePermissions.role_id, roleId));
    return result;
  }

  async createRolePermission(permission: InsertRolePermission): Promise<RolePermission> {
    const result = await db.insert(rolePermissions).values(permission).returning();
    return result[0];
  }

  async updateRolePermission(id: string, updates: Partial<RolePermission>): Promise<RolePermission> {
    const result = await db.update(rolePermissions).set({
      ...updates,
      updated_at: new Date()
    }).where(eq(rolePermissions.id, id)).returning();
    return result[0];
  }

  async deleteRolePermission(id: string): Promise<void> {
    await db.delete(rolePermissions).where(eq(rolePermissions.id, id));
  }

  // Timer operations
  async getActiveTimerTasks(userId: string): Promise<Task[]> {
    const result = await db.select().from(tasks)
      .where(and(
        eq(tasks.assigned_to, userId),
        eq(tasks.timer_state, 'running'),
        eq(tasks.is_time_managed, true)
      ));
    return result;
  }

  async startTaskTimer(taskId: string, userId: string): Promise<Task> {
    // First check if user already has 2 active timers
    const activeTasks = await this.getActiveTimerTasks(userId);
    if (activeTasks.length >= 2) {
      throw new Error('Maximum of 2 active timers allowed. Please stop another timer first.');
    }

    const result = await db.update(tasks).set({
      timer_state: 'running',
      timer_started_at: new Date(),
      updated_at: new Date()
    }).where(eq(tasks.id, taskId)).returning();

    // Log activity
    await this.logTaskActivity({
      task_id: taskId,
      action_type: 'timer_started',
      old_value: 'stopped',
      new_value: 'running',
      acted_by: userId
    });

    return result[0];
  }

  async pauseTaskTimer(taskId: string, userId: string): Promise<Task> {
    const task = await this.getTask(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    let timeSpent = task.time_spent_minutes || 0;
    
    // Calculate time since timer started if it's running
    if (task.timer_state === 'running' && task.timer_started_at) {
      const now = new Date();
      const startTime = new Date(task.timer_started_at);
      const elapsedMinutes = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60));
      timeSpent += elapsedMinutes;
    }

    const result = await db.update(tasks).set({
      timer_state: 'paused',
      time_spent_minutes: timeSpent,
      timer_started_at: null,
      updated_at: new Date()
    }).where(eq(tasks.id, taskId)).returning();

    // Log activity
    await this.logTaskActivity({
      task_id: taskId,
      action_type: 'timer_paused',
      old_value: 'running',
      new_value: 'paused',
      acted_by: userId
    });

    return result[0];
  }

  async stopTaskTimer(taskId: string, userId: string): Promise<Task> {
    const task = await this.getTask(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    let timeSpent = task.time_spent_minutes || 0;
    
    // Calculate time since timer started if it's running
    if (task.timer_state === 'running' && task.timer_started_at) {
      const now = new Date();
      const startTime = new Date(task.timer_started_at);
      const elapsedMinutes = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60));
      timeSpent += elapsedMinutes;
    }

    const result = await db.update(tasks).set({
      timer_state: 'stopped',
      time_spent_minutes: timeSpent,
      timer_started_at: null,
      updated_at: new Date()
    }).where(eq(tasks.id, taskId)).returning();

    // Log activity
    await this.logTaskActivity({
      task_id: taskId,
      action_type: 'timer_stopped',
      old_value: task.timer_state,
      new_value: 'stopped',
      acted_by: userId
    });

    return result[0];
  }

  async updateTaskTimer(taskId: string, updates: { time_spent_minutes?: number; timer_state?: string; timer_started_at?: Date | null; timer_session_data?: string }): Promise<Task> {
    const result = await db.update(tasks).set({
      ...updates,
      updated_at: new Date()
    }).where(eq(tasks.id, taskId)).returning();
    return result[0];
  }

  // Organization settings operations
  async getOrganizationSettings(): Promise<OrganizationSettings | undefined> {
    const result = await db.select().from(organizationSettings).limit(1);
    return result[0] || undefined;
  }

  async createOrganizationSettings(settings: InsertOrganizationSettings): Promise<OrganizationSettings> {
    const result = await db.insert(organizationSettings).values(settings).returning();
    return result[0];
  }

  async updateOrganizationSettings(id: string, updates: Partial<OrganizationSettings>): Promise<OrganizationSettings> {
    const result = await db.update(organizationSettings).set({
      ...updates,
      updated_at: new Date()
    }).where(eq(organizationSettings.id, id)).returning();
    return result[0];
  }

  // Task status transition operations
  async getAllTaskStatusTransitions(): Promise<TaskStatusTransition[]> {
    return await db.select().from(taskStatusTransitions).orderBy(taskStatusTransitions.created_at);
  }

  async createTaskStatusTransition(transition: InsertTaskStatusTransition): Promise<TaskStatusTransition> {
    const result = await db.insert(taskStatusTransitions).values(transition).returning();
    return result[0];
  }

  async deleteTaskStatusTransition(id: string): Promise<void> {
    await db.delete(taskStatusTransitions).where(eq(taskStatusTransitions.id, id));
  }

  // Office location operations
  async getAllOfficeLocations(): Promise<OfficeLocation[]> {
    return await db.select().from(officeLocations).orderBy(officeLocations.location_name);
  }

  async getOfficeLocation(id: string): Promise<OfficeLocation | undefined> {
    const result = await db.select().from(officeLocations).where(eq(officeLocations.id, id)).limit(1);
    return result[0];
  }

  async createOfficeLocation(location: InsertOfficeLocation): Promise<OfficeLocation> {
    const result = await db.insert(officeLocations).values(location).returning();
    return result[0];
  }

  async updateOfficeLocation(id: string, updates: Partial<OfficeLocation>): Promise<OfficeLocation> {
    const result = await db.update(officeLocations).set({
      ...updates,
      updated_at: new Date()
    }).where(eq(officeLocations.id, id)).returning();
    return result[0];
  }

  async deleteOfficeLocation(id: string): Promise<void> {
    await db.delete(officeLocations).where(eq(officeLocations.id, id));
  }

  // Department operations
  async getAllDepartments(): Promise<Department[]> {
    return await db.select().from(departments).orderBy(departments.name);
  }

  async getDepartment(id: string): Promise<Department | undefined> {
    const result = await db.select().from(departments).where(eq(departments.id, id));
    return result[0];
  }

  async createDepartment(dept: InsertDepartment): Promise<Department> {
    const result = await db.insert(departments).values(dept).returning();
    return result[0];
  }

  async updateDepartment(id: string, updates: Partial<InsertDepartment>): Promise<Department> {
    const result = await db.update(departments).set({
      ...updates,
      updated_at: new Date()
    }).where(eq(departments.id, id)).returning();
    return result[0];
  }

  async deleteDepartment(id: string): Promise<void> {
    await db.delete(departments).where(eq(departments.id, id));
  }

  // License operations
  async getLicense(clientId: string): Promise<License | undefined> {
    const result = await db.select().from(licenses).where(
      and(
        eq(licenses.clientId, clientId),
        eq(licenses.isActive, true)
      )
    ).orderBy(desc(licenses.createdAt)).limit(1);
    return result[0];
  }

  async getAllLicenses(): Promise<License[]> {
    return await db.select().from(licenses).orderBy(desc(licenses.createdAt));
  }

  async createLicense(license: InsertLicense): Promise<License> {
    const result = await db.insert(licenses).values(license).returning();
    return result[0];
  }

  async updateLicense(id: number, updates: Partial<License>): Promise<License> {
    const result = await db.update(licenses).set({
      ...updates,
      updatedAt: new Date()
    }).where(eq(licenses.id, id)).returning();
    return result[0];
  }

  async deleteLicense(id: number): Promise<void> {
    await db.delete(licenses).where(eq(licenses.id, id));
  }
}

export const storage = new DatabaseStorage();

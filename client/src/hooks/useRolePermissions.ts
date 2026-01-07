import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentUserRoleAndTeams } from "@/hooks/useCurrentUserRoleAndTeams";


export interface RolePermission {
  id: string;
  role_id: string;
  resource: string;
  permission_level: number;
  created_at: string;
  updated_at: string;
}

export function useRolePermissions() {
  const { user } = useAuth();
  const { roles } = useCurrentUserRoleAndTeams();

  // Fetch all role permissions for current user's roles
  const { data: permissions = [], isLoading } = useQuery({
    queryKey: ["/api/role-permissions", roles],
    queryFn: async () => {
      if (!roles.length) return [];
      
      // Get all roles data to map role names to IDs
      const rolesResponse = await fetch("/api/roles", {
        headers: { "x-user-id": user?.id || "" }
      });
      
      if (!rolesResponse.ok) return [];
      const allRoles = await rolesResponse.json();
      
      // Get role IDs for current user's roles
      const roleIds = allRoles
        .filter((role: any) => roles.includes(role.name))
        .map((role: any) => role.id);
      
      if (!roleIds.length) return [];
      
      // Fetch permissions for all user roles
      const permissionPromises = roleIds.map(async (roleId: string) => {
        const response = await fetch(`/api/roles/${roleId}/permissions`, {
          headers: { "x-user-id": user?.id || "" }
        });
        return response.ok ? response.json() : [];
      });
      
      const allPermissions = await Promise.all(permissionPromises);
      return allPermissions.flat();
    },
    enabled: !!user?.id && roles.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Helper function to check if user has permission for a resource
  const hasPermission = (resource: string, minLevel: number = 0): boolean => {
    if (!permissions.length) return false;
    
    // Check if user has any permission for this resource that meets minimum level
    return permissions.some((perm: RolePermission) => 
      perm.resource === resource && perm.permission_level >= minLevel
    );
  };

  // Helper function to get permission level for a resource
  const getPermissionLevel = (resource: string): number => {
    const permission = permissions.find((perm: RolePermission) => 
      perm.resource === resource
    );
    return permission?.permission_level || 0;
  };

  // Common permission checks
  const canViewSettings = hasPermission("settings", 1);
  const canEditSettings = hasPermission("settings", 2);
  const canCreateSettings = hasPermission("settings", 3);
  const canDeleteSettings = hasPermission("settings", 4);
  const canViewTask = hasPermission("tasks", 1);
  const canEditTask = hasPermission("tasks", 2);
  const canCreateTask = hasPermission("tasks", 3);
  const canDeleteTask = hasPermission("tasks", 4);
  const canViewReports = hasPermission("task-report", 1);
  const canEditReports = hasPermission("task-report", 2);
  const canCreateReports = hasPermission("task-report", 3);
  const canDeleteReports = hasPermission("task-report", 4);
  const canViewUsers = hasPermission("user-management", 1);
  const canEditUsers = hasPermission("user-management", 2);
  const canCreateUsers = hasPermission("user-management", 3);
  const canDeleteUsers = hasPermission("user-management", 4);
  const canViewTeams = hasPermission("team-management", 1);
  const canEditTeams = hasPermission("team-management", 2);
  const canCreateTeams = hasPermission("team-management", 3);
  const canDeleteTeams = hasPermission("team-management", 4);
  const canViewRoles = hasPermission("roles-privileges", 1);
  const canEditRoles = hasPermission("roles-privileges", 2);
  const canCreateRoles = hasPermission("roles-privileges", 3);
  const canDeleteRoles = hasPermission("roles-privileges", 4);
  const canViewRolePermissions = hasPermission("roles-privileges", 1);
  const canEditRolePermissions = hasPermission("roles-privileges", 2);
  const canCreateRolePermissions = hasPermission("roles-privileges", 3);
  const canDeleteRolePermissions = hasPermission("roles-privileges", 4);
  const canViewOrganizationSettings = hasPermission("organization_settings", 1);
  const canEditOrganizationSettings = hasPermission("organization_settings", 2);    
  const canCreateOrganizationSettings = hasPermission("organization_settings", 3);
  const canDeleteOrganizationSettings = hasPermission("organization_settings", 4);
  const canViewDashboard = hasPermission("dashboard", 1);
  const canEditDashboard = hasPermission("dashboard", 2);
  const canCreateDashboard = hasPermission("dashboard", 3);
  const canDeleteDashboard = hasPermission("dashboard", 4);
  const canViewTask_Analytics = hasPermission("analytics-report", 1);
  const canEditTask_Analytics = hasPermission("analytics-report", 2);
  const canCreateTask_Analytics = hasPermission("analytics-report", 3);
  const canDeleteTask_Analytics = hasPermission("analytics-report", 4);
  const canViewTask_Benchmarking = hasPermission("benchmarking", 1);
  const canEditTask_Benchmarking = hasPermission("benchmarking", 2);
  const canCreateTask_Benchmarking = hasPermission("benchmarking", 3);
  const canDeleteTask_Benchmarking = hasPermission("benchmarking", 4);
  const canViewtask_Groups = hasPermission("task-groups", 1);
  const canEdittask_Groups = hasPermission("task-groups", 2);
  const canCreatetask_Groups = hasPermission("task-groups", 3);
  const canDeletetask_Groups = hasPermission("task-groups", 4);
  const canViewMy_Tasks = hasPermission("my-tasks", 1);
  const canEditMy_Tasks = hasPermission("my-tasks", 2);
  const canCreateMy_Tasks = hasPermission("my-tasks", 3);
  const canDeleteMy_Tasks = hasPermission("my-tasks", 4);
  const canViewHistorical_Tasks = hasPermission("historical-tasks", 1);
  const canEditHistorical_Tasks = hasPermission("historical-tasks", 2);
  const canCreateHistorical_Tasks = hasPermission("historical-tasks", 3);
  const canDeleteHistorical_Tasks = hasPermission("historical-tasks", 4);
  const canViewBenchmarks = hasPermission("benchmarks", 1);
  const canEditBenchmarks = hasPermission("benchmarks", 2);
  const canCreateBenchmarks = hasPermission("benchmarks", 3);
  const canDeleteBenchmarks = hasPermission("benchmarks", 4);
  const canViewAnalytics = hasPermission("analytics", 1);
  const canEditAnalytics = hasPermission("analytics", 2);
  const canCreateAnalytics = hasPermission("analytics", 3);
  const canDeleteAnalytics = hasPermission("analytics", 4); 
  const canViewOverdueReports = hasPermission("overdue-report", 1);
  const canEditOverdueReports = hasPermission("overdue-report", 2);
  const canCreateOverdueReports = hasPermission("overdue-report", 3);
  const canDeleteOverdueReports = hasPermission("overdue-report", 4);


  return {
    permissions,
    isLoading,
    hasPermission,
    getPermissionLevel,
    canViewSettings,
    canEditSettings,
    canCreateSettings,
    canDeleteSettings,
    canViewTask,
    canEditTask,
    canCreateTask,
    canDeleteTask,
    canViewDashboard,
    canEditDashboard,
    canCreateDashboard,
    canDeleteDashboard,
    canViewReports,
    canEditReports,
    canCreateReports,
    canDeleteReports,
    canViewUsers,
    canEditUsers,
    canCreateUsers,
    canDeleteUsers,
    canViewTeams,
    canEditTeams,
    canCreateTeams,
    canDeleteTeams,
    canViewRoles,
    canEditRoles,
    canCreateRoles,
    canDeleteRoles,
    canViewRolePermissions,
    canEditRolePermissions,
    canCreateRolePermissions,
    canDeleteRolePermissions,
    canViewOrganizationSettings,
    canEditOrganizationSettings,
    canCreateOrganizationSettings,
    canDeleteOrganizationSettings,

    canViewTask_Analytics,
    canEditTask_Analytics,
    canCreateTask_Analytics,
    canDeleteTask_Analytics,
    canViewTask_Benchmarking,
    canEditTask_Benchmarking,
    canCreateTask_Benchmarking,
    canDeleteTask_Benchmarking,
    canViewtask_Groups,
    canEdittask_Groups, 
    canCreatetask_Groups,
    canDeletetask_Groups,
    canViewMy_Tasks,
    canEditMy_Tasks,
    canCreateMy_Tasks,
    canDeleteMy_Tasks,
    canViewHistorical_Tasks,
    canEditHistorical_Tasks,
    canCreateHistorical_Tasks,
    canDeleteHistorical_Tasks,
    canViewBenchmarks,
    canEditBenchmarks,
    canCreateBenchmarks,
    canDeleteBenchmarks,
    canViewAnalytics,
    canEditAnalytics,
    canCreateAnalytics,
    canDeleteAnalytics,
    canViewOverdueReports,
    canEditOverdueReports,
    canCreateOverdueReports,
    canDeleteOverdueReports,

  };
}
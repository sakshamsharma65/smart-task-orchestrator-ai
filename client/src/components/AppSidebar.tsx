import React from "react";
import { useLocation } from "react-router-dom";
import { useCurrentUserRoleAndTeams } from "@/hooks/useCurrentUserRoleAndTeams"; // Keep for teams data
import DashboardMenu from "./AppSidebarParts/DashboardMenu";
import TaskManagementMenu from "./AppSidebarParts/TaskManagementMenu";
import SidebarHeader from "./AppSidebarParts/SidebarHeader";
import ManagementMenu from "./AppSidebarParts/ManagementMenu";
import ReportsMenu from "./AppSidebarParts/ReportsMenu";
import WarningNoTeams from "./AppSidebarParts/WarningNoTeams";

// ✅ Import the new context hook
import { useRole } from "@/contexts/RoleProvider"; 

export default function AppSidebar() {
  const location = useLocation();
  const { teams, loading: teamsLoading } = useCurrentUserRoleAndTeams();
  
  // ✅ Use the new Role Context
  const { can, highestRole, loading: roleLoading } = useRole();

  // Combined loading state to prevent flickering
  if (roleLoading) return null; // Or a skeleton loader

  // Teams logic for warning (Existing logic)
  const isOnTeams = location.pathname.startsWith("/admin/teams");
  const hasTeams = teams.length > 0;

  // ✅ Check Section Visibility
  // You only show the Management Menu if the user can view at least one of these resources
  const showManagementSection = 
    can("user-management", "view") || 
    can("team-management", "view") || 
    can("roles-privileges", "view");

  const showReportsSection = 
    can("task-report", "view") || 
    can("overdue-report", "view") || 
    can("analytics-report", "view");

  return (
    <div 
      className="w-64 flex flex-col h-full bg-sidebar text-sidebar-foreground"
      style={{ 
        backgroundColor: '#f8fafc', 
        borderRight: '1px solid #e2e8f0'
      }}
    >
      {/* Header section */}
      <div 
        className="hidden lg:flex items-center px-6 border-b border-gray-200 bg-[#66655833]" 
        style={{ height: '56px', minHeight: '56px', maxHeight: '56px' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">#</span>
          </div>
          <span className="text-lg font-semibold text-gray-800">
            TaskRep
          </span>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto px-2 py-4 bg-[#e3e2de] lg:pt-4 pt-6" style={{ paddingTop: '16px' }}>
        <div className="space-y-2">
          
          {/* Dashboard is usually visible to everyone, but you can gate it if needed */}
          <DashboardMenu collapsed={false} />

          {/* Task Management */}
          {can("tasks", "view") && (
            <TaskManagementMenu collapsed={false} />
          )}

          {/* ✅ Management Menu: Conditionally Rendered */}
          {showManagementSection && (
            <ManagementMenu 
              collapsed={false} 
              // We pass 'can' down so the menu knows which specific links to hide,
              // OR better yet, let ManagementMenu call useRole() itself.
            />
          )}

          {/* Warning Component */}
          <WarningNoTeams 
            isOnTeams={isOnTeams} 
            loading={teamsLoading} 
            isUserOnly={highestRole === "user"} 
            hasTeams={hasTeams} 
          />

          {/* ✅ Reports Menu: Conditionally Rendered */}
          {showReportsSection && (
            <ReportsMenu collapsed={false} />
          )}
          
        </div>
      </div>
    </div>
  );
}
import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { useCurrentUserRoleAndTeams } from "@/hooks/useCurrentUserRoleAndTeams";
import { ChevronDown, ChevronRight, LayoutDashboard, ClipboardList, Settings, BarChart3, ShieldCheck, FolderKanban } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
// Sub-menu components
import DashboardMenu from "./AppSidebarParts/DashboardMenu";
import TaskManagementMenu from "./AppSidebarParts/TaskManagementMenu";
import ManagementMenu from "./AppSidebarParts/ManagementMenu";
import ReportsMenu from "./AppSidebarParts/ReportsMenu";
import WarningNoTeams from "./AppSidebarParts/WarningNoTeams";
import GovernanceMenu from "./AppSidebarParts/GovernanceMenu";
import ProjectManagementMenu from "./AppSidebarParts/ProjectManagementMenu";

// 1. Helper Component (Isse bahar rakha hai taaki performance achi rahe)
const CollapsibleSection = ({ title, children, icon: Icon }) => {
  const [isOpen, setIsOpen] = useState(false); // Default: Closed

  return (
    <div className="mb-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-white/50 rounded-lg transition-all duration-200"
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon size={18} className="text-gray-500" />}
          <span className="font-semibold">{title}</span>
        </div>
        {isOpen ? (
          <ChevronDown size={14} className="text-gray-400" />
        ) : (
          <ChevronRight size={14} className="text-gray-400" />
        )}
      </button>

      {/* Dropdown Content */}
      {isOpen && (
        <div className="mt-1 ml-4 pl-3 border-l-2 border-gray-300/50 space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
          {children}
        </div>
      )}
    </div>
  );
};

// 2. Main Sidebar Component
export default function AppSidebar() {
  const location = useLocation();
  const { roles, teams, loading } = useCurrentUserRoleAndTeams();

  const { data: settings } = useQuery({
    queryKey: ["/api/organization-settings"],
    queryFn: () => apiClient.get("/organization-settings"),
  });
  const isAdmin = roles.includes("admin");
  const isManager = roles.includes("manager") || roles.includes("team_manager");
  const isUserOnly = !isAdmin && !isManager && roles.includes("user");
  const projectManagementEnabled = settings?.project_management_enabled ?? false;

  const isOnTeams = location.pathname.startsWith("/teams");
  const hasTeams = teams.length > 0;

  return (
    <div className="w-64 flex flex-col h-full bg-[#f8fafc] border-r border-[#e2e8f0]">
      
      {/* Logo Header */}
      <div className="hidden lg:flex items-center px-6 border-b border-gray-200 bg-[#66655833] h-[56px] min-h-[56px]">
        <img src="/tazq-logo-blue.png" alt="Logo" className="w-16" />
      </div>

      {/* Menu Sections */}
      <div className="flex-1 overflow-auto px-2 py-4 bg-[#e3e2de] lg:pt-4 pt-6">
        <div className="space-y-2">
          
          <CollapsibleSection title="Dashboard" icon={LayoutDashboard}>
            <DashboardMenu isUserOnly={isUserOnly} collapsed={false} />
          </CollapsibleSection>

          <CollapsibleSection title="Tasks" icon={ClipboardList}>
            <TaskManagementMenu collapsed={false} />
          </CollapsibleSection>

          <CollapsibleSection title="Management" icon={Settings}>
            <ManagementMenu isAdmin={isAdmin} isManager={isManager} collapsed={false} />
          </CollapsibleSection>
{projectManagementEnabled && (
  <CollapsibleSection
    title="Project Management"
    icon={FolderKanban}
  >
    <ProjectManagementMenu collapsed={false} />
  </CollapsibleSection>
)}
          <WarningNoTeams isOnTeams={isOnTeams} loading={loading} isUserOnly={isUserOnly} hasTeams={hasTeams} />

          <CollapsibleSection title="Reports" icon={BarChart3}>
            <ReportsMenu isUserOnly={isUserOnly} collapsed={false} />
          </CollapsibleSection>

          <CollapsibleSection title="Governance" icon={ShieldCheck}>
            <GovernanceMenu collapsed={false} />
          </CollapsibleSection>

        </div>
      </div>
    </div>
  );
}
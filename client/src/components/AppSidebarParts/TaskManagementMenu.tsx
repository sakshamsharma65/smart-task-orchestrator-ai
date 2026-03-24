
import React from "react";
import { useLocation, NavLink } from "react-router-dom";
import { CheckSquare, FolderOpen, User, History, Clock, Target } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { useRolePermissions } from "@/hooks/useRolePermissions";

export default function TaskManagementMenu({ collapsed }: { collapsed: boolean }) {
  const location = useLocation();
  const { canViewTask,canViewtask_Groups,canViewMy_Tasks,canViewHistorical_Tasks,canViewBenchmarks } = useRolePermissions();
  
  // Fetch organization settings to check if benchmarking is enabled
  const { data: settings } = useQuery({
    queryKey: ['/api/organization-settings'],
    queryFn: async () => {
      const response = await apiClient.get('/organization-settings');
      return response;
    }
  });
  
  return (
    <div>
      {/* <div className="text-xs font-semibold uppercase tracking-wider mb-2 px-2 text-[#021133]">Task Management</div> */}
      <div>
        <ul className="flex w-full min-w-0 flex-col gap-1">
          {canViewTask&&<li className="group/menu-item relative">
            <NavLink
              to="/tasks"
              end
              className={({ isActive }) =>
                "flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none transition-[width,height,padding] hover:bg-gray-100 focus-visible:ring-2 " +
                (isActive ? "bg-gray-100 font-medium" : "")
              }
            >
              <CheckSquare className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="truncate">Tasks</span>}
            </NavLink>
          </li>}
         {canViewtask_Groups && <li className="group/menu-item relative">
            <NavLink
              to="/task-groups"
              end
              className={({ isActive }) =>
                "flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none transition-[width,height,padding] hover:bg-gray-100 focus-visible:ring-2 " +
                (isActive ? "bg-gray-100 font-medium" : "")
              }
            >
              <FolderOpen className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="truncate">Task Groups</span>}
            </NavLink>
          </li>}
          {canViewMy_Tasks && <li className="group/menu-item relative">
            <NavLink
              to="/my-tasks"
              end
              className={({ isActive }) =>
                "flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none transition-[width,height,padding] hover:bg-gray-100 focus-visible:ring-2 " +
                (isActive ? "bg-gray-100 font-medium" : "")
              }
            >
              <User className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="truncate">My Tasks</span>}
            </NavLink>
          </li>}
      {canViewHistorical_Tasks &&    <li className="group/menu-item relative">
            <NavLink
              to="/historical-tasks"
              end
              className={({ isActive }) =>
                "flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none transition-[width,height,padding] hover:bg-gray-100 focus-visible:ring-2 " +
                (isActive ? "bg-gray-100 font-medium" : "")
              }
            >
              <History className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="truncate">Historical Tasks</span>}
            </NavLink>
          </li>}
          {  canViewBenchmarks && settings?.benchmarking_enabled && (
           <li className="group/menu-item relative">
              <NavLink
                to="/benchmarking"
                end
                className={({ isActive }) =>
                  "flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none transition-[width,height,padding] hover:bg-gray-100 focus-visible:ring-2 " +
                  (isActive ? "bg-gray-100 font-medium" : "")
                }
              >
                <Target className="w-4 h-4 shrink-0" />
                {!collapsed && <span className="truncate">Benchmarking</span>}
              </NavLink>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

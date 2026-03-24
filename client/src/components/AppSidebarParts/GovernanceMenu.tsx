import React from 'react'
import { useLocation } from 'react-router-dom';
import { NavLink } from 'react-router-dom';
import { Home } from 'lucide-react';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { FileText, AlertTriangle, Settings, BarChart3, TrendingUp } from "lucide-react";
import { i } from 'node_modules/vite/dist/node/types.d-aGj9QkWt';



const GovernanceMenu = ({  collapsed }: {  collapsed: boolean }) => {
  const location = useLocation();
    const { canViewSettings } = useRolePermissions();
 
  return (
    <div>

      <div>
        <ul className="flex w-full min-w-0 flex-col gap-1">
        
          {canViewSettings && (
            <li className="group/menu-item relative">
              <NavLink
                to="/settings"
                end
                className={({ isActive }) =>
                  "flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none transition-[width,height,padding] hover:bg-gray-100 focus-visible:ring-2 " +
                  (isActive ? "bg-gray-100 font-medium" : "")
                }
              >
                <Settings className="w-4 h-4 shrink-0" />
                {!collapsed && <span className="truncate">Settings</span>}
              </NavLink>
            </li>
            
          )}
          <li>
            <NavLink
              to="/activity-log"
              end
              className={({ isActive }) =>
                "flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none transition-[width,height,padding] hover:bg-gray-100 focus-visible:ring-2 " +
                (isActive ? "bg-gray-100 font-medium" : "")
              }
            >
              <FileText className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="truncate">Activity Log</span>}
            </NavLink>
          </li>

        </ul>
      </div>
    </div>
  );
}

export default GovernanceMenu

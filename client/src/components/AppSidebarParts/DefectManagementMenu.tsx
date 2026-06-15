import React from "react";
import { NavLink } from "react-router-dom";
import { Bug, Kanban, ClipboardList } from "lucide-react";

export default function DefectManagementMenu({
  collapsed,
}: {
  collapsed: boolean;
}) {
  const links = [
    { to: "/defects", label: "Defects", icon: Bug },
    { to: "/defects/board", label: "Defect Board", icon: Kanban },
    { to: "/defects/my", label: "My Defects", icon: ClipboardList },
  ];

  return (
    <div>
      <div>
        <ul className="flex w-full min-w-0 flex-col gap-1">
          {links.map(({ to, label, icon: Icon }) => (
            <li key={to} className="group/menu-item relative">
              <NavLink
                to={to}
                end
                className={({ isActive }) =>
                  "flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none transition-[width,height,padding] hover:bg-gray-100 focus-visible:ring-2 " +
                  (isActive ? "bg-gray-100 font-medium" : "")
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && (
                  <span className="truncate">{label}</span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
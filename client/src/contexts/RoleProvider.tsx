import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

// ✅ Priority Configuration
const ROLE_PRIORITY = ["admin", "manager", "team_manager", "user"] as const;
type HighestRole = typeof ROLE_PRIORITY[number] | null;

// ✅ New Type Definitions for Permissions
type PermissionMap = Record<string, number>; // e.g. { 'tasks': 4, 'settings': 0 }

type RoleContextType = {
  highestRole: HighestRole;
  userName: string;
  loading: boolean;
  permissions: PermissionMap;
  can: (resource: string, action: 'view' | 'edit' | 'create' | 'delete') => boolean;
};

// ✅ Context with safer defaults
const RoleContext = createContext<RoleContextType>({
  highestRole: null,
  userName: "",
  loading: true,
  permissions: {},
  can: () => false,
});

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [highestRole, setHighestRole] = useState<HighestRole>(null);
  const [userName, setUserName] = useState<string>("");

  // --- 1. Fetch User Roles ---
  const { data: userRolesData = [], isLoading: rolesLoading } = useQuery({
    queryKey: ["/api/users", user?.id, "roles"],
    queryFn: () => apiClient.getUserRoles(user!.id),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  // --- 2. Fetch All Roles Definitions ---
  const { data: allRoles = [], isLoading: allRolesLoading } = useQuery({
    queryKey: ["/api/roles"],
    queryFn: () => apiClient.getRoles(),
    staleTime: 10 * 60 * 1000,
  });

  // --- 3. Determine Highest Role (Your existing logic) ---
  useEffect(() => {
    if (!user) {
      setHighestRole(null);
      setUserName("");
      return;
    }

    setUserName(user.user_name || user.email);

    if (!rolesLoading && !allRolesLoading) {
      const roleNames = userRolesData
        ?.map((ur: any) => {
          const role = allRoles.find((r: any) => r.id === ur.role_id);
          return role?.name || null;
        })
        .filter(Boolean);

      let found: HighestRole = null;

      for (const candidate of ROLE_PRIORITY) {
        if (roleNames.includes(candidate)) {
          found = candidate;
          break;
        }
      }

      setHighestRole(found || "user");
    }
  }, [user, userRolesData, allRoles, rolesLoading, allRolesLoading]);

  // --- 4. Get ID of the Active Highest Role ---
  const activeRoleId = useMemo(() => {
    if (!highestRole || !allRoles.length) return null;
    return allRoles.find((r: any) => r.name === highestRole)?.id;
  }, [highestRole, allRoles]);

  // --- 5. Fetch Permissions for that Role ---
  const { data: rawPermissions = [], isLoading: permissionsLoading } = useQuery({
    queryKey: ["/api/roles", activeRoleId, "permissions"],
    queryFn: () => activeRoleId ? apiClient.getRolePermissions(activeRoleId) : Promise.resolve([]),
    enabled: !!activeRoleId,
    staleTime: 5 * 60 * 1000, 
  });

  // --- 6. Convert to Map for Fast Lookup ---
  const permissions = useMemo(() => {
    const map: PermissionMap = {};
    rawPermissions.forEach((p: any) => {
      map[p.resource] = p.permission_level;
    });
    return map;
  }, [rawPermissions]);

  // --- 7. The 'can' Helper Function ---
  type Action = "view" | "edit" | "create" | "delete";

const ACTION_TO_LEVEL: Record<Action, number> = {
  view: 1,
  edit: 2,
  create: 3,
  delete: 4,
};

const can = (resource: string, action: Action) => {
  // ✅ Admin override
  if (highestRole === "admin") return true;

  const level = permissions[resource] ?? 0; // 0 = hidden forever
  return level >= ACTION_TO_LEVEL[action];
};
  // ✅ Combine all loading states
  const totalLoading = rolesLoading || allRolesLoading || (!!activeRoleId && permissionsLoading);

  return (
    <RoleContext.Provider value={{ highestRole, userName, loading: totalLoading, permissions, can }}>
      {children}
    </RoleContext.Provider>
  );
};

export function useRole() {
  return useContext(RoleContext);
}
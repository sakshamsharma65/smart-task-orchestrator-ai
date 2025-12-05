import { storage } from "../storage";

export const PERMISSIONS = {
  NONE: 0,
  VIEW: 1,
  EDIT: 2,
  CREATE: 3,
  FULL: 4,
};

export function requirePermission(
  resource: string,
  level: number
) {
  return async (req: any, res: any, next: any) => {
    try {
      const userId = req.headers["x-user-id"];
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const userRoles = await storage.getUserRoles(userId);
      if (!userRoles.length) {
        return res.status(403).json({ error: "No role assigned" });
      }

      // Admin shortcut
      const allRoles = await storage.getAllRoles();
      const roleNames = userRoles.map(r => {
        const role = allRoles.find(ar => ar.id === r.role_id);
        return role?.name;
      });

      if (roleNames.includes("admin")) {
        return next();
      }

      // Check role_permissions table
      const permissions = await storage.getRolePermissions(userRoles[0].role_id);
      const permission = permissions.find(p => p.resource === resource);

      const currentLevel = permission?.permission_level ?? 0;

      if (currentLevel < level) {
        return res.status(403).json({
          error: "Access denied",
          resource,
          requiredLevel: level,
          currentLevel
        });
      }

      next();
    } catch (err) {
      console.error("Permission check failed:", err);
      res.status(500).json({ error: "Permission validation failed" });
    }
  };
}

import { useRole } from "@/contexts/RoleProvider";
interface PermissionGuardProps {
  resource: string;
  action?: 'view' | 'edit' | 'create' | 'delete'; // Defaults to 'view'
  fallback?: React.ReactNode; // What to show if access denied (optional)
  children: React.ReactNode;
}

export const PermissionGuard = ({ 
  resource, 
  action = 'view', 
  fallback = null, 
  children 
}: PermissionGuardProps) => {
  const { can, loading } = useRole();

  if (loading) return null; // Or a skeleton

  if (!can(resource, action)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
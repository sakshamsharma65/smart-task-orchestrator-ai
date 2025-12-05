import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";

interface Role {
  id: string;
  name: string;
  description?: string;
}

export function useRoles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRoles() {
      try {
        const result = await apiClient.getRoles();
        setRoles(result);
      } catch (err: any) {
        setError(err.message || "Failed to fetch roles");
      } finally {
        setLoading(false);
      }
    }

    fetchRoles();
  }, []);

  return { roles, loading, error };
}

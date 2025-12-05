import { useEffect, useState, useCallback } from "react";
import { apiClient } from "@/lib/api";

export interface SimpleUser {
  id: string;
  user_name?: string | null;
  email: string;
}

export function useUserList() {
  const [users, setUsers] = useState<SimpleUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.getUsers();
      setUsers(data || []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setUsers([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return { users, loading, refetch: fetchUsers };
}

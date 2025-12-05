
import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api";

interface Department {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Hook to fetch departments from the API.
 */
export function useDepartments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/departments');
      setDepartments(response);
    } catch (error) {
      console.error("Error fetching departments:", error);
      // Fallback to default departments if API fails
      const defaultDepartments = [
        {
          id: "1",
          name: "Administration",
          description: "Administrative department",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "2", 
          name: "Engineering",
          description: "Engineering department",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "3",
          name: "Marketing",
          description: "Marketing department", 
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ];
      setDepartments(defaultDepartments);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  return { 
    departments, 
    loading, 
    refetch: fetchDepartments 
  };
}

// Assuming you have access to useQuery and apiRequest

import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient"; // Adjust path as needed

interface UserName {
  id: string;
  name: string;
}

export const useUserDisplayNames = () => {
  const { data, isLoading, error } = useQuery<UserName[]>({
    queryKey: ['/api/usersName'],
    queryFn: () => apiRequest("/api/usersName"),
    enabled: true,
  });

  // Transform the array into a map for easy lookup: { 'user-id': 'User Name' }
  const usersMap = (data || []).reduce<Record<string, string>>((acc, user) => {
    // Use the name, or fall back to a shortened ID if the name is empty/null
    acc[user.id] = user.name && user.name.trim() !== "" ? user.name : user.id.slice(0, 8);
    return acc;
  }, {});

  return { usersMap, isLoading, error };
};
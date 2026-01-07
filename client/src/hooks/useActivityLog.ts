import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useActivityLog(limit = 50, offset = 0) {
  return useQuery({
    queryKey: ["activity-log", limit, offset],
    queryFn: async () => {
      const res = await apiRequest(`/api/activity-log?limit=${limit}&offset=${offset}`);
      return res;
    },
  });
}

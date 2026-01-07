import React, { useEffect } from "react";
import { useActivityLog } from "@/hooks/useActivityLog";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { useUserDisplayNames } from "@/hooks/useUserDisplayNames";
import { useQueryClient } from "@tanstack/react-query";
import {useState,useMemo} from "react";


export default function ActivityLogPage() {
  
  const { data, isLoading } = useActivityLog(50, 0);
  const { usersMap } = useUserDisplayNames();
  const [searchTerm,setSearchTerm]= useState("");
   const filteredLogs = useMemo(() => {
  if (!data) return [];

  const query = searchTerm.toLowerCase();

  return data.filter((log: any) => {
    const summary = log.summary || {};

    const searchableText = [
      log.event_type,
      log.source_table,
      summary.title,
      summary.user_name,
      summary.email,
      usersMap?.[log.performed_by],
      usersMap?.[summary.assigned_to],
      JSON.stringify(summary) // fallback for anything extra
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(query);
  });
}, [data, searchTerm, usersMap]);




  // Get the query client instance
  const queryClient = useQueryClient();
    useEffect(() => {
  queryClient.invalidateQueries({ queryKey: ["activity-log"] });
}, []);
function renderSummary(log: any) {
  const s = log.summary || {};

  // ===== USERS =====
  if (log.source_table === "users") {
    switch (log.event_type) {
      case "CREATED_USER":
        return <>User {s.user_name}  was created in {s.department} by {usersMap?.[log.performed_by] || "Unknown User"}.</>;

      case "DELETED":
        return <>User {s.user_name} from {s.department} was deleted by {usersMap?.[log.performed_by] || "Unknown User"} (Tasks: {s.tasks_assigned_count}).</>;

      case "ACTIVATED":
        return <>User {s.user_name}  was activated by {usersMap?.[log.performed_by] || "Unknown User"}.</>;

      case "DEACTIVATED":
        return <>User {s.user_name}  was deactivated by {usersMap?.[log.performed_by] || "Unknown User"}.</>;
    }
  }

  // ===== USER ROLES =====
  if (log.source_table === "user_roles") {
    if (log.event_type === "ROLE_CHANGED") {
      return <>Role of {s.user_name} changed from {s.roles_before?.join(", ") || "None"} to {s.roles_after?.join(", ")} by {usersMap?.[log.performed_by] || "Unknown User"}.</>;
    }

    if (log.event_type === "ROLE_REMOVED") {
      return <>Role {s.role_removed} was removed by {usersMap?.[log.performed_by] || "Unknown User"}.</>;
    }
  }

  // ===== TASKS =====
  if (log.source_table === "tasks") {
    switch (log.event_type) {
      case "CREATED_TASK":
        return <>Task “{s.title || "Unknown task"}” was created and assigned to {usersMap?.[s.assigned_to] || "Unassigned"} by {usersMap?.[log.performed_by] || "Unknown User"}.</>;

      case "DELETED_TASK":
        return <>Task “{s.title || "Unknown task"}” was deleted by {usersMap?.[log.performed_by] || "Unknown User"}.</>;

      case "STATUS_CHANGED":
        return <>Status of task “{s.title || "Unknown task"}” was changed from "{s.old_value}" to "{s.new_value}" by {usersMap?.[log.performed_by] || "Unknown User"}.</>;

      case "ASSIGNMENT_CHANGED":
        return <>Task “{s.title || "Unknown task"}” was reassigned from {s.old_value || "Unassigned"} to {s.new_value || "Unassigned"} by {usersMap?.[log.performed_by] || "Unknown User"}.</>;

      default:
        return <>Task “{s.title || "Unknown task"}” had action {log.event_type} performed by {usersMap?.[log.performed_by] || "Unknown User"}.</>;
    }
  }

  // ===== TEAMS =====
  if (log.source_table === "teams") {
    return <>Team “{s.name}” was updated by {usersMap?.[log.performed_by] || "Unknown User"}.</>;
  }

  // ===== TEAM MEMBERS =====
  if (log.source_table === "team_members") {
    if (s.added_user_name) {
      return <>User {s.added_user_name} was added to team “{s.team_name}” as {s.role_assigned} by {usersMap?.[log.performed_by] || "Unknown User"}.</>;
    }

    if (s.removed_user_name) {
      return <>User {s.removed_user_name} was removed from team “{s.team_name}” by {usersMap?.[log.performed_by] || "Unknown User"}.</>;
    }
  }

  // ===== FALLBACK =====
  return <>No summary available.</>;
}

  // Refresh logs on page load
  

  if (isLoading) return <p>Loading...</p>;
  if (!data) return <p>No logs found</p>;

  return (
    <Card className="p-4">
      <CardHeader>
        <CardTitle>Activity Log</CardTitle>
      </CardHeader>

      <CardContent>
  <div className="mb-4">
  <input
    type="text"
    placeholder="Search by event, user, task, role..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
  />
</div>

        <div className="space-y-3">

          {filteredLogs.length === 0 && (
  <p className="text-sm text-gray-500 text-center">
    No activity matches your search
  </p>
)}

          {filteredLogs.map((log: any) => (
            <div key={log.id} className="border p-3 rounded-md bg-gray-50">
              <p>
                <strong>{log.event_type}</strong> 
                {/* <span className="text-blue-600">{log.source_table}</span> */}
              </p>

              <div className="text-sm bg-white p-2 rounded mt-2 border">
                 {renderSummary(log)}
              </div>

              <p className="text-xs text-gray-500 mt-1">
              
                {new Date(log.occurred_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

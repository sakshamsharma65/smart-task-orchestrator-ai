import React, { useEffect } from "react";
import { useActivityLog } from "@/hooks/useActivityLog";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { useUserDisplayNames } from "@/hooks/useUserDisplayNames";
import { useQueryClient } from "@tanstack/react-query";
import {useState,useMemo} from "react";
import { useQuery } from "@tanstack/react-query";
import {apiClient} from "@/lib/api";
import { Switch } from "@radix-ui/react-switch";
import { formatOrgDateTime } from "@/lib/dateUtils";


export default function ActivityLogPage() {
  const [selectedUser,setSelectedUser] = useState("");
  const [selectedActivity, setSelectedActivity] = useState("");
const [selectedDate, setSelectedDate] = useState("");

  const { data, isLoading } = useActivityLog(50, 0);
  const { usersMap } = useUserDisplayNames();

  const [searchTerm,setSearchTerm]= useState("");
   const clearFilters = () => {
    setSearchTerm("");
    setSelectedUser("");
    setSelectedActivity("");
    setSelectedDate("");
  };
   const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users"],
    queryFn: () => apiClient.getUsers(),
  });
    const activityTypes = useMemo(() => {
  if (!data) return [];

  const unique = new Set(data.map((log: any) => log.event_type));
  return Array.from(unique);
}, [data]);

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
      JSON.stringify(summary)
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch = searchableText.includes(query);

    const matchesUser =
      !selectedUser ||
      log.performed_by === selectedUser ||
      summary.assigned_to === selectedUser;

    const matchesActivity =
      !selectedActivity || log.event_type === selectedActivity;

    // DATE FILTER
    const matchesDate =
      !selectedDate ||
      new Date(log.occurred_at).toISOString().slice(0, 10) === selectedDate;

    return (
      matchesSearch &&
      matchesUser &&
      matchesActivity &&
      matchesDate
    );
  });
}, [
  data,
  searchTerm,
  usersMap,
  selectedUser,
  selectedActivity,
  selectedDate
]);

  // Get the query client instance
  const queryClient = useQueryClient();
    useEffect(() => {
  queryClient.invalidateQueries({ queryKey: ["activity-log"] });
}, []);
function renderSummary(log: any) {
  const s = log.summary || {};
  const taskTitle = s.title || s.task_title || s.name || "Unknown task";

  // ===== USERS =====
  if (log.source_table === "users") {
    switch (log.event_type) {
      case "CREATED_USER":
        return <>User {s.user_name}  was created in {s.department} by {usersMap?.[log.performed_by] || "Unknown User"}.</>;

      case "DELETED_USER":
        return <>User {s.user_name} from {s.department} was deleted by {usersMap?.[log.performed_by] || "Unknown User"}</>;
        // (Tasks: {s.tasks_assigned_count})

      case "ACTIVATED":
        return <>User {s.user_name}  was activated by {usersMap?.[log.performed_by] || "Unknown User"}.</>;

      case "DEACTIVATED":
        return <>User {s.user_name}  was deactivated by {usersMap?.[log.performed_by] || "Unknown User"}.</>;
        case "PASSWORD_RESET":
        return <>Password for user {s.user_name} was reset by {usersMap?.[log.performed_by] || "Unknown User"}.</>;
    }
  }

  // ===== USER ROLES =====
  if (log.source_table === "user_roles") {
    if (log.event_type === "ROLE_CHANGED") {
      return <>Role of {s.user_name} changed from {s.roles_before?.join(", ") || "None"} to {s.roles_after?.join(", ")} by {usersMap?.[log.performed_by] || "Unknown User"}.</>;
    }
    if (log.event_type === "ROLE_ADDED") {
      return <>Role {s.role_id} was assigned to {s.user_name} by {usersMap?.[log.performed_by] || "Unknown User"}.</>;
    }
    if (log.event_type === "ROLE_REMOVED") {
      return <>Role {s.role_removed} was removed by {usersMap?.[log.performed_by] || "Unknown User"}.</>;
    }
  }
  if(log.source_table === "projects"){
    switch(log.event_type){
      case "PROJECT_CREATED":
        return <>Project "{s.name}" was created by {usersMap?.[log.performed_by] || "Unknown User"}.</>;
    
    case "PROJECT_MEMBER_ADDED":
      return <>User {s.added_user_name} was added to project "{s.project_name}" as {s.role_assigned} by {usersMap?.[log.performed_by] || "Unknown User"}.</>;}
    
  }


  // ===== TASKS =====
  if (log.source_table === "tasks") {
    switch (log.event_type) {
      case "CREATED_TASK":
        return <>Task “{taskTitle}” was created and assigned to {usersMap?.[s.assigned_to] || "Unassigned"} by {usersMap?.[log.performed_by] || "Unknown User"}.</>;

      case "DELETED_TASK":
        return <>Task “{taskTitle}” was deleted by {usersMap?.[log.performed_by] || "Unknown User"}.</>;

      case "STATUS_CHANGED":
        return <>Status of task “{taskTitle}” was changed from "{s.old_value}" to "{s.new_value}" by {usersMap?.[log.performed_by] || "Unknown User"}.</>;

      case "ASSIGNMENT_CHANGED":
        return <>Task “{taskTitle}” was reassigned from {s.old_value || "Unassigned"} to {s.new_value || "Unassigned"} by {usersMap?.[log.performed_by] || "Unknown User"}.</>;
      case "PRIORITY_CHANGED":
        return <>Priority of task “{taskTitle}” was changed from "{s.old_value}" to "{s.new_value}" by {usersMap?.[log.performed_by] || usersMap?.[s.acted_by] || "Unknown User"}.</>;
      // default:
      //   return <>Task “{s.title || "Unknown task"}” had action {log.event_type} performed by {usersMap?.[log.performed_by] || "Unknown User"}.</>;
    }
  }

  // ===== TEAMS =====
  if (log.source_table === "teams") {
  switch (log.event_type) {
    case "CREATE":
      return <>Team “{s.name}” was created by {usersMap?.[log.performed_by] || "Unknown User"}.</>;      
    case "DELETE_TEAM":
      return <>Team “{s.name}” was deleted by {usersMap?.[log.performed_by] || "Unknown User"}.</>;
    case "UPDATE_TEAM":
      return <>Team “{s.name}” was updated by {usersMap?.[log.performed_by] || "Unknown User"}.</>;      
  }
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
        <CardTitle className="text-xl font-bold">Activity Log</CardTitle>
      </CardHeader>

      <CardContent>
  <div className="mb-4">
  <div className="mb-4 grid grid-cols-2 md:grid-cols-5 gap-2">

  {/* Search input */}
  <input
    type="text"
    placeholder="Search activity..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="px-3 py-2 border rounded-md"
  />

  {/* User dropdown */}
   <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="">All Users</option>

            {usersLoading && (
              <option disabled>Loading users...</option>
            )}

            {users.map((user: any) => (
              <option key={user.id} value={user.id}>
                {user.user_name || user.email}
              </option>
            ))}
         
          </select>

  {/* Activity dropdown */}
  <select
    value={selectedActivity}
    onChange={(e) => setSelectedActivity(e.target.value)}
    className="px-3 py-2 border rounded-md"
  >
    <option value="">All Activities</option>
    {activityTypes.map((activity: string) => (
      <option key={activity} value={activity}>
        {activity}
      </option>
    ))}
  </select>
<input
  type="date"
  value={selectedDate}
  onChange={(e) => setSelectedDate(e.target.value)}
  className="px-3 py-2 border rounded-md"
/>


 <button
            onClick={clearFilters}
            className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition"
          >
            Clear Filters
          </button>

</div>
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
              
                {formatOrgDateTime(log.occurred_at)}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

import React from "react";
import { format, addMinutes } from "date-fns";
import { TaskActivity } from "@/integrations/supabase/taskActivity";
import { useUserDisplayNames } from "@/hooks/useUserDisplayNames"; // Assuming this hook is correctly imported

// Define the type for the map returned by the hook
type UsersMap = Record<string, string>;

// --- Helper Functions (Defined outside the component) ---

const typeToColor = (type: string) =>
  type === "created"
    ? "bg-green-100 text-green-800"
    : type === "status_changed"
    ? "bg-blue-100 text-blue-800"
    : type === "assigned" || type === "assignment_changed"
    ? "bg-violet-100 text-violet-800"
    : type === "edit"
    ? "bg-yellow-100 text-yellow-800"
    : type.includes("timer_")
    ? "bg-orange-100 text-orange-800"
    : type === "priority_changed"
    ? "bg-red-100 text-red-800"
    : type === "due_date_changed"
    ? "bg-purple-100 text-purple-800"
    : type === "title_changed" || type === "description_changed"
    ? "bg-cyan-100 text-cyan-800"
    : type === "comment"
    ? "bg-indigo-100 text-indigo-800"
    : "bg-gray-100 text-gray-700";
const stripHTML = (html) => {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
};
// FIX: actionLabel must now accept usersMap as an argument
const actionLabel = (action: TaskActivity, usersMap: UsersMap) => {
  switch (action.action_type) {
    case "created":
      // Resolve the ID in new_value (which is assigned_to ID from the backend log)
      const assignedToId = action.new_value;
      const assignedToName = assignedToId 
        ? usersMap[assignedToId] || assignedToId.slice(0, 8) 
        : ""; // Fallback to ID snippet or empty
      
      // If a user ID was logged in new_value, display the resolved name
      return assignedToId && assignedToName
        ? `"Task created" and assigned to ${assignedToName}`
        : `"Task created ${action.new_value || ""}"`;

    case "status_changed":
      return `Status changed from "${action.old_value}" to "${action.new_value}"`;
      
    case "assigned":
    case "assignment_changed":
      // FIX: Use usersMap to resolve names for old_value and new_value
      const oldAssigneeId = action.old_value;
      const newAssigneeId = action.new_value;
      const oldAssignee = oldAssigneeId 
        ? usersMap[oldAssigneeId] || "Unassigned" 
        : "Unassigned";
      const newAssignee = newAssigneeId 
        ? usersMap[newAssigneeId] || "Unassigned" 
        : "Unassigned";

      return `Assigned from "${action.old_value}" to "${action.new_value}"`;
      
    case "priority_changed":
      return `Priority changed from "${action.old_value}" to "${action.new_value}"`;
    case "due_date_changed":
      return `Due date changed from "${action.old_value}" to "${action.new_value}"`;
    case "title_changed":
      return `Title changed from "${action.old_value}" to "${action.new_value}"`;
   case "description_changed":
  return `Description changed from "${stripHTML(action.old_value)}" to "${stripHTML(action.new_value)}"`;
    case "timer_started":
      return "Timer started";
    case "timer_paused":
      return "Timer paused";
    case "timer_stopped":
      return "Timer stopped";
    case "edit":
      {
        const fieldMatch = action.old_value?.split(":")[0] || "Field";
        const oldV = action.old_value?.split(":")[1] ?? "";
        const newV = action.new_value?.split(":")[1] ?? "";
        const pretty = (
          fieldMatch === "title" ? "Title"
          : fieldMatch === "description" ? "Description"
          : fieldMatch === "priority" ? "Priority"
          : fieldMatch === "due_date" ? "Due Date"
          : fieldMatch === "status" ? "Status"
          : fieldMatch === "estimated_hours" ? "Estimated Hours"
          : fieldMatch === "actual_completion_date" ? "Completion Date"
          : fieldMatch
        );
        return `${pretty} changed from "${oldV}" to "${newV}"`;
      }
    case "comment":
      return action.new_value ? `Comment: "${action.new_value}"` : "Comment added";
    default:
      return action.new_value || `Unknown action: ${action.action_type}`;
  }
};

// --- Component Definition ---

type Props = {
  activity: TaskActivity[];
  usersById?: Record<string, { id: string; name: string | null }>;
};

const TaskActivityTimeline: React.FC<Props> = ({ activity, usersById }) => {
  // FIX 1: Call the hook inside the component
  const { usersMap, isLoading: usersLoading } = useUserDisplayNames();

  if (usersLoading) {
    return <div className="p-4 text-center text-muted-foreground">Loading activity details...</div>;
  }
  
  return (
    <ol className="relative border-s pl-4 py-2 space-y-3 max-h-80 overflow-y-auto">
      {activity.map((act) => (
        <li key={act.id} className="mb-0">
          <div className="absolute -left-[9px] mt-1 w-3 h-3 rounded-full border-2 border-background shadow-sm 
          bg-white" />
          <div className={`ml-2 p-2 rounded-md shadow-sm ${typeToColor(act.action_type)}`}>
            <div className="text-xs mb-1">
              {new Date(act.created_at).toLocaleString("en-GB", { timeZone: "UTC" })}
            </div>
            <div className="text-sm">
              {/* FIX 2: Pass usersMap to actionLabel */}
              {actionLabel(act, usersMap)} by{" "} 
              <b>
                {/* Resolve acted_by name using usersMap first */}
                {usersMap[act.acted_by || ""] || usersById?.[act.acted_by || ""]?.name || "Unknown"}
              </b>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
};

export default TaskActivityTimeline;
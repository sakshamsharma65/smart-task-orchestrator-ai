import { insertTaskSchema } from "./shared/schema";

const payload = {
  title: "Test Task",
  description: null,
  status: "pending",
  priority: 3,
  start_date: "2025-07-16",
  due_date: null,
  type: "team",
  created_by: "52219779-166f-4d33-bc4e-1282cfc07174",
  assigned_to: "52219779-166f-4d33-bc4e-1282cfc07174",
  estimated_hours: null,
  team_id: null,
  project_id: null,
  milestone_id: null,
  feature_id: null,
  is_time_managed: false,
  todos_enabled: false,
  todo_group_id: null,
};

const rawBody = {
  ...payload,
  priority: payload.priority ? Number(payload.priority) : 2,
  estimated_hours: payload.estimated_hours ? Number(payload.estimated_hours) : null,
  is_time_managed: payload.is_time_managed === 'true',
  assigned_to: payload.assigned_to || null,
  dependencyTaskId: payload.dependencyTaskId || null,
  milestone_id: payload.milestone_id || null,
  feature_id: payload.feature_id || null,
  project_id: payload.project_id || null,
  todo_group_id: payload.todo_group_id || null,
  team_id: payload.team_id || null,
  todos_enabled: payload.todos_enabled === 'true'
};

try {
  const result = insertTaskSchema.parse(rawBody);
  console.log("Success!", result);
} catch (e) {
  console.log("Validation Error:", e.issues);
}

import React, { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRef } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { fetchTasks, Task } from "@/integrations/supabase/tasks";

import { toast } from "@/components/ui/use-toast";
import useSupabaseSession from "@/hooks/useSupabaseSession";
import { useTaskStatuses } from "@/hooks/useTaskStatuses";
import { fetchAssignableTaskGroups, assignTaskToGroup, TaskGroup } from "@/integrations/supabase/taskGroups";

import { useDependencyConstraintValidation } from "@/hooks/useDependencyConstraintValidation";
import { apiClient } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";

// Simulated quick user record
type User = { id: string; email: string; user_name: string | null; manager: string | null };
type Role = { name: string };


// HELPER: fetch roles for a given user id from API
async function fetchUserRolesFromSupabase(userId: string): Promise<string[]> {
  try {
    const userRoles = await apiClient.getUserRoles(userId);
    const roles = await apiClient.getRoles();
    const userRoleIds = userRoles.map((ur: any) => ur.role_id);
    return roles
      .filter((role: any) => userRoleIds.includes(role.id))
      .map((role: any) => role.name);
  } catch (error) {
    console.error("Failed to fetch user roles", error);
    return [];
  }
}

// Helper function to fetch users (now using API)
async function fetchUsersSupabase(): Promise<User[]> {
  try {
    return await apiClient.getUsers();
  } catch (error) {
    console.error("Failed to fetch users", error);
    return [];
  }
}

interface Props {
  onTaskCreated: () => void;
  children?: React.ReactNode;
  defaultAssignedTo?: string;
   defaultProjectId?: string;
  defaultMilestoneId?: string;
  defaultFeatureId?: string;
}

const initialForm = {
  title: "",
  description: "",
  start_date: "",
  due_date: "",
  priority: 2,
  status: "", // Will be set to default status from API
  type: "personal",
  estimated_hours: "",
  assigned_to: "",
  isSubTask: false,
  isDependent: false,
  dependencyTaskId: "",
  is_time_managed: false,
  todos_enabled: false,
};

const priorityOptions = [
  { value: 1, label: "High" },
  { value: 2, label: "Medium" },
  { value: 3, label: "Low" },
];

const typeOptions = [
  { value: "personal", label: "Personal" },
  { value: "team", label: "Team" },
];



const CreateTaskSheet: React.FC<Props> = ({
  onTaskCreated, children, defaultAssignedTo,
  defaultProjectId, defaultMilestoneId, defaultFeatureId,
}) => {
  const [open, setOpen] = useState(false);
  const [TimeEnabled, setTimeEnabled] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [creating, setCreating] = useState(false);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const { user, loading: sessionLoading } = useSupabaseSession();
  const { statuses, loading: statusLoading } = useTaskStatuses();
  const [taskGroups, setTaskGroups] = useState<TaskGroup[]>([]);
  const [showTimeInfoDialog, setShowTimeInfoDialog] = useState(false);
  const [selectedTaskGroup, setSelectedTaskGroup] = useState<string>("");
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [attachments,setAttachments] = useState<File[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(defaultProjectId ?? "");
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>(defaultMilestoneId ?? "");
  const [selectedFeatureId, setSelectedFeatureId] = useState<string>(defaultFeatureId ?? "");
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [milestonesList, setMilestonesList] = useState<any[]>([]);
  const [featuresList, setFeaturesList] = useState<any[]>([]);

  // const [form, setForm] = useState<{description: string;}>({ description: "",});
  const modules = {
  toolbar: [
    ["bold", "italic", "underline"],
    [{ color: [] }],
    [{ list: "ordered" }, { list: "bullet" }],
   
  ],
};


  

  // Add these lines for dependency selection and inline search:
  const [selectedDependencyTask, setSelectedDependencyTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Get user role: use fetched roles, fallback to email only if missing
  const [userRole, setUserRole] = useState<string>("user");
  useEffect(() => {
  if (form.start_date && form.due_date && form.estimated_hours) {
    const availableHours = calculateAvailableHours(form.start_date, form.due_date);
    const estimatedHours = Number(form.estimated_hours);

    if (estimatedHours > availableHours) {
      toast({
        title: "Warning",
        description: `Estimated hours exceed available hours (${availableHours} hrs).`,
        variant: "destructive",
      });
    }
  }
}, [form.estimated_hours, form.start_date, form.due_date]);
useEffect(() => {
  if (open && !statusLoading && statuses.length > 0) {
    const defaultStatus = statuses.find(s => s.is_default);
    if (defaultStatus) {
      setForm(prev => ({
        ...prev,
        status: defaultStatus.name
      }));
      console.log("[DEBUG] Default status applied:", defaultStatus.name);
    }
  }
}, [open, statuses, statusLoading]);

useEffect(() => {
  if (open) {
    resetForm();
  }

  if (user?.id) {
    fetchUserRolesFromSupabase(user.id).then(setUserRoles);
  }

  // Fetch tasks
  fetchTasks().then(setTasks);

  // Fetch teams
  apiClient
    .getTeams()
    .then((t) => {
      console.log("Teams:", t);
      setTeams(t);
    })
    .catch((err) => console.error("Failed to fetch teams:", err));

}, [open, user?.id]);

useEffect(() => {
  if (!selectedTeam) {
    setTeamMembers([]);
    return;
  }
 
  apiClient.getTeamMembers(selectedTeam).then((members) => {
    console.log("Team Members:", members);
    setTeamMembers(members);
  }).catch((err) => console.error("Failed to fetch team members:", err));

}, [selectedTeam]);


  // On open: fetch users and user roles afresh
  useEffect(() => {
    if (!open || !user?.id) return;
    // Fetch users
    fetchUsersSupabase().then((fetchedUsers) => {
      setUsers(fetchedUsers);
      console.log("[DEBUG] Users fetched:", fetchedUsers);
    });
    // Fetch roles for current user
    fetchUserRolesFromSupabase(user.id).then((roles) => {
      setUserRoles(roles);
      console.log("[DEBUG] Current user roles:", roles);
    });
    // Fetch tasks for subtasks/dependencies
    fetchTasks().then(setTasks)}, [open, user?.id]);
    
    // Fetch default status and set it in form
  //   fetch("/api/task-statuses/default")
  //     .then(res => res.json())
  //     .then(defaultStatus => {
  //       if (defaultStatus && defaultStatus.name) {
  //         setForm(f => ({ ...f, status: defaultStatus.name }));
  //         console.log("[DEBUG] Default status set:", defaultStatus.name);
  //       }
  //     })
      
  //     .catch(err => console.error("Failed to fetch default status:", err));
  // }, [open, user?.id]);

  // Get user role & update state on mount
useEffect(() => {
  if (form.start_date && form.due_date && form.estimated_hours) {
    const available = calculateAvailableHours(form.start_date, form.due_date);
    const estimated = Number(form.estimated_hours);

    if (estimated > available) {
      toast({
        title: "Warning: Limit Exceeded",
        description: `Only ${available} hours remaining in this period.`,
        variant: "destructive",
      });
    }
  }
}, [form.estimated_hours, form.start_date, form.due_date]);   
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
  useEffect(() => {
    if (!user) return;
    let roleType: string = "user";
    if (userRoles.includes("admin")) roleType = "admin";
    else if (userRoles.includes("manager") || userRoles.includes("team manager")) roleType = "manager";
    else if (user?.email?.includes("admin")) roleType = "admin";
    else if (user?.email?.includes("manager")) roleType = "manager";
    setUserRole(roleType);
    console.log("[DEBUG] Effective User Role:", roleType);
  }, [user, userRoles]);

  // NEW LOGIC: Type selection comes BEFORE assignee selection
  useEffect(() => {
    // When type or open changes...
    if (form.type === "personal" && user?.id) {
      setForm((f) => ({ ...f, assigned_to: user.id }));
    } else if (form.type === "team") {
      setForm((f) => ({ ...f, assigned_to: "" }));
    }
  }, [form.type, open, user?.id]);



            // Fetch projects for linkage
useEffect(() => {
  // Fetch projects for linkage
  fetch("/api/projects", { headers: { "x-user-id": user?.id ?? "" } })
    .then(res => res.ok ? res.json() : [])
    .then(data => setProjectsList(
      Array.isArray(data) ? data.filter((p: any) => p.is_confirmed) : []
    ))
    .catch(() => setProjectsList([]));
}, [open, user?.id]);

  // Fetch milestones and features when project changes
  useEffect(() => {
    if (!selectedProjectId || !user?.id) {
      setMilestonesList([]);
      setFeaturesList([]);

      if (!defaultMilestoneId) setSelectedMilestoneId("");
      if (!defaultFeatureId)  setSelectedFeatureId("");
      return;
    }
    const headers = { "x-user-id": user.id };
    fetch(`/api/projects/${selectedProjectId}/milestones`, { headers })
      .then(r => r.ok ? r.json() : [])
      .then(data => setMilestonesList(Array.isArray(data) ? data : []))
      .catch(() => setMilestonesList([]));
    fetch(`/api/projects/${selectedProjectId}/features`, { headers })
      .then(r => r.ok ? r.json() : [])
      .then(data => setFeaturesList(Array.isArray(data) ? data : []))
      .catch(() => setFeaturesList([]));
    if (selectedProjectId !== defaultProjectId) {
      setSelectedMilestoneId("");
      setSelectedFeatureId("");
    }
  }, [selectedProjectId, user?.id]);


    // When opened with a defaultProjectId, apply it immediately
  useEffect(() => {
    if (open && defaultProjectId) {
      setSelectedProjectId(defaultProjectId);
      if (defaultMilestoneId) setSelectedMilestoneId(defaultMilestoneId);
      if (defaultFeatureId)  setSelectedFeatureId(defaultFeatureId);
    }
  }, [open, defaultProjectId, defaultMilestoneId, defaultFeatureId]);


  // Core: Compute assignable users for create view, with debug logs
function getAssignableUsersForCreate() {
  if (!user) return [];
  let list: any[] = [];

  // PERSONAL MODE
  if (form.type === "personal") {
    return users.filter((u) => u.id === user.id);
  }

  // TEAM MODE
  if (form.type === "team") {
    if (!selectedTeam) return [];

    // Load members: this matches AdminTeams' structure
    list = teamMembers.map((m) => m.user);

    // 🔥 Role logic (matches AdminTeams)
    if (userRole === "admin") {
      return list; // admin sees all
    }

    if (userRole === "manager") {
      // Manager is also part of team; show all except themselves
      return list.filter((u) => u.id !== user.id);
    }

    if (userRole === "user") {
      // User should only see the team manager
      const mgr = teamMembers.find((m) => m.role_within_team === "manager");
      return mgr ? [mgr.user] : [];
    }
  }

  return list;
}
function calculateAvailableHours(startDate: string, dueDate: string): number {
  if (!startDate || !dueDate) return 0;

  const now = new Date();
  
  // Parse input dates (YYYY-MM-DD) as local time to avoid UTC shifts
  const [sYear, sMonth, sDay] = startDate.split('-').map(Number);
  const [dYear, dMonth, dDay] = dueDate.split('-').map(Number);
  
  const startSelection = new Date(sYear, sMonth - 1, sDay);
  const endSelection = new Date(dYear, dMonth - 1, dDay);

  // Set the endSelection to the very end of that day (23:59:59)
  endSelection.setHours(23, 59, 59, 999);

  let effectiveStart: Date;

  // Check if the selected start date is the same as the current calendar day
  const isToday = now.toDateString() === startSelection.toDateString();

  if (isToday) {
    // If today, available hours start from the CURRENT moment
    effectiveStart = now;
  } else {
    // If in the future, start from the beginning of that day
    effectiveStart = startSelection;
    effectiveStart.setHours(0, 0, 0, 0);
  }

  const diffMs = endSelection.getTime() - effectiveStart.getTime();
  
  if (diffMs < 0) return 0;

  // Convert to hours and round to 1 decimal place (e.g., 8.5)
  const available = diffMs / (1000 * 60 * 60);
  return parseFloat(available.toFixed(1));
}

// if(TimeEnabled){
//   toast({ title: "⏱ Time Tracking Enabled", 
//   description: "Please start timer once you begin working on this task.",
//   })
// }

  // Handle form changes (typed fix)
  
 const handleChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
) => {
  const { name, value, type } = e.target;

  if (type === "checkbox" && "checked" in e.target) {
    const checked = (e.target as HTMLInputElement).checked;

    // Trigger Dialog only when turning time management ON
    if (name === "is_time_managed" && checked) {
      setShowTimeInfoDialog(true);
    }

    setForm((f) => ({
      ...f,
      [name]: checked,
      ...(name === "isSubTask" && !checked ? {} : {}),
      ...(name === "isDependent" && !checked ? { dependencyTaskId: "" } : {}),
    }));
    
    // Sync the TimeEnabled state for the toast logic
    if (name === "is_time_managed") setTimeEnabled(checked);

  } else if (name === "priority") {
    setForm((f) => ({ ...f, [name]: Number(value) }));
  } else if (name === "status") {
    if (value === "Completed" && !canCompleteDependent()) return;
    setForm((f) => ({ ...f, status: value }));
  } else {
    setForm((f) => ({ ...f, [name]: value }));
  }
};
  const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1 MB

const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
];
const MAX_TOTAL_SIZE = 2 * 1024 * 1024; // 2 MB Total
const MAX_FILE_COUNT = 5;
  const quillRef = useRef<ReactQuill | null>(null);
const MAX_LENGTH = 200;
const handleKeyDown = (e: React.KeyboardEvent) => {
  const editor = quillRef.current?.getEditor();
  if (!editor) return;

  const length = editor.getLength() - 1;

  if (length >= MAX_LENGTH && e.key !== "Backspace" && e.key !== "Delete") {
    e.preventDefault();

    toast({
      title: "Character limit reached",
      description: `Maximum ${MAX_LENGTH} characters allowed`,
    });
  }
};

const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (!e.target.files) return;

  const newlySelectedFiles = Array.from(e.target.files);
  
  // 1. Check if adding these files exceeds the count of 5
  if (attachments.length + newlySelectedFiles.length > MAX_FILE_COUNT) {
    toast({
      title: "Limit Exceeded",
      description: `You can only attach up to ${MAX_FILE_COUNT} files per task.`,
      variant: "destructive",
    });
    e.target.value = ""; // Reset input
    return;
  }

  const validFiles: File[] = [];
  let potentialTotalSize = attachments.reduce((sum, f) => sum + f.size, 0);

  for (const file of newlySelectedFiles) {
    // Type validation
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: `${file.name} is not a supported format (PDF, JPG, PNG only).`,
        variant: "destructive",
      });
      continue;
    }

    // Individual size check (optional, but good for UX)
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: `${file.name} exceeds the 1MB individual limit.`,
        variant: "destructive",
      });
      continue;
    }

    // 2. Check cumulative total size (2MB)
    if (potentialTotalSize + file.size > MAX_TOTAL_SIZE) {
      toast({
        title: "Total size exceeded",
        description: "The total size of all attachments cannot exceed 2MB.",
        variant: "destructive",
      });
      break; // Stop adding more files if we hit the limit
    }

    potentialTotalSize += file.size;
    validFiles.push(file);
  }

  if (validFiles.length > 0) {
    setAttachments((prev) => [...prev, ...validFiles]);
  }

  e.target.value = ""; // Reset the input so the same file can be selected again if removed
};

    
 const removeAttachment = (index: number) => {
  setAttachments(prev =>
    prev.filter((_, i) => i !== index)
  );
};


  // In handleSubmit: assign to group if set and not empty
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // Basic Validations
  if (form.type === "team" && !form.assigned_to) {
    toast({
      title: "Assigned To Required",
      description: "Please select a user to assign the task to.",
      variant: "destructive",
    });
    return;
  }

  if (isDueDateBeforeStartDate()) {
    toast({
      title: "Invalid End Date",
      description: "End date cannot be before the start date.",
      variant: "destructive",
    });
    return;
  }
  

  setCreating(true);

  try {
    const myUserId = user?.id;
    if (!myUserId) throw new Error("No current user!");

    // 1. Create FormData Object
    const formData = new FormData();

    // 2. Append standard fields
    formData.append("title", form.title);
    formData.append("description", form.description);
    formData.append("status", form.status);
    formData.append("priority", String(form.priority));
    formData.append("start_date", form.start_date || "");
    formData.append("due_date", form.due_date || "");
    formData.append("type", form.type);
    formData.append("created_by", myUserId);
    formData.append("assigned_to", form.assigned_to || "");
    formData.append("estimated_hours", form.estimated_hours);
    formData.append("is_time_managed", String(form.is_time_managed));
    formData.append("todos_enabled", String(form.todos_enabled));
  
    console.log(" saksham Submitting status:", form.status);
      
    
    if (form.type === "team" && selectedTeam) {
      formData.append("team_id", selectedTeam);
    }

    // 3. Append Dependency logic if applicable
    if (form.isDependent && form.dependencyTaskId) {
      formData.append("dependencyTaskId", form.dependencyTaskId);
    }
if (selectedProjectId) {
  formData.append("project_id", selectedProjectId);
}

if (selectedMilestoneId) {
  formData.append("milestone_id", selectedMilestoneId);
}

if (selectedFeatureId) {
  formData.append("feature_id", selectedFeatureId);
}
    // 4. Append all attachments
    // The key "attachments" must match the Multer configuration: upload.array('attachments')
    attachments.forEach((file) => {
      formData.append("attachments", file);
    });
          const taskInput: any = {
        title: form.title,
        description: form.description,
        status: form.status,
        priority: form.priority,
        due_date: form.due_date || null,
        start_date: form.start_date || null,
        type: form.type,
        created_by: myUserId,
        assigned_to: form.assigned_to ? form.assigned_to : null,
        estimated_hours: form.estimated_hours ? Number(form.estimated_hours) : null,
        team_id: null,
        actual_completion_date: null,
        is_time_managed: form.is_time_managed || false,
        timer_state: 'stopped',
        time_spent_minutes: 0,
        timer_started_at: null,
        timer_session_data: null,
      };
const availableHours = calculateAvailableHours(form.start_date, form.due_date);
  const estimatedHours = Number(form.estimated_hours);
      //   if (selectedProjectId && !selectedMilestoneId) {
      //   throw new Error("A milestone is required when linking a task to a project.");
      // }
      // if (selectedMilestoneId && !selectedFeatureId) {
      //   throw new Error("A feature is required when a milestone is attached to a task.");
      // }

      // Project linkage fields
      if (selectedProjectId) taskInput.project_id = selectedProjectId;
        if (selectedMilestoneId) taskInput.milestone_id = selectedMilestoneId;
      if (selectedFeatureId) taskInput.feature_id = selectedFeatureId;

  if (estimatedHours > availableHours) {
    toast({
      title: "Estimated hours exceed allowed limit",
      description: `You only have ${availableHours} available hours between selected dates. Please enter estimated hours within this limit.`,
      variant: "destructive",
    });
    return;
  }
    // 5. Call the API using fetch (Since apiClient likely expects JSON)
    const response = await fetch("/api/tasks", {
      method: "POST",
      body: formData,
      headers: {
        "x-user-id": myUserId, // Auth header for your middleware
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create task");
    }

    const newTask = await response.json();

    // 6. Subtask logic (If it's a subtask, we still hit your task group helper)
    if (form.isSubTask && selectedTaskGroup) {
      await assignTaskToGroup({ 
        group_id: selectedTaskGroup, 
        task_id: newTask.id 
      });
    }

   
    
    toast({ title: "Task Created", description: form.title });

    // Refresh UI
    await queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
    await queryClient.invalidateQueries({ queryKey: ['overdue-tasks'] });
    await queryClient.invalidateQueries({ queryKey: ['analytics-tasks'] });
         if (selectedProjectId) {
        await queryClient.invalidateQueries({ queryKey: ['/api/projects', selectedProjectId, 'tasks'] });
      }

    resetForm();
    setAttachments([]); // Clear files state
    setOpen(false);
    onTaskCreated();
       setSelectedProjectId("");
    // Restore defaults if provided by caller, otherwise clear
    setSelectedProjectId(defaultProjectId ?? "");
    setSelectedMilestoneId(defaultMilestoneId ?? "");
    setSelectedFeatureId(defaultFeatureId ?? "");
    if (!defaultProjectId) {
      setMilestonesList([]);
      setFeaturesList([]);
    }

  } catch (err: any) {
    toast({ 
      title: "Failed to create task", 
      description: err.message, 
      variant: "destructive" 
    });
  } finally {
    setCreating(false);
  }
};

  // Compute selectable tasks for subtasks/dependencies
  const selectableTasks = tasks;

  // Enhanced filter for dependency search - include title, description, and assigned user
  const filteredTasks = tasks.filter(task => {
    const query = searchQuery.toLowerCase();
    const assignedUser = users.find(u => u.id === task.assigned_to);
    const assignedUserName = assignedUser?.user_name?.toLowerCase() || assignedUser?.email?.toLowerCase() || '';
    
    return task.title.toLowerCase().includes(query) ||
           task.description?.toLowerCase().includes(query) ||
           assignedUserName.includes(query) ||
           task.status?.toLowerCase().includes(query);
  });

  // Reset form
const resetForm = () => {
  const defaultStatus = statuses.find(s => s.is_default)?.name || "";
  setForm({
    ...initialForm,
    status: defaultStatus,
    // Maintain personal assignment if applicable
    assigned_to: initialForm.type === "personal" && user?.id ? user.id : ""
  });
  setSelectedDependencyTask(null);
  setSearchQuery("");
};
const handleDescriptionChange = (value: string) => {
  const editor = quillRef.current?.getEditor();
  if (!editor) return;

  const length = editor.getLength() - 1;

  if (length > MAX_LENGTH) {
    editor.deleteText(MAX_LENGTH, length); // truncate extra text

    toast({
      title: "Character limit exceeded",
      description: `Maximum ${MAX_LENGTH} characters allowed`,
    });
  }

  setForm((prev) => ({
    ...prev,
    description: editor.root.innerHTML,
  }));
};

  // Assigned To dropdown (unchanged, uses getAssignableUsersForCreate)
  const renderAssignedToInput = () => {
    if (form.type === "personal" && user?.id) {
      return (
        <Input
          type="text"
          value={user?.user_name || user?.email || user?.id}
          disabled
          readOnly
          className="w-full border rounded p-2 bg-muted/40"
        />
      );
    }
    const assignableUsers = getAssignableUsersForCreate();
    return (
      <select
        name="assigned_to"
        value={form.assigned_to}
        onChange={handleChange}
        className="w-full border rounded p-2 bg-white z-50"
        required={form.type === "team"}
      >
        <option value="" >Select a user</option>
        {assignableUsers.map((u) => (
          <option key={u.id} value={u.id} >
            {u.user_name ?? u.email}
          </option>
        ))}
      </select>
    );
  };

  // Fetch eligible task groups when subtask mode is toggled or type changes
// Fetch eligible task groups based on assigned user membership
useEffect(() => {
  if (!open || !form.isSubTask) return;
  if (!form.assigned_to) {
    setTaskGroups([]);
    return;
  }

  async function loadGroups() {
    try {
      // 1. Get all groups (already filtered by visibility in backend)
      const groups = await fetchAssignableTaskGroups();

      // 2. Get all group→user memberships
      const memberships = await apiClient.getTaskGroupMembers();

      const assignedUserId = form.assigned_to;

      // 3. Filter: only groups where assigned user is a member
      const filtered = groups.filter(g =>
        memberships.some(m => m.group_id === g.id && m.user_id === assignedUserId)
      );

      setTaskGroups(filtered);

      // 4. Reset selected if no longer valid
      if (!filtered.some(g => g.id === selectedTaskGroup)) {
        setSelectedTaskGroup("");
        
      }
    } catch (err) {
      console.error("Failed loading filtered task groups:", err);
      setTaskGroups([]);
    }
  }

  loadGroups();
}, [open, form.isSubTask, form.assigned_to]);

  const { data: settings } = useQuery({
    queryKey: ["/api/organization-settings"],
    queryFn: () => apiClient.get("/organization-settings"),
  });
  // --- (dependency validation hook) ---
      const projectManagementEnabled = settings?.project_management_enabled ?? false;
  const {
    isInvalidStartDate,
    canCompleteDependent,
    dependencyDueDate,
    loading: dependencyLoading,
  } = useDependencyConstraintValidation(form.isDependent ? form.dependencyTaskId : undefined);

  // --- NEW: Validate due_date >= start_date ---
  function isDueDateBeforeStartDate() {
    if (!form.start_date || !form.due_date) return false;
    return form.due_date < form.start_date;
  }

  // --- (dependency selection) ---
  // When dependency selected via dialog, update dependencyTaskId and remember the selected full task
  function handleDependencySelect(task: Task) {
    setSelectedDependencyTask(task);
    setForm(f => ({ ...f, dependencyTaskId: task.id }));
  }
  

  // --- UI ---
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {children ? (
          children
        ) : (
          <Button className="mb-6" variant="default">
            Add Task
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-[90vw] md:w-[70vw] lg:w-[50vw] lg:min-w-[800px] max-w-none overflow-y-auto">
        <form className="p-3 sm:p-6 space-y-4 sm:space-y-8" onSubmit={handleSubmit}>
          <SheetHeader className="space-y-2 sm:space-y-4 pb-4 sm:pb-6 border-b border-gray-200">
            <SheetTitle className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Create New Task</SheetTitle>
            <SheetDescription className="text-sm sm:text-base lg:text-lg text-gray-600">
              Fill in the details below to create a comprehensive task with all necessary information.
            </SheetDescription>
          </SheetHeader>
          {/* SECTION 1: BASIC INFORMATION */}
          <div className="space-y-3 sm:space-y-4">
            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
              <h3 className="text-sm sm:text-base font-medium text-gray-800 mb-3 flex items-center">
                <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-xs font-bold mr-2">1</span>
                Basic Information
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Task Title *</label>
                  <Input
                    name="title"
                    maxLength={50}
                    value={form.title}
                   onChange={(e) => {
      const value = e.target.value;

      if (value.length === 50) {
        toast({
          title: "Limit reached",
          description: "Maximum 50 characters allowed for task title.",
        });
      }

      handleChange(e);
    }}
                    required
                    placeholder="Enter a clear, descriptive task title"
                    className="text-base h-12"
                  />
                </div>
              
                
             <div className="md:col-span-2">
<label className="block text-sm font-semibold text-gray-700 mb-2">
  Description
</label>

<div className="overflow-hidden border">
<ReactQuill
  ref={quillRef}
  theme="snow"
  modules={modules}
  value={form.description}
  onKeyDown={handleKeyDown}
  onChange={handleDescriptionChange}
  className="text-base h-44 rounded-md"
/>
</div>

<p className="text-sm text-gray-500 mt-1">
  {(quillRef.current?.getEditor()?.getLength() || 1) - 1}/{MAX_LENGTH}
</p> 
 
</div>

              </div>
            </div>
          </div>
          
{/* Organization Todos Toggle */}
<div className="bg-white p-4 rounded-lg border border-gray-200">
  <label className="flex items-center cursor-pointer text-base font-medium text-gray-700">
    <input
      type="checkbox"
      name="todos_enabled"
      checked={form.todos_enabled}
      onChange={handleChange}
      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-3"
    />
    <span className="flex items-center">
      <span className="mr-2">✅</span>
      Enable Required Todos
    </span>
  </label>
  <p className="text-sm text-gray-500 mt-1 ml-8">
    If enabled, this task must pass all organization-defined todos before it can be completed.
  </p>
</div>
          {/* SECTION 2: TASK SETTINGS */}
          <div className="space-y-3 sm:space-y-4">
            <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
              <h3 className="text-sm sm:text-base font-medium text-gray-800 mb-3 flex items-center">
                <span className="bg-green-100 text-green-800 rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-xs font-bold mr-2">2</span>
                Task Settings
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Priority Level</label>
                  <select
                    name="priority"
                    value={form.priority}
                    onChange={handleChange}
                    className="w-full h-12 text-base border border-gray-300 rounded-lg px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {priorityOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
     <div>
    <label className="block text-sm font-semibold text-gray-700 mb-2">Initial Status *</label>
    <select
      name="status"
      value={form.status}
      disabled
      className="w-full h-12 text-base border border-gray-300 rounded-lg px-4 bg-gray-100 text-gray-500 cursor-not-allowed"
    >
      {statusLoading ? (
        <option>Loading statuses...</option>
      ) : (
        statuses
          .filter((status) => status.is_default)
          .map((status) => (
            <option key={status.id} value={status.name}>
              {status.name}
            </option>
          ))
      )}
    </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Estimated Hours <span className="text-red-500">*</span></label>
                  <Input
                    name="estimated_hours"
                    value={form.estimated_hours}
                    onChange={handleChange}
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="e.g., 8.5"
                    className="text-base h-12"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_time_managed"
                    name="is_time_managed"
                    checked={form.is_time_managed}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <label htmlFor="is_time_managed" className="text-sm font-medium text-gray-700">
                    Enable Time Tracking
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: TIMELINE */}
          <div className="space-y-3 sm:space-y-4">
            <div className="bg-purple-50 p-3 sm:p-4 rounded-lg">
              <h3 className="text-sm sm:text-base font-medium text-gray-800 mb-3 flex items-center">
                <span className="bg-purple-100 text-purple-800 rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-xs font-bold mr-2">3</span>
                Timeline & Scheduling
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date <span className="text-red-500">*</span></label>
                  <Input
                    name="start_date"
                    type="date"
                    value={form.start_date}
                    onChange={handleChange}
                    min={dependencyDueDate || undefined}
                    disabled={dependencyLoading}
                    className={`text-base h-12 ${
                      isInvalidStartDate(form.start_date)
                        ? "border-red-500 focus:ring-red-500"
                        : ""
                    }`}
                  />
                  {form.isDependent && form.dependencyTaskId && isInvalidStartDate(form.start_date) && (
                    <div className="text-sm text-red-600 mt-2 flex items-center">
                      <span className="mr-1">⚠️</span>
                      Start date must be on or after the dependency's due date ({dependencyDueDate})
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Expected End Date <span className="text-red-500">*</span></label>
                  <Input
                    name="due_date"
                    type="date"
                    value={form.due_date}
                    onChange={handleChange}
                    min={form.start_date || undefined}
                    disabled={!form.start_date}
                    className={`text-base h-12 ${
                      form.start_date && form.due_date && form.due_date < form.start_date
                        ? "border-red-500 focus:ring-red-500"
                        : "" }`
                  
                   }
                  />
                  {form.start_date && form.due_date && form.due_date < form.start_date && (
                    <div className="text-sm text-red-600 mt-2 flex items-center">
                      <span className="mr-1">⚠️</span>
                      End date must be on or after start date
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

     {/* SECTION 4: ASSIGNMENT */}
<div className="space-y-3 sm:space-y-4">
  <div className="bg-orange-50 p-3 sm:p-4 rounded-lg">
    <h3 className="text-sm sm:text-base font-medium text-gray-800 mb-3 flex items-center">
      <span className="bg-orange-100 text-orange-800 rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-xs font-bold mr-2">4</span>
      Assignment & Responsibility
    </h3>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">

      {/* Assignment Type */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Assignment Type</label>
        <select
          name="type"
          value={form.type}
          onChange={(e) => {
            handleChange(e);
            setSelectedTeam("");
            setForm((f) => ({ ...f, assigned_to: "" }));
          }}
          className="w-full h-12 text-base border rounded-lg px-4"
        >
          {typeOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Team dropdown (only if type = team) */}
      {form.type === "team" && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Select Team *</label>
          <select
            value={selectedTeam}
            onChange={(e) => {
              setSelectedTeam(e.target.value);
              setForm((f) => ({ ...f, assigned_to: "" }));
            }}
            className="w-full h-12 text-base border rounded-lg px-4"
          >
            <option value="">Select Team</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Assigned To — appears only when team is selected */}
      {(form.type !== "team" || selectedTeam) && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 required">Assigned To</label>

          {/* If type=team but NO selected team → show disabled message */}                   
          {form.type === "team" && !selectedTeam ? (
            <div
              className="w-full h-12 border rounded-lg bg-gray-200 text-gray-500 flex items-center justify-center cursor-not-allowed"
              onClick={() =>
                toast({
                  title: "Select team first",
                  description: "Please select a team before choosing a user.",
                  variant: "destructive",
                })
              }
            >
              Select Team First
            </div>
          ) : (
            renderAssignedToInput()
          )}
        </div>
      )}

    </div>
  </div>
</div>

          {/* SECTION 5: ADVANCED OPTIONS */}
          <div className="space-y-3 sm:space-y-4">
            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border-2 border-dashed border-gray-300">
              <h3 className="text-sm sm:text-base font-medium text-gray-800 mb-3 flex items-center">
                <span className="bg-gray-100 text-gray-800 rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-xs font-bold mr-2">5</span>
                Advanced Options
              </h3>
              
              <div className="space-y-4 sm:space-y-6">
                {/* Subtask Option */}
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <label className="flex items-center cursor-pointer text-base font-medium text-gray-700">
                    <input
                      type="checkbox"
                      name="isSubTask"
                      checked={form.isSubTask}
                      onChange={handleChange}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-3"
                    />
                    <span className="flex items-center">
                      <span className="mr-2">📋</span>
                      Add To Task Group
                    </span>
                  </label>
                  <p className="text-sm text-gray-500 mt-1 ml-8">This task will be grouped under a parent task collection</p>
                  
                {form.isSubTask && (
  <div className="mt-4 ml-8">
    <label className="block text-sm font-semibold text-gray-700 mb-2">
      Select Task Group
    </label>

    {/* If user has no groups */}
    {taskGroups.length === 0 ? (
      <div className="p-3 border border-red-300 bg-red-50 text-red-700 rounded-lg text-sm">
        ⚠️ No task groups associated with this user.
        <br />
        Please create a group or assign user to an existing one.
      </div>
    ) : (
      <select
        name="task_group"
        value={selectedTaskGroup}
        onChange={(e) => setSelectedTaskGroup(e.target.value)}
        className="w-full h-12 text-base border border-gray-300 rounded-lg px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        required={form.isSubTask}
      >
        <option value="">
          {form.type === "personal"
            ? "Select Task Group"
            : "Select Team Task Group"}
        </option>
        {taskGroups.map((g) => (
          <option key={g.id} value={g.id}>
            {g.name} ({g.visibility})
          </option>
        ))}
      </select>
    )}
  </div>
)}

                </div>

                {/* Dependency Option */}
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <label className="flex items-center cursor-pointer text-base font-medium text-gray-700">
                    <input
                      type="checkbox"
                      name="isDependent"
                      checked={form.isDependent}
                      onChange={handleChange}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-3"
                    />
                    <span className="flex items-center">
                      <span className="mr-2">🔗</span>
                      Add Task Dependency
                    </span>
                  </label>
                  <p className="text-sm text-gray-500 mt-1 ml-8">This task cannot start until another task is completed</p>
                  
                  {form.isDependent && (
                    <div className="mt-4 ml-8 space-y-3">
                      <label className="block text-sm font-semibold text-gray-700">Select Dependency Task</label>
                      {/* Inline Task Search */}
                      <div className="space-y-3">
                        <Input
                          type="text"
                          placeholder="🔍 Search by title, description, assignee, or status..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="h-12"
                        />
                        
                        {!searchQuery && (
                          <div className="p-3 text-center text-gray-400 border border-gray-200 rounded-lg bg-gray-50">
                            <div className="text-sm">Start typing to see tasks with status badges, priority levels, assignees, and due dates</div>
                          </div>
                        )}
                        
                        {searchQuery && filteredTasks.length === 0 && (
                          <div className="p-4 text-center text-gray-500 border border-gray-200 rounded-lg bg-gray-50">
                            <div className="text-sm">No tasks found matching "{searchQuery}"</div>
                            <div className="text-xs mt-1">Try searching by task title, description, assignee name, or status</div>
                          </div>
                        )}
                        
                        {searchQuery && filteredTasks.length > 0 && (
                          <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg bg-white shadow-sm">
                            {filteredTasks.slice(0, 8).map((task) => {
                              const assignedUser = users.find(u => u.id === task.assigned_to);
                              const priorityLabels = { 1: 'High', 2: 'Medium', 3: 'Low' };
                              const priorityColors = { 1: 'text-red-600 bg-red-50', 2: 'text-yellow-600 bg-yellow-50', 3: 'text-green-600 bg-green-50' };
                              const statusColors = { 
                                'pending': 'text-gray-600 bg-gray-100',
                                'in_progress': 'text-blue-600 bg-blue-100', 
                                'Completed': 'text-green-600 bg-green-100',
                                'backlog': 'text-purple-600 bg-purple-100'
                              };
                              
                              return (
                                <button
                                  key={task.id}
                                  type="button"
                                  className="w-full p-4 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors group"
                                  onClick={() => {
                                    setSelectedDependencyTask(task);
                                    setForm(f => ({ ...f, dependencyTaskId: task.id }));
                                    setSearchQuery("");
                                  }}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                      <div className="font-semibold text-gray-900 group-hover:text-blue-700 line-clamp-1">
                                        {task.title}
                                      </div>
                                      <div className="text-sm text-gray-600 mt-1 line-clamp-2">
                                        {task.description || "No description provided"}
                                      </div>
                                      <div className="flex items-center gap-3 mt-2 text-xs">
                                        <span className={`px-2 py-1 rounded-full font-medium ${statusColors[task.status] || 'text-gray-600 bg-gray-100'}`}>
                                          {task.status?.replace('_', ' ').toUpperCase()}
                                        </span>
                                        <span className={`px-2 py-1 rounded-full font-medium ${priorityColors[task.priority] || 'text-gray-600 bg-gray-100'}`}>
                                          {priorityLabels[task.priority] || 'Medium'} Priority
                                        </span>
                                        {assignedUser && (
                                          <span className="text-gray-500">
                                            👤 {assignedUser.user_name || assignedUser.email}
                                          </span>
                                        )}
                                        {task.due_date && (
                                          <span className="text-gray-500">
                                            📅 Due: {new Date(task.due_date).toLocaleDateString()}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                            {filteredTasks.length > 8 && (
                              <div className="p-3 text-center text-sm text-gray-500 bg-gray-50">
                                Showing 8 of {filteredTasks.length} results. Type more to refine search.
                              </div>
                            )}
                          </div>
                        )}
                        
                        {selectedDependencyTask && (
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-semibold text-blue-800">🎯 {selectedDependencyTask.title}</div>
                                <div className="text-sm text-blue-700">{selectedDependencyTask.description}</div>
                              </div>
                              <button
                                type="button"
                                className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50"
                                onClick={() => {
                                  setSelectedDependencyTask(null);
                                  setForm(f => ({ ...f, dependencyTaskId: "" }));
                                }}
                              >
                                Clear
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <input
                        type="hidden"
                        name="dependencyTaskId"
                        value={form.dependencyTaskId}
                        readOnly
                      />
                      
                      {selectedDependencyTask && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="text-sm font-medium text-blue-800">Dependency Task Details:</div>
                          <div className="text-sm text-blue-700 mt-1">
                            {selectedDependencyTask.description || "No description provided"}
                          </div>
                        </div>
                      )}
                      
                      {form.status === "Completed" && !canCompleteDependent() && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="text-sm text-red-800 flex items-center">
                            <span className="mr-2">⚠️</span>
                            Cannot complete this task until the dependency task is completed.
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
        
<div className="bg-white p-4 rounded-lg border border-gray-200">
  <label className="block text-base font-medium text-gray-700 mb-3 flex items-center justify-between">
    <span className="flex items-center">📎 Attach Files</span>
    {attachments.length > 0 && (
      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
        {attachments.length} file(s) selected
      </span>
    )}
  </label>

  <div className="relative">
    <input
      type="file"
      multiple
      onChange={handleFileSelect}
      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      disabled={creating}
    />
    <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
      <p className="text-sm text-gray-500">Click or drag files here to upload</p>
      <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG (Max 1MB each)</p>
    </div>
  </div>

  {attachments.length > 0 && (
    <div className="mt-4 grid grid-cols-1 gap-2">
      {attachments.map((file, index) => (
        <div
          key={index}
          className="flex items-center justify-between bg-blue-50/50 p-2 px-3 rounded-md border border-blue-100"
        >
          <div className="flex items-center min-w-0">
            <span className="text-blue-500 mr-2">📄</span>
            <span className="text-sm font-medium truncate max-w-[200px]">
              {file.name}
            </span>
            <span className="text-[10px] text-gray-400 ml-2">
              ({(file.size / 1024).toFixed(0)} KB)
            </span>
          </div>

          <button
            type="button"
            onClick={() => removeAttachment(index)}
            className="text-red-500 hover:text-red-700 p-1 transition-colors"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )}
</div>
{/* Project Linkage */}
           {projectManagementEnabled && (     <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center mb-1">
                    <span className="mr-2">🗂️</span>
                    <span className="text-base font-medium text-gray-700">Link to Project</span>
                  </div>
                <p className="text-sm text-gray-500 mb-3">
                    {defaultProjectId
                      ? "This task will be linked to the current project."
                      : "Optionally associate this task with a project milestone or feature"}
                  </p>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Project</label>
                      {defaultProjectId ? (
                        <div className="w-full h-10 text-sm border border-gray-200 bg-gray-50 rounded-lg px-3 flex items-center gap-2 text-gray-700">
                          <span className="text-gray-400">🔒</span>
                          {projectsList.find(p => p.id === defaultProjectId)?.name ?? "Current Project"}
                        </div>
                      ) : (
                      <select
                        value={selectedProjectId}
                        onChange={e => setSelectedProjectId(e.target.value)}
                        className="w-full h-10 text-sm border border-gray-300 rounded-lg px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select</option>
                        {projectsList.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select> )}
                    </div>
                    {selectedProjectId && (
                      <>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Milestone
                            <span className="ml-1 text-xs font-normal text-amber-600">(required to close/complete this task)</span>
                          </label>
                          <select
                            value={selectedMilestoneId}
                            onChange={e => setSelectedMilestoneId(e.target.value)}
                            className="w-full h-10 text-sm border border-gray-300 rounded-lg px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                        <option value="">— Select a milestone —</option>
                            {milestonesList.map(m => (
                              <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                          </select>
                         
                        </div>
                        <div>
                             <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Feature
                            <span className="ml-1 text-xs font-normal text-gray-500">(optional)</span>
                          </label>
                          <select
                            value={selectedFeatureId}
                            onChange={e => setSelectedFeatureId(e.target.value)}
                             className="w-full h-10 text-sm border border-gray-300 rounded-lg px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                             <option value="">— Select a feature —</option>
                            {featuresList.map(f => (
                              <option key={f.id} value={f.id}>{f.tracking_number ? `[${f.tracking_number}] ` : ""}{f.name}</option>
                            ))}
                          </select>
                                             
                        </div>
                      </>
                    )}
                  </div>
                </div>)}
              </div>

              </div>
            </div>
         
          <SheetFooter className="mt-10 pt-6 border-t border-gray-200 flex-col sm:flex-row gap-4">
            <div className="flex gap-4 w-full">
              <Button 
                type="submit" 
                disabled={creating || sessionLoading || !user }
                className="flex-1 h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white"
              >
                {creating ? (
                  <span className="flex items-center">
                    <span className="animate-spin mr-2">⏳</span>
                    Creating Task...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <span className="mr-2">✨</span>
                    Create Task
                  </span>
                )}
              </Button>
              <SheetClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 px-6 text-base font-semibold"
                  onClick={() => {
                    resetForm();
                    setOpen(false);
                  }}
                >
                  Cancel
                </Button>
              </SheetClose>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
  };

export default CreateTaskSheet;

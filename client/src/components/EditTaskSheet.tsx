import React, { useState, useEffect, useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Task } from "@/integrations/supabase/tasks";
import { toast } from "@/components/ui/use-toast";
import { useTaskStatuses } from "@/hooks/useTaskStatuses";
import { EditTaskStatusSelect } from "./EditTaskStatusSelect";
import { apiClient } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useUsersAndTeams } from "@/hooks/useUsersAndTeams";
import { useCurrentUserRoleAndTeams } from "@/hooks/useCurrentUserRoleAndTeams";
import { Download, FileIcon, ImageIcon, Loader2, Paperclip, AlertCircle } from "lucide-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { TaskChecklist } from "./TaskChecklist";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";

// --- Constants ---
const modules = {
  toolbar: [
    ["bold", "italic", "underline"],
    [{ color: [] }],
    [{ list: "ordered" }, { list: "bullet" }],
  ],
};

type Props = {
  task: Task | null;
  onUpdated: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
};

const EditTaskSheet: React.FC<Props> = ({
  task,
  onUpdated,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  children,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const onOpenChange = controlledOnOpenChange !== undefined ? controlledOnOpenChange : setInternalOpen;

  // State for Assignment
  const [newAssignee, setNewAssignee] = useState(task?.assigned_to || "");
  const [form, setForm] = useState({
    title: task?.title || "",
    description: task?.description || "",
    start_date: task?.start_date ? task?.start_date.slice(0, 10) : "",
    priority: task?.priority || 2,
    due_date: task?.due_date ? task?.due_date?.slice(0, 10) : "",
    status: task?.status || "",
    estimated_hours: task?.estimated_hours || "",
    actual_completion_date: task?.actual_completion_date || "",
    is_time_managed: task?.is_time_managed || false,
    timer_state: task?.timer_state || null,
  });

  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showTodoWarning, setShowTodoWarning] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const { users } = useUsersAndTeams();
  const { roles: currentRoles, user: currentUser } = useCurrentUserRoleAndTeams();
  const { statuses, loading: statusesLoading } = useTaskStatuses();

  // --- Permission Logic ---
  const isAdminOrManager = useMemo(() => 
    currentRoles.some(r => ["admin", "manager", "team manager"].includes(r)), 
    [currentRoles]
  );
  
  const isUser = !isAdminOrManager;

  // Logic to determine who can be assigned
  const allowedAssignUsers = useMemo(() => {
    if (isAdminOrManager) return users;
    if (isUser && currentUser) {
      const myManagerName = currentUser?.user_metadata?.manager || null;
      const myManager = users.find((u) => u.user_name === myManagerName);
      return myManager ? [myManager] : [];
    }
    return [];
  }, [users, currentUser, isAdminOrManager, isUser]);

  const canShowAssign = (
    (isAdminOrManager && users.length > 0) ||
    (isUser && task && task.type !== "personal" && allowedAssignUsers.length > 0)
  );

  const availableHoursRemaining = useMemo(() => {
    if (!form.start_date || !form.due_date) return 0;
    const now = new Date();
    const endSelection = new Date(form.due_date);
    endSelection.setHours(23, 59, 59, 999);
    const diffMs = endSelection.getTime() - now.getTime();
    return diffMs <= 0 ? 0 : parseFloat((diffMs / (1000 * 60 * 60)).toFixed(1));
  }, [form.due_date, open]);

  useEffect(() => {
    if (open && task) {
      setForm({
        title: task.title,
        description: task.description || "",
        priority: task.priority || 2,
        start_date: task.start_date ? task.start_date.slice(0, 10) : "",
        due_date: task.due_date ? task.due_date.slice(0, 10) : "",
        status: task.status || "",
        estimated_hours: task.estimated_hours || "",
        actual_completion_date: task.actual_completion_date || "",
        is_time_managed: task.is_time_managed || false,
        timer_state: task.timer_state || null,
      });
      setNewAssignee(task.assigned_to || "");
    }
  }, [open, task]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: name === "priority" ? Number(value) : value }));
  };

  // Dedicated function to handle assignment ONLY (saves time if only assignee changes)
  const handleAssignmentUpdate = async () => {
    if (!task) return;
    setLoading(true);
    try {
      await apiClient.patch(`/tasks/${task.id}`, { assigned_to: newAssignee });
      toast({ title: "Task assignee updated" });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      onUpdated?.();
    } catch (err: any) {
      toast({ title: "Assignment failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !currentUser) return;

    setLoading(true);
    try {
      const updatePayload = {
        ...form,
        assigned_to: newAssignee, // Ensure assignee is included in the main update
        estimated_hours: form.estimated_hours ? Number(form.estimated_hours) : null,
        actual_completion_date: form.status.toLowerCase() === "completed" 
          ? (form.actual_completion_date || new Date().toISOString().slice(0, 10)) 
          : null,
      };

      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "x-user-id": currentUser.id 
        },
        body: JSON.stringify(updatePayload)
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === "PENDING_TODOS_REMAINING") {
          setPendingCount(data.count);
          setShowTodoWarning(true);
          setLoading(false);
          return;
        }
        throw new Error(data.error || "Update failed");
      }

      toast({ title: "Task updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      onOpenChange(false);
      onUpdated?.();
    } catch (err: any) {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {children && <SheetTrigger asChild>{children}</SheetTrigger>}
      <SheetContent side="right" className="w-full sm:w-[90vw] md:w-[70vw] lg:w-[50vw] lg:min-w-[800px] flex flex-col p-0">
        <form className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto" onSubmit={handleSubmit}>
          <SheetHeader>
            <SheetTitle>Edit Task</SheetTitle>
            <SheetDescription>Update task details and manage organization requirements.</SheetDescription>
          </SheetHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-sm font-medium">Task Title</label>
              <Input name="title" value={form.title} onChange={handleChange} required disabled={isUser} />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Priority</label>
              <select name="priority" value={form.priority} onChange={handleChange} className="w-full border rounded p-2" disabled={isUser}>
                <option value={1}>High</option>
                <option value={2}>Medium</option>
                <option value={3}>Low</option>
              </select>
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Status</label>
              <EditTaskStatusSelect
                currentStatus={form.status}
                onStatusChange={(newStatus) => setForm(f => ({ ...f, status: newStatus }))}
                disabled={statusesLoading}
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Due Date</label>
              <Input name="due_date" type="date" value={form.due_date} onChange={handleChange} disabled={isUser} required />
            </div>

            {/* Assignment Section Restored */}
            {canShowAssign && (
              <div className="sm:col-span-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <label className="block mb-1 text-sm font-medium">Assign To</label>
                <div className="flex gap-2">
                  <select
                    value={newAssignee}
                    onChange={(e) => setNewAssignee(e.target.value)}
                    className="flex-1 border rounded p-2 bg-white"
                  >
                    <option value="">Unassigned</option>
                    {allowedAssignUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.user_name ?? u.email}
                      </option>
                    ))}
                  </select>
                  <Button 
                    type="button" 
                    variant="secondary"
                    size="sm"
                    disabled={loading || newAssignee === task?.assigned_to}
                    onClick={handleAssignmentUpdate}
                  >
                    Update Assignee
                  </Button>
                </div>
              </div>
            )}

            {task?.todos_enabled && (
              <div className="sm:col-span-2 border-y py-4 my-2">
                <TaskChecklist taskId={task.id} />
              </div>
            )}

            <div className="sm:col-span-2">
              <label className="block mb-1 text-sm font-medium">Estimated Hours</label>
              <Input 
                name="estimated_hours" 
                value={form.estimated_hours} 
                onChange={handleChange} 
                type="number" 
                step="0.1" 
                disabled={isUser && form.timer_state !== "stopped"}
                required 
              />
              <p className={`text-[11px] mt-1 flex items-center gap-1 ${Number(form.estimated_hours) > availableHoursRemaining ? 'text-red-500 font-bold underline' : 'text-gray-500'}`}>
                <AlertCircle size={12} />
                Max available from now: {availableHoursRemaining}h
              </p>
            </div>

            <div className="sm:col-span-2">
              <label className="block mb-1 text-sm font-medium">Description</label>
              <div className="border rounded-md overflow-hidden">
                <ReactQuill 
                  theme="snow" 
                  modules={modules} 
                  value={form.description} 
                  onChange={(val) => setForm(f => ({ ...f, description: val }))} 
                  className="h-44" 
                  readOnly={isUser}
                />
              </div>
            </div>
          </div>

          <SheetFooter className="mt-auto pt-4 border-t gap-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Update Task
            </Button>
            <SheetClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </SheetClose>
          </SheetFooter>
        </form>

        <AlertDialog open={showTodoWarning} onOpenChange={setShowTodoWarning}>
          <AlertDialogContent className="bg-white border-2 border-orange-200">
            <AlertDialogHeader>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">⚠️</span>
              </div>
              <AlertDialogTitle className="text-xl font-bold text-slate-900">
                Incomplete Checklist
              </AlertDialogTitle>
              <AlertDialogDescription className="text-slate-600 text-base">
                There are **{pendingCount} mandatory items** remaining in the checklist. 
                You must complete all items before this task can be marked as "Completed".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction className="bg-slate-900 text-white hover:bg-slate-800">
                I'll finish them now
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  );
};

export default EditTaskSheet;
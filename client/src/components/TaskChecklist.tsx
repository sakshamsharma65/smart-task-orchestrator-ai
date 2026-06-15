import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/lib/api";
import { Loader2, ListChecks, CheckCircle2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
interface TaskTodo {
  id: string;
  title: string;
  is_completed: boolean;
}

interface Props {
  taskId: string;
  readOnly?: boolean;
}

export const TaskChecklist: React.FC<Props> = ({ taskId, readOnly = false }) => {
  const queryClient = useQueryClient();

  // 1. Fetch todos for this task
  const { data: todos = [], isLoading } = useQuery<TaskTodo[]>({
    queryKey: [`/api/tasks/${taskId}/todos`],
    queryFn: async () => await apiClient.get(`/tasks/${taskId}/todos`),
    enabled: !!taskId,
  });

  // 2. Toggle Mutation
  const toggleMutation = useMutation({
    mutationFn: async ({ todoId, is_completed }: { todoId: string; is_completed: boolean }) => {
      return await apiClient.patch(`/task-todos/${todoId}/toggle`, { is_completed });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}/todos`] });
      // Also invalidate task list to refresh the status blocker if needed
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
    },
    onError: () => {
      toast({ title: "Update failed", variant: "destructive" });
    }
  });

  if (isLoading) return <Loader2 className="h-4 w-4 animate-spin mx-auto my-4" />;
  if (todos.length === 0) return null;

  const completedCount = todos.filter(t => t.is_completed).length;

  return (
    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <ListChecks className="h-4 w-4 text-blue-600" />
          Required Checklist
        </h4>
        <span className="text-[11px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase">
          {completedCount} / {todos.length} Done
        </span>
      </div>

      <div className="space-y-2">
        {todos.map((todo) => (
  <div 
    key={todo.id} 
    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
      todo.is_completed ? 'bg-blue-50/50 border-blue-100' : 'bg-white border-slate-100 shadow-sm'
    }`}
  >
    <Label htmlFor={todo.id} className="flex-1 cursor-pointer font-medium text-slate-700">
      {todo.title}
    </Label>

    <RadioGroup
      value={todo.is_completed ? "done" : "pending"}
      onValueChange={(val) => toggleMutation.mutate({ todoId: todo.id, is_completed: val === "done" })}
      className="flex gap-4"
    >
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="pending" id={`${todo.id}-p`} className="border-slate-300" />
        <Label htmlFor={`${todo.id}-p`} className="text-[10px] font-bold uppercase text-slate-400">Pending</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="done" id={`${todo.id}-d`} className="text-blue-600 border-blue-600" />
        <Label htmlFor={`${todo.id}-d`} className="text-[10px] font-bold uppercase text-blue-600">Done</Label>
      </div>
    </RadioGroup>
  </div>
))}
      </div>
    </div>
  );
};
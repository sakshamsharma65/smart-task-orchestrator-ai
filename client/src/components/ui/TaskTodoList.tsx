import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { apiClient } from "@/lib/api"; // Assuming your apiClient has these methods
import { toast } from "@/components/ui/use-toast";

export function TaskTodoList({ taskId }: { taskId: string }) {
  const [todos, setTodos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodos();
  }, [taskId]);

  const fetchTodos = async () => {
    try {
      const data = await fetch(`/api/tasks/${taskId}/todos`).then(res => res.json());
      setTodos(data);
    } catch (err) {
      console.error("Failed to fetch todos");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (todoId: string, currentState: boolean) => {
    try {
      await fetch(`/api/task-todos/${todoId}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_completed: !currentState })
      });
      // Optimistic update
      setTodos(prev => prev.map(t => t.id === todoId ? { ...t, is_completed: !currentState } : t));
    } catch (err) {
      toast({ title: "Error", description: "Failed to update todo", variant: "destructive" });
    }
  };

  if (loading) return <div>Loading checklist...</div>;
  if (todos.length === 0) return null;

  return (
    <div className="mt-6 space-y-3 p-4 bg-slate-50 rounded-xl border">
      <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center">
        <span className="mr-2">📝</span> Required Checklist
      </h3>
      <div className="grid gap-2">
        {todos.map((todo) => (
          <div key={todo.id} className="flex items-center space-x-3 p-2 hover:bg-white rounded-md transition-all">
            <Checkbox 
              id={todo.id} 
              checked={todo.is_completed} 
              onCheckedChange={() => handleToggle(todo.id, todo.is_completed)}
            />
            <label 
              htmlFor={todo.id} 
              className={`text-sm font-medium leading-none cursor-pointer ${todo.is_completed ? 'line-through text-slate-400' : 'text-slate-700'}`}
            >
              {todo.title}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
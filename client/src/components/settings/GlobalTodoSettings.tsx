import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { 
  Loader2, 
  ListChecks, 
  Plus, 
  Trash2, 
  CheckCircle2,
  Info
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const GlobalTodoSettings = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [newTodoTitle, setNewTodoTitle] = useState("");

  // 1. Fetch Master Todos
  const { data: globalTodos, isLoading } = useQuery({
    queryKey: ["global-todos"],
    queryFn: async () => await apiClient.get("/global-todos"),
  });

  // 2. Mutation: Create New Todo
  const addMutation = useMutation({
    mutationFn: async (title: string) => {
      return await apiClient.post("/global-todos", { title, is_active: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["global-todos"] });
      setNewTodoTitle("");
      toast({ title: "Todo Added", description: "This item will now appear on all new tasks." });
    },
  });

  // 3. Mutation: Toggle Active Status
  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      return await apiClient.patch(`/global-todos/${id}`, { is_active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["global-todos"] });
    },
  });

  // 4. Mutation: Delete Todo
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiClient.delete(`/global-todos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["global-todos"] });
      toast({ title: "Todo Removed", description: "Master checklist updated." });
    },
  });

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) return;
    addMutation.mutate(newTodoTitle);
  };

  if (isLoading) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <Card className="w-full border-none shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ListChecks className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Master Task Todolist</CardTitle>
              <CardDescription>
                Define mandatory items that must be completed before any task can be marked as "Done".
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Add New Todo Form */}
          <form onSubmit={handleAddTodo} className="flex gap-2">
            <Input
              placeholder="e.g. Code Review, Documentation, Testing..."
              value={newTodoTitle}
              onChange={(e) => setNewTodoTitle(e.target.value)}
              className="flex-1 h-11"
            />
            <Button type="submit" disabled={addMutation.isPending} className="h-11 px-6">
              {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Add Requirement
            </Button>
          </form>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
              Active Requirements ({globalTodos?.length || 0})
            </h3>

            {globalTodos?.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed rounded-xl text-muted-foreground">
                <Info className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p>No mandatory todos defined yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {globalTodos?.map((todo: any) => (
                  <div 
                    key={todo.id} 
                    className="flex items-center justify-between p-4 border rounded-xl hover:bg-accent/5 transition-colors bg-card"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-1.5 rounded-full ${todo.is_active ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <div>
                        <Label 
                          htmlFor={`todo-${todo.id}`} 
                          className={`text-base font-medium cursor-pointer ${!todo.is_active && 'text-muted-foreground line-through'}`}
                        >
                          {todo.title}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {todo.is_active ? "Currently being added to new tasks" : "Currently disabled"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* <Switch
                        id={`todo-${todo.id}`}
                        checked={todo.is_active}
                        onCheckedChange={(checked) => toggleMutation.mutate({ id: todo.id, is_active: checked })}
                        className="data-[state=checked]:bg-primary"
                      /> */}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        onClick={() => deleteMutation.mutate(todo.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Info Status */}
          <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground px-1">
            <Info className="h-3 w-3 text-blue-500" />
            Changes made here will only affect <strong>newly created tasks</strong>. Existing tasks will keep their original checklist.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GlobalTodoSettings;
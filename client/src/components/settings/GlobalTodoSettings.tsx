import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Info,
  FolderPlus,
  ChevronRight,
  Settings2,
  ArrowLeft
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const GlobalTodoSettings = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // UI State
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [newTodoTitle, setNewTodoTitle] = useState("");

  // --- 1. DATA FETCHING ---

  // Fetch all Template Groups
  const { data: groups = [], isLoading: loadingGroups } = useQuery({
    queryKey: ["todo-groups"],
    queryFn: async () => await apiClient.get("/todo-groups"),
  });

  // Fetch items for the selected group
  const { data: groupItems = [], isLoading: loadingItems } = useQuery({
    queryKey: ["todo-group-items", selectedGroupId],
    queryFn: async () => await apiClient.get(`/todo-groups/${selectedGroupId}/items`),
    enabled: !!selectedGroupId,
  });

  // --- 2. GROUP MUTATIONS ---

  const addGroupMutation = useMutation({
    mutationFn: async (name: string) => await apiClient.post("/todo-groups", { name, is_active: true }),
    onSuccess: (newGroup) => {
      queryClient.invalidateQueries({ queryKey: ["todo-groups"] });
      setNewGroupName("");
      setSelectedGroupId(newGroup.id);
      toast({ title: "Template Created", description: "Now add requirements to this template." });
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: async (id: string) => await apiClient.delete(`/todo-groups/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todo-groups"] });
      setSelectedGroupId(null);
      toast({ title: "Template Deleted" });
    },
  });

  // --- 3. TODO ITEM MUTATIONS ---

  const addTodoMutation = useMutation({
    mutationFn: async (title: string) => {
      return await apiClient.post("/global-todos", { 
        title, 
        group_id: selectedGroupId, 
        is_active: true 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todo-group-items", selectedGroupId] });
      setNewTodoTitle("");
      toast({ title: "Requirement Added" });
    },
  });

  const deleteTodoMutation = useMutation({
    mutationFn: async (id: string) => await apiClient.delete(`/global-todos/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todo-group-items", selectedGroupId] });
    },
  });

  // --- 4. HANDLERS ---

  const handleAddGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    addGroupMutation.mutate(newGroupName);
  };

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoTitle.trim() || !selectedGroupId) return;
    addTodoMutation.mutate(newTodoTitle);
  };

  if (loadingGroups) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const selectedGroup = groups.find((g: any) => g.id === selectedGroupId);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-250px)] min-h-[600px]">
        
        {/* --- LEFT COLUMN: GROUP LIST --- */}
        <Card className="w-full md:w-80 flex flex-col border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b">
            <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-wider text-slate-500">
              <Settings2 className="h-4 w-4" /> Checklist Templates
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            <form onSubmit={handleAddGroup} className="space-y-2">
              <Input
                placeholder="Template name..."
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="h-9 text-sm"
              />
              <Button type="submit" disabled={addGroupMutation.isPending} className="w-full h-9 text-sm" variant="secondary">
                <FolderPlus className="h-4 w-4 mr-2" /> Create Group
              </Button>
            </form>

            <div className="space-y-1">
              {groups.map((group: any) => (
                <button
                  key={group.id}
                  onClick={() => setSelectedGroupId(group.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg text-sm transition-all ${
                    selectedGroupId === group.id 
                      ? 'bg-primary text-primary-foreground shadow-md' 
                      : 'hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  <span className="font-medium truncate">{group.name}</span>
                  <ChevronRight className={`h-4 w-4 ${selectedGroupId === group.id ? 'opacity-100' : 'opacity-0'}`} />
                </button>
              ))}
              {groups.length === 0 && (
                <p className="text-center py-10 text-xs text-slate-400 italic">No templates created yet.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* --- RIGHT COLUMN: TODO ITEMS --- */}
        <div className="flex-1">
          {!selectedGroupId ? (
            <div className="h-full flex flex-col items-center justify-center border-2 border-dashed rounded-2xl bg-slate-50/30 text-slate-400">
              <ListChecks className="h-12 w-12 mb-4 opacity-20" />
              <p className="font-medium">Select a template from the left</p>
              <p className="text-xs">Or create a new one to start defining requirements.</p>
            </div>
          ) : (
            <Card className="h-full flex flex-col border-none shadow-sm overflow-hidden animate-in fade-in duration-300">
              <CardHeader className="bg-white border-b flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-primary/10 rounded-xl">
                      <ListChecks className="h-6 w-6 text-primary" />
                   </div>
                   <div>
                      <CardTitle className="text-xl">{selectedGroup?.name}</CardTitle>
                      <CardDescription>Manage requirements for this specific template.</CardDescription>
                   </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => confirm("Delete this entire template?") && deleteGroupMutation.mutate(selectedGroupId)}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Delete Template
                </Button>
              </CardHeader>

              <CardContent className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Add New Requirement Form */}
                <form onSubmit={handleAddTodo} className="flex gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <Input
                    placeholder="New checklist item (e.g. Code Review complete)"
                    value={newTodoTitle}
                    onChange={(e) => setNewTodoTitle(e.target.value)}
                    className="flex-1 bg-white"
                  />
                  <Button type="submit" disabled={addTodoMutation.isPending} className="px-6">
                    {addTodoMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                    Add Item
                  </Button>
                </form>

                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
                    Requirements inside this template ({groupItems.length})
                  </h3>

                  {loadingItems ? (
                    <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-slate-300" /></div>
                  ) : groupItems.length === 0 ? (
                    <div className="text-center py-12 border rounded-xl bg-slate-50/50">
                      <p className="text-sm text-slate-400">No items added to this group yet.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2">
                      {groupItems.map((todo: any) => (
                        <div 
                          key={todo.id} 
                          className="group flex items-center justify-between p-4 border border-slate-100 rounded-xl border-primary/30 transition-all bg-white hover:shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-primary/40" />
                            <Label className="text-sm font-semibold text-slate-700">{todo.title}</Label>
                          </div>

                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="opacity-100 text-red-400 hover:text-destructive transition-all"
                            onClick={() => deleteTodoMutation.mutate(todo.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-400 px-1">
        <Info className="h-3 w-3" />
        Templates can be applied when creating new tasks. Deleting a template does not remove checklists from tasks already created.
      </div>
    </div>
  );
};

export default GlobalTodoSettings;
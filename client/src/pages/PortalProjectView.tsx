import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  ArrowLeft,
  Shield,
  FolderKanban,
  Milestone,
  Bug,
  ListTodo,
  Clock,
  Plus,
  CheckCircle,
  AlertTriangle,
  Circle,
  PauseCircle,
  LogOut,
  Pencil,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const MILESTONE_STATUS: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  not_started: { label: "Not Started", icon: Circle, color: "text-gray-400" },
  in_progress: { label: "In Progress", icon: Clock, color: "text-blue-500" },
  on_hold: { label: "On Hold", icon: PauseCircle, color: "text-amber-500" },
  completed: { label: "Completed", icon: CheckCircle, color: "text-green-500" },
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-red-100 text-red-800 border-red-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  low: "bg-blue-100 text-blue-800 border-blue-200",
};

const PRIORITY_MAP: Record<number, { label: string; color: string }> = {
  1: { label: "Critical", color: "text-red-600" },
  2: { label: "High", color: "text-orange-500" },
  3: { label: "Medium", color: "text-yellow-500" },
  4: { label: "Low", color: "text-blue-400" },
  5: { label: "Minimal", color: "text-gray-400" },
};

const EMPTY_DEFECT_FORM = {
  title: "",
  description: "",
  severity: "medium",
  type: "bug",
  environment: "production",
  expected_behaviour: "",
  actual_behaviour: "",
  steps_to_reproduce: "",
  status: "submitted",
  rejection_reason: "",
};

export default function PortalProjectView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [me, setMe] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [access, setAccess] = useState<any>(null);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [defects, setDefects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [defectDialog, setDefectDialog] = useState(false);
  const [editingDefect, setEditingDefect] = useState<any>(null);
  const [defectForm, setDefectForm] = useState(EMPTY_DEFECT_FORM);
  const [submittingDefect, setSubmittingDefect] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const meRes = await fetch("/api/portal/me", { credentials: "include" });
        if (!meRes.ok) {
          navigate("/portal/login");
          return;
        }

        const meData = await meRes.json();
        setMe(meData);

        const projRes = await fetch(`/api/portal/projects/${id}`, { credentials: "include" });
        if (!projRes.ok) {
          navigate("/portal/dashboard");
          return;
        }

        const { project: proj, access: acc } = await projRes.json();
        setProject(proj);
        setAccess(acc);

        const [msRes, defRes, taskRes] = await Promise.all([
          fetch(`/api/portal/projects/${id}/milestones`, { credentials: "include" }),
          acc.can_view_defects ? fetch(`/api/portal/projects/${id}/defects`, { credentials: "include" }) : Promise.resolve(null),
          acc.can_view_tasks ? fetch(`/api/portal/projects/${id}/tasks`, { credentials: "include" }) : Promise.resolve(null),
        ]);

        if (msRes.ok) setMilestones(await msRes.json());
        if (defRes?.ok) setDefects(await defRes.json());
        if (taskRes?.ok) setTasks(await taskRes.json());
      } catch {
        navigate("/portal/login");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate]);

  const handleLogout = async () => {
    await fetch("/api/portal/logout", { method: "POST", credentials: "include" });
    navigate("/portal/login");
  };

  const openCreateDefect = () => {
    setEditingDefect(null);
    setDefectForm(EMPTY_DEFECT_FORM);
    setDefectDialog(true);
  };

  const openManageDefect = (defect: any) => {
    setEditingDefect(defect);
    setDefectForm({
      title: defect.title || "",
      description: defect.description || "",
      severity: defect.severity || "medium",
      type: defect.type || "bug",
      environment: defect.environment || "production",
      expected_behaviour: defect.expected_behavior || "",
      actual_behaviour: defect.actual_behavior || "",
      steps_to_reproduce: defect.steps_to_reproduce || "",
      status: defect.status || "submitted",
      rejection_reason: defect.rejection_reason || "",
    });
    setDefectDialog(true);
  };

  const closeDefectDialog = () => {
    setDefectDialog(false);
    setEditingDefect(null);
    setDefectForm(EMPTY_DEFECT_FORM);
  };

  const submitDefect = async () => {
    if (!defectForm.title.trim()) {
      toast({ title: "Title is required.", variant: "destructive" });
      return;
    }
    if (!defectForm.description.trim()|| !defectForm.expected_behaviour.trim() || !defectForm.actual_behaviour.trim() || !defectForm.steps_to_reproduce.trim()) {
      toast({ title: "All fields are required.", variant: "destructive" });
      return;
    }


    setSubmittingDefect(true);

    try {
      const isEditing = !!editingDefect;
      const response = await fetch(
        isEditing ? `/api/portal/projects/${id}/defects/${editingDefect.id}` : `/api/portal/projects/${id}/defects`,
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            title: defectForm.title,
            description: defectForm.description,
            severity: defectForm.severity,
            type: defectForm.type,
            environment: defectForm.environment,
            expected_behavior: defectForm.expected_behaviour,
            actual_behavior: defectForm.actual_behaviour,
            steps_to_reproduce: defectForm.steps_to_reproduce,
            ...(isEditing && access?.can_approve_defects
              ? {
                  status: defectForm.status,
                  rejection_reason: defectForm.status === "rejected" ? defectForm.rejection_reason : null,
                }
              : {}),
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Failed");
      }

      const savedDefect = await response.json();
      if (isEditing) {
        setDefects((current) => current.map((item) => (item.id === savedDefect.id ? savedDefect : item)));
      } else {
        setDefects((current) => [savedDefect, ...current]);
      }

      toast({
        title: isEditing ? "Defect updated" : "Defect submitted",
        description: isEditing ? "The defect changes were saved." : "Your defect has been reported successfully.",
      });

      closeDefectDialog();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to save defect: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setSubmittingDefect(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Shield className="h-8 w-8 text-blue-500 animate-pulse" />
      </div>
    );
  }

  if (!project) return null;

  const tabCount = 2 + (access?.can_view_defects ? 1 : 0) + (access?.can_view_tasks ? 1 : 0);
  const canManageDefects = access?.can_edit_defects || access?.can_approve_defects;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 h-64 overflow-y-auto ">
      <header className="bg-white dark:bg-gray-900 border-b dark:border-gray-800 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-sm text-gray-900 dark:text-white">Client Portal</span>
          </div>
          <span className="text-gray-300 dark:text-gray-600">/</span>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate("/portal/dashboard")}>
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Dashboard
          </Button>
          <div className="ml-auto flex items-center gap-2">
            {me?.contact && <span className="text-xs text-gray-500 hidden sm:block">{me.contact.name}</span>}
            <Button variant="ghost" size="sm" onClick={handleLogout} className="h-8 gap-1.5 text-gray-500 hover:text-red-600">
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
              <FolderKanban className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
              {project.client_name && <p className="text-sm text-gray-500">{project.client_name}</p>}
            </div>
          </div>
          <Badge className="capitalize bg-blue-50 text-blue-700 border-blue-200 text-xs">
            {(project.status || "").replace("_", " ")}
          </Badge>
        </div>

        <Tabs defaultValue="overview">
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${tabCount}, minmax(0, 1fr))` }}>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="milestones">
              <Milestone className="h-3.5 w-3.5 mr-1" /> Milestones ({milestones.length})
            </TabsTrigger>
            {access?.can_view_defects && (
              <TabsTrigger value="defects">
                <Bug className="h-3.5 w-3.5 mr-1" /> Defects ({defects.length})
              </TabsTrigger>
            )}
            {access?.can_view_tasks && (
              <TabsTrigger value="tasks">
                <ListTodo className="h-3.5 w-3.5 mr-1" /> Tasks ({tasks.length})
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Project Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {[
                    { label: "Type", value: (project.project_type || "").replace("_", " ") },
                    { label: "Start", value: project.start_date ? format(new Date(project.start_date), "MMM d, yyyy") : null },
                    { label: "End", value: project.projected_end_date ? format(new Date(project.projected_end_date), "MMM d, yyyy") : null },
                    { label: "Budget", value: project.budget_amount ? `${project.currency || ""} ${project.budget_amount}` : null },
                    { label: "Effort", value: project.total_effort_hours ? `${project.total_effort_hours}h` : null },
                  ]
                    .filter((row) => row.value)
                    .map(({ label, value }) => (
                      <div key={label} className="flex justify-between">
                        <span className="text-gray-500 capitalize">{label}</span>
                        <span className="font-medium capitalize">{value}</span>
                      </div>
                    ))}
                  {project.description && (
                    <div className="pt-2 border-t dark:border-gray-700">
                      <p className="text-gray-500 text-xs mb-1">Description</p>
                      <p className="text-sm">{project.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="space-y-3">
                {[
                  { label: "Milestones", value: milestones.length, icon: Milestone, color: "text-purple-600", bg: "bg-purple-50" },
                  ...(access?.can_view_defects ? [{ label: "Defects", value: defects.length, icon: Bug, color: "text-orange-600", bg: "bg-orange-50" }] : []),
                  ...(access?.can_view_tasks ? [{ label: "Tasks", value: tasks.length, icon: ListTodo, color: "text-blue-600", bg: "bg-blue-50" }] : []),
                ].map(({ label, value, icon: Icon, color, bg }) => (
                  <Card key={label}>
                    <CardContent className="flex items-center gap-3 p-4">
                      <div className={`h-9 w-9 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                        <Icon className={`h-5 w-5 ${color}`} />
                      </div>
                      <div>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
                        <p className="text-xs text-gray-500">{label}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="milestones" className="mt-4 space-y-3">
            {milestones.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Milestone className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p>No milestones defined yet.</p>
              </div>
            ) : (
              milestones.map((ms: any) => {
                const st = MILESTONE_STATUS[ms.status] || MILESTONE_STATUS.not_started;
                const Icon = st.icon;
                return (
                  <Card key={ms.id}>
                    <CardContent className="p-4 flex items-start gap-3">
                      <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${st.color}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm">{ms.name}</p>
                          <span className={`text-xs capitalize ${st.color}`}>{st.label}</span>
                        </div>
                        {ms.description && <p className="text-xs text-gray-500 mt-0.5">{ms.description}</p>}
                        {(ms.start_date || ms.end_date) && (
                          <p className="text-xs text-gray-400 mt-1">
                            {ms.start_date && format(new Date(ms.start_date), "MMM d")}
                            {ms.start_date && ms.end_date && " -> "}
                            {ms.end_date && format(new Date(ms.end_date), "MMM d, yyyy")}
                          </p>
                        )}
                      </div>
                      {access?.can_approve_milestones && ms.status === "completed" && (
                        <Badge className="bg-green-50 text-green-700 border-green-200 text-xs shrink-0">
                          <CheckCircle className="h-3 w-3 mr-1" /> Ready for Approval
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          {access?.can_view_defects && (
            <TabsContent value="defects" className="mt-4 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">{defects.length} defect{defects.length !== 1 ? "s" : ""} reported</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {access.can_edit_defects && <Badge variant="outline" className="text-[10px]">Edit enabled</Badge>}
                    {access.can_approve_defects && <Badge variant="outline" className="text-[10px]">Approval enabled</Badge>}
                  </div>
                </div>
                {access.can_create_defects && (
                  <Button size="sm" onClick={openCreateDefect}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Report Defect
                  </Button>
                )}
              </div>

              {defects.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Bug className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p>No defects reported.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {defects.map((defect: any) => (
                    <Card key={defect.id}>
                      <CardContent className="p-4 flex items-start gap-3">
                        <AlertTriangle
                          className={`h-4 w-4 mt-0.5 shrink-0 ${
                            defect.severity === "critical" || defect.severity === "high" ? "text-red-500" : "text-yellow-500"
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-sm">{defect.title}</p>
                            <Badge className={`text-[10px] border capitalize ${SEVERITY_COLORS[defect.severity] || ""}`}>
                              {defect.severity}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] capitalize">
                              {(defect.status || "").replace("_", " ")}
                            </Badge>
                          </div>
                          {defect.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{defect.description}</p>}
                          <p className="text-[10px] text-gray-400 mt-1">
                            {defect.created_at ? format(new Date(defect.created_at), "MMM d, yyyy") : ""}
                            {defect.reported_by ? ` | Reported by ${defect.reported_by}` : ""}
                          </p>
                        </div>
                        {canManageDefects && (
                          <Button variant="outline" size="sm" className="shrink-0" onClick={() => openManageDefect(defect)}>
                            <Pencil className="h-3.5 w-3.5 mr-1" />
                            {access.can_approve_defects ? "Edit" : "Edit"}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          )}

          {access?.can_view_tasks && (
            <TabsContent value="tasks" className="mt-4 space-y-3">
              {tasks.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <ListTodo className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p>No tasks linked to this project.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {tasks.map((task: any) => {
                    const priority = PRIORITY_MAP[task.priority as number] || { label: "-", color: "text-gray-400" };
                    return (
                      <Card key={task.id}>
                        <CardContent className="p-4 flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              {task.task_number && <span className="font-mono text-[10px] text-gray-400">#{task.task_number}</span>}
                              <p className="font-medium text-sm">{task.title}</p>
                              {task.status && (
                                <Badge variant="outline" className="text-[10px] capitalize">
                                  {(task.status || "").replace("_", " ")}
                                </Badge>
                              )}
                              <span className={`text-xs font-medium ${priority.color}`}>{priority.label}</span>
                            </div>
                            {task.due_date && (
                              <p className="text-[10px] text-gray-400 mt-1">
                                Due {format(new Date(task.due_date), "MMM d, yyyy")}
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </main>

      <Dialog open={defectDialog} onOpenChange={(open) => (!open ? closeDefectDialog() : setDefectDialog(true))}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bug className="h-4 w-4 text-orange-500" />
              {editingDefect ? "Update Defect" : "Report a Defect"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="bg-gray-50 dark:bg-gray-800/60 px-4 py-2.5 flex items-center gap-2 border-b dark:border-gray-700">
                <span className="h-5 w-5 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">1</span>
                <h3 className="text-sm font-semibold">Defect Details</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Title </Label>
                  <Input
                    className="h-10"
                    placeholder="Title of the defect"
                    value={defectForm.title}
                    onChange={(e) => setDefectForm((current) => ({ ...current, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Description *</Label>
                  <Textarea
                    rows={4}
                    placeholder="Brief description of the issue"
                    value={defectForm.description}
                    onChange={(e) => setDefectForm((current) => ({ ...current, description: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Steps to Reproduce *</Label>
                  <Input
                    className="h-10"
                    placeholder="Steps to reproduce"
                    value={defectForm.steps_to_reproduce}
                    onChange={(e) => setDefectForm((current) => ({ ...current, steps_to_reproduce: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Expected Behaviour</Label>
                  <Input
                    className="h-10"
                    placeholder="Expected behaviour"
                    value={defectForm.expected_behaviour}
                    onChange={(e) => setDefectForm((current) => ({ ...current, expected_behaviour: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Actual Behaviour *</Label>
                  <Input
                    className="h-10"
                    placeholder="Actual behaviour"
                    value={defectForm.actual_behaviour}
                    onChange={(e) => setDefectForm((current) => ({ ...current, actual_behaviour: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-orange-200 dark:border-orange-800/50 overflow-hidden">
              <div className="bg-orange-50 dark:bg-orange-900/20 px-4 py-2.5 flex items-center gap-2 border-b border-orange-200 dark:border-orange-800/50">
                <span className="h-5 w-5 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">2</span>
                <h3 className="text-sm font-semibold text-orange-800 dark:text-orange-300">Classification</h3>
              </div>
              <div className="p-4 grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Severity</Label>
                  <Select value={defectForm.severity} onValueChange={(value) => setDefectForm((current) => ({ ...current, severity: value }))}>
                    <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["critical", "high", "medium", "low"].map((value) => (
                        <SelectItem key={value} value={value} className="capitalize">
                          {value.charAt(0).toUpperCase() + value.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Type</Label>
                  <Select value={defectForm.type} onValueChange={(value) => setDefectForm((current) => ({ ...current, type: value }))}>
                    <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["bug", "regression", "performance", "ui", "security", "data"].map((value) => (
                        <SelectItem key={value} value={value} className="capitalize">
                          {value.charAt(0).toUpperCase() + value.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Environment</Label>
                  <Select value={defectForm.environment} onValueChange={(value) => setDefectForm((current) => ({ ...current, environment: value }))}>
                    <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["production", "staging", "qa", "development"].map((value) => (
                        <SelectItem key={value} value={value} className="capitalize">
                          {value.charAt(0).toUpperCase() + value.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {editingDefect && access?.can_approve_defects && (
              <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/50 overflow-hidden">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2.5 flex items-center gap-2 border-b border-emerald-200 dark:border-emerald-800/50">
                  <span className="h-5 w-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">3</span>
                  <h3 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Approval Status</h3>
                </div>
                <div className="p-4 space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Status</Label>
                    <Select value={defectForm.status} onValueChange={(value) => setDefectForm((current) => ({ ...current, status: value }))}>
                      <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["submitted", "approved", "rejected", "in_progress", "resolved", "verified", "closed", "reopened"].map((value) => (
                          <SelectItem key={value} value={value} className="capitalize">
                            {value.replace("_", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {defectForm.status === "rejected" && (
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Rejection Reason</Label>
                      <Textarea
                        rows={3}
                        placeholder="Explain why this defect was rejected"
                        value={defectForm.rejection_reason}
                        onChange={(e) => setDefectForm((current) => ({ ...current, rejection_reason: e.target.value }))}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDefectDialog}>Cancel</Button>
            <Button className="bg-orange-600 hover:bg-orange-700 text-white" onClick={submitDefect} disabled={submittingDefect}>
              {submittingDefect ? "Saving..." : editingDefect ? "Save Changes" : "Submit Defect"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

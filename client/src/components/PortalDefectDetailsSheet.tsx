import { format } from "date-fns";
import { Bug, ListTodo, MessageSquare } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-red-100 text-red-800 border-red-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  low: "bg-blue-100 text-blue-800 border-blue-200",
};

type Props = {
  defect: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function PortalDefectDetailsSheet({ defect, open, onOpenChange }: Props) {
  if (!defect) return null;

  const linkedTasks = Array.isArray(defect.linked_tasks) ? defect.linked_tasks : [];
  const comments = Array.isArray(defect.comments) ? defect.comments : [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[92vw] lg:w-[56vw] lg:min-w-[820px] max-w-none overflow-y-auto">
        <div className="space-y-6">
          <SheetHeader className="border-b pb-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <p className="text-xs font-mono text-muted-foreground">
                  {defect.defect_number ? `DEF-${String(defect.defect_number).padStart(5, "0")}` : "Defect"}
                </p>
                <SheetTitle className="text-xl flex items-center gap-2">
                  <Bug className="h-5 w-5 text-orange-500" />
                  {defect.title}
                </SheetTitle>
                <div className="flex flex-wrap gap-2">
                  <Badge className={`capitalize border ${SEVERITY_COLORS[defect.severity] || ""}`}>{defect.severity}</Badge>
                  <Badge variant="outline" className="capitalize">{(defect.status || "").replace(/_/g, " ")}</Badge>
                  {defect.type && <Badge variant="outline" className="capitalize">{defect.type}</Badge>}
                  {defect.environment && <Badge variant="outline" className="capitalize">{defect.environment}</Badge>}
                </div>
              </div>
            </div>
          </SheetHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-xs text-muted-foreground">Reported By</Label>
              <p className="font-medium">{defect.reported_by_name || defect.reported_by || "-"}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Assigned To</Label>
              <p className="font-medium">{defect.assigned_to_name || "-"}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Approved By</Label>
              <p className="font-medium">{defect.approved_by_name || "-"}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Assigned Project</Label>
              <p className="font-medium">{defect.project_name || "-"}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Created</Label>
              <p className="font-medium">{defect.created_at ? format(new Date(defect.created_at), "MMM d, yyyy") : "-"}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Due Date</Label>
              <p className="font-medium">{defect.due_date ? format(new Date(defect.due_date), "MMM d, yyyy") : "-"}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground uppercase">Description</Label>
              <p className="text-sm whitespace-pre-wrap mt-1">{defect.description || "-"}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase">Steps to Reproduce</Label>
              <p className="text-sm whitespace-pre-wrap mt-1">{defect.steps_to_reproduce || "-"}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground uppercase">Expected Behaviour</Label>
                <p className="text-sm whitespace-pre-wrap mt-1">{defect.expected_behavior || "-"}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground uppercase">Actual Behaviour</Label>
                <p className="text-sm whitespace-pre-wrap mt-1">{defect.actual_behavior || "-"}</p>
              </div>
            </div>
            {defect.rejection_reason && (
              <div>
                <Label className="text-xs text-muted-foreground uppercase">Rejection Reason</Label>
                <p className="text-sm whitespace-pre-wrap mt-1">{defect.rejection_reason}</p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ListTodo className="h-4 w-4 text-blue-500" />
              <h3 className="text-sm font-semibold">Assigned Tasks</h3>
            </div>
            {linkedTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tasks linked to this defect.</p>
            ) : (
              <div className="space-y-2">
                {linkedTasks.map((item: any) => (
                  <div key={item.id} className="rounded-lg border p-3">
                    <p className="font-medium text-sm">
                      {item.task?.task_number ? `#${item.task.task_number} ` : ""}{item.task?.title || "Task"}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {item.task?.status && <Badge variant="outline" className="capitalize text-[10px]">{item.task.status.replace(/_/g, " ")}</Badge>}
                      {item.linked_at && <span className="text-[11px] text-muted-foreground">Linked {format(new Date(item.linked_at), "MMM d, yyyy")}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-purple-500" />
              <h3 className="text-sm font-semibold">Comments</h3>
            </div>
            {comments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No comments yet.</p>
            ) : (
              <div className="space-y-2">
                {comments.map((comment: any) => (
                  <div key={comment.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium">{comment.commented_by_name}</p>
                      <span className="text-[11px] text-muted-foreground">
                        {comment.created_at ? format(new Date(comment.created_at), "MMM d, yyyy h:mm a") : ""}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap mt-2">{comment.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <SheetFooter>
            <SheetClose asChild>
              <Button variant="outline">Close</Button>
            </SheetClose>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}

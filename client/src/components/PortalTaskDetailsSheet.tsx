import { format } from "date-fns";
import { MessageSquare, Paperclip } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type Props = {
  task: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function PortalTaskDetailsSheet({ task, open, onOpenChange }: Props) {
  if (!task) return null;

  const comments = Array.isArray(task.comments) ? task.comments : [];
  const attachments = Array.isArray(task.attachments) ? task.attachments : [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[92vw] lg:w-[56vw] lg:min-w-[820px] max-w-none overflow-y-auto">
        <div className="space-y-6">
          <SheetHeader className="border-b pb-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {task.task_number && <span className="text-xs font-mono text-muted-foreground">#{task.task_number}</span>}
                <SheetTitle className="text-xl">{task.title}</SheetTitle>
              </div>
              <div className="flex flex-wrap gap-2">
                {task.status && <Badge variant="outline" className="capitalize">{task.status.replace(/_/g, " ")}</Badge>}
                {typeof task.priority !== "undefined" && <Badge variant="outline">Priority {task.priority}</Badge>}
                {task.type && <Badge variant="outline" className="capitalize">{task.type}</Badge>}
              </div>
            </div>
          </SheetHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-xs text-muted-foreground">Assigned To</Label>
              <p className="font-medium">{task.assigned_to_name || "-"}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Created By</Label>
              <p className="font-medium">{task.created_by_name || "-"}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Project</Label>
              <p className="font-medium">{task.project_name || "-"}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Milestone</Label>
              <p className="font-medium">{task.milestone_name || "-"}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Feature</Label>
              <p className="font-medium">{task.feature_name || "-"}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Due Date</Label>
              <p className="font-medium">{task.due_date ? format(new Date(task.due_date), "MMM d, yyyy") : "-"}</p>
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground uppercase">Description</Label>
            <div className="text-sm mt-1 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: task.description || "-" }} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-xs text-muted-foreground uppercase">Start Date</Label>
              <p className="font-medium mt-1">{task.start_date ? format(new Date(task.start_date), "MMM d, yyyy") : "-"}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase">Estimated Hours</Label>
              <p className="font-medium mt-1">{task.estimated_hours ?? "-"}</p>
            </div>
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
                      <p className="text-sm font-medium">{comment.acted_by_name}</p>
                      <span className="text-[11px] text-muted-foreground">
                        {comment.created_at ? format(new Date(comment.created_at), "MMM d, yyyy h:mm a") : ""}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap mt-2">{comment.new_value || "-"}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Paperclip className="h-4 w-4 text-blue-500" />
              <h3 className="text-sm font-semibold">Attachments</h3>
            </div>
            {attachments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No attachments.</p>
            ) : (
              <div className="space-y-2">
                {attachments.map((attachment: any) => (
                  <a
                    key={attachment.id}
                    href={attachment.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-lg border p-3 text-sm hover:bg-muted/40"
                  >
                    {attachment.filename}
                  </a>
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

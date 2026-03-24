import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { 
  Loader2, 
  BellRing, 
  CheckCircle2, 
  AlertTriangle,
  MailPlus,
  RefreshCcw,
  Clock,
  Users
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const Notificationsettings = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch current email & notification settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ["email-settings"],
    queryFn: async () => await apiClient.get("/email-settings"),
  });

  // Mutation for partial updates (PATCH)
  const mutation = useMutation({
    mutationFn: async (updates: Record<string, boolean>) => {
      return await apiClient.patch(`/email-settings/${settings.id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-settings"] });
      toast({
        title: "Configuration Updated",
        description: "Notification preferences have been synchronized with the database.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Sync Error",
        description: "SMTP Connection Inactive",
      });
    },
  });

  const handleToggle = (field: string, value: boolean) => {
    mutation.mutate({ [field]: value });
  };

  if (isLoading) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const toggleItems = [
    {
      id: "sendOnTaskCreate",
      label: "Task Creation",
    //   subLabel: "Event 1",
      description: "Trigger an automated email to the assignee immediately upon task instantiation.",
      icon: <MailPlus className="h-5 w-5" />,
    },
    {
      id: "sendOnTaskUpdate",
      label: "Task Updates",
    //   subLabel: "Event 2",
      description: "Notify users when task attributes, such as priority or status, are modified.",
      icon: <RefreshCcw className="h-5 w-5" />,
    },
    {
      id: "sendOnOverdue",
      label: "Overdue Alerts",
    //   subLabel: "Event 3",
      description: "Enable system-wide daily scans to notify assignees of tasks exceeding their due date.",
      icon: <Clock className="h-5 w-5" />,
    },
    {
      id: "sendOnGroupAddition",
      label: "Task Group Membership",
    //   subLabel: "Event 4",
      description: "Dispatch notification when a user is associated with a specific task group.",
      icon: <Users className="h-5 w-5" />,
    },
  ];

  return (
    <div className="w-full space-y-6">
      <Card className="w-full border-none shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <BellRing className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Notification Configuration</CardTitle>
              <CardDescription>
                Define the automation logic for outgoing system communication.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Full Width Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-4">
            {toggleItems.map((item) => (
              <div 
                key={item.id} 
                className="flex items-center justify-between p-5 border rounded-xl hover:bg-accent/10 transition-colors shadow-sm bg-card"
              >
                <div className="flex items-start gap-4">
                  {/* <div className="mt-1 text-muted-foreground italic font-mono text-xs w-12 shrink-0">
                    {item.subLabel}
                  </div> */}
                  <div className="space-y-1">
                    <Label 
                      htmlFor={item.id} 
                      className="text-base font-semibold flex items-center gap-2 cursor-pointer"
                    >
                      {item.icon} {item.label}
                    </Label>
                    <p className="text-sm text-muted-foreground max-w-sm leading-snug">
                      {item.description}
                    </p>
                  </div>
                </div>
                <Switch
                  id={item.id}
                  checked={settings?.[item.id] || false}
                  onCheckedChange={(checked) => handleToggle(item.id, checked)}
                  disabled={mutation.isPending}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            ))}
          </div>

          {/* System Status Alert */}
          {!settings?.isActive && (
            <div className="mt-6 flex items-center gap-3 p-4 bg-destructive/5 border border-destructive/20 rounded-xl text-destructive">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <div className="text-sm">
                <span className="font-bold">SMTP Connection Inactive:</span> Notifications are currently queued but will not be dispatched until the Email Provider is enabled.
              </div>
            </div>
          )}
          
          {settings?.isActive && (
            <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground px-1">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              System is ready to dispatch emails based on the toggles above.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Notificationsettings;
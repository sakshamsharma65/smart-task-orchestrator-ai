import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Loader2, Trash2 } from "lucide-react";
import { apiClient } from "@/lib/api";

// ========================
// Schema
// ========================
const schema = z.object({
  provider: z.string(),
  displayName: z.string().min(1, "Name is required"),
  host: z.string().optional(),
  port: z.number().optional(),
  secure: z.boolean(),
  username: z.string().optional(),
  password: z.string().optional(),
  fromEmail: z.string().email("Invalid email"),
  fromName: z.string().min(1, "Sender name is required"),
  verificationTestEmail: z.string().email("Invalid test email"),
});

type FormValues = z.infer<typeof schema>;

const EmailManager = () => {
  const queryClient = useQueryClient();

  // ========================
  // Fetch existing settings
  // ========================
  const { data: settings, isLoading } = useQuery({
    queryKey: ["email-settings"],
    queryFn: async () => {
      // apiClient adds '/api' prefix automatically
      return await apiClient.get("/email-settings");
    },
  });

  // ========================
  // Form Initialization
  // ========================
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      provider: "smtp",
      displayName: "",
      host: "",
      port: 587,
      secure: false,
      username: "",
      password: "",
      fromEmail: "",
      fromName: "",
      verificationTestEmail: "",
    },
  });

  // Prefill form when data is loaded
  useEffect(() => {
    if (!settings) return;
    form.reset({
      ...settings,
      password: "", // Security: Don't show password in UI
      verificationTestEmail: settings.verificationTestEmail || "",
    });
  }, [settings, form]);

  // ========================
  // Mutations
  // ========================
  const saveMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      if (settings?.id) {
        // UPDATE existing (Backend uses .patch("/:id"))
        return await apiClient.patch(`/email-settings/${settings.id}`, data);
      } else {
        // CREATE new
        return await apiClient.post("/email-settings", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-settings"] });
      alert("Settings saved successfully!");
    },
    onError: (error: Error) => alert(`Save failed: ${error.message}`),
  });

  const testMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      return await apiClient.post("/email-settings/test", data);
    },
    onSuccess: () => alert("Test email sent successfully!"),
    onError: (error: Error) => alert(`Test failed: ${error.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return await apiClient.delete(`/email-settings/${settings.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-settings"] });
      form.reset();
      alert("Deleted");
    },
  });

  // ========================
  // Handlers
  // ========================
  const onSave = (data: FormValues) => saveMutation.mutate(data);

  const onTest = () => {
    const values = form.getValues();
    if (!values.verificationTestEmail) {
      alert("Please provide a test email address first.");
      return;
    }
    testMutation.mutate(values);
  };

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Email Configuration</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
          
          <div>
            <Label>Provider</Label>
            <Select 
              value={form.watch("provider")} 
              onValueChange={(v) => form.setValue("provider", v)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="smtp">SMTP</SelectItem>
                <SelectItem value="gmail">Gmail</SelectItem>
                <SelectItem value="sendgrid">SendGrid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Config Name</Label>
              <Input {...form.register("displayName")} placeholder="e.g. Primary SMTP" />
            </div>
            <div>
              <Label>Host</Label>
              <Input {...form.register("host")} placeholder="smtp.example.com" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Port</Label>
              <Input type="number" {...form.register("port", { valueAsNumber: true })} />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <Switch 
                checked={form.watch("secure")} 
                onCheckedChange={(v) => form.setValue("secure", v)} 
              />
              <Label>Use Secure TLS</Label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Username</Label>
              <Input {...form.register("username")} />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" {...form.register("password")} placeholder="••••••••" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>From Email</Label>
              <Input {...form.register("fromEmail")} />
            </div>
            <div>
              <Label>From Name</Label>
              <Input {...form.register("fromName")} />
            </div>
          </div>

          <hr className="my-4" />

          <div>
            <Label className="text-blue-600">Verification Test Email</Label>
            <Input {...form.register("verificationTestEmail")} placeholder="Send test to this address..." />
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onTest} 
              disabled={testMutation.isPending}
            >
              {testMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Test
            </Button>

            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Configuration
            </Button>

            {settings?.id && (
              <Button 
                type="button" 
                variant="destructive" 
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default EmailManager;
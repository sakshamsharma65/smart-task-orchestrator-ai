
import React, { useState } from "react";
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { useRoles } from "@/hooks/useRoles";
import { useDepartments } from "@/hooks/useDepartments";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { apiCreateUser } from "@/integrations/supabase/apiCreateUser";
import { useUserList } from "@/hooks/useUserList";
import { useQuery } from "@tanstack/react-query";
import { Toast } from "@radix-ui/react-toast";

interface CreateUserDialogProps {
  onUserCreated?: () => void;
  organization?: string; // (Optional) if passed, use as default org
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}


const initialValues = {
  email: "",
  password: "",
  user_name: "",
  department: "",
  phone: "",
  manager: "",
  role:"",
  // Benchmarking override fields
  benchmarking_excluded: false,
  custom_min_hours_per_day: "",
  custom_max_hours_per_day: "",
  custom_min_hours_per_week: "",
  custom_max_hours_per_week: "",
  custom_min_hours_per_month: "",
  custom_max_hours_per_month: "",
};

const CreateUserDialog: React.FC<CreateUserDialogProps> = ({
  onUserCreated,
  organization,
  open,
  onOpenChange,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [values, setValues] = useState(initialValues);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { roles, loading: rolesLoading } = useRoles();
  // Use external control if provided, otherwise use internal state
  const isOpen = open !== undefined ? open : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;

  // Departments logic refactored into useDepartments
  const { departments, loading: departmentsLoading } = useDepartments();
  // Current admin logic refactored into useCurrentUser
  const currentUser = useCurrentUser(organization);
  // All users for manager dropdown
  const { users: allUsers, loading: usersLoading } = useUserList();
  console.log(' Saksham All users for manager dropdown:', allUsers);
  // Define the type for organization settings
  interface OrgSettings {
    allow_user_level_override?: boolean;
    benchmarking_enabled?: boolean;
    min_hours_per_day?: number;
    max_hours_per_day?: number;
    min_hours_per_week?: number;
    max_hours_per_week?: number;
    min_hours_per_month?: number;
    max_hours_per_month?: number;
    // Add any other fields as needed
    [key: string]: any;
  }
  

  // Organization settings for benchmarking overrides
 const { data: orgSettings } = useQuery({
    queryKey: ['/api/organization-settings'],
    enabled: isOpen,
  });


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setValues((v) => ({ ...v, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
      const minDay = Number(values.custom_min_hours_per_day);
  const maxDay = Number(values.custom_max_hours_per_day);
  const minWeek = Number(values.custom_min_hours_per_week);
  const maxWeek = Number(values.custom_max_hours_per_week);
  const minMonth = Number(values.custom_min_hours_per_month);
  const maxMonth = Number(values.custom_max_hours_per_month);
   if (minDay && maxDay && minDay > maxDay) {
    toast({
      title: "Validation Error",
      description: "Min hours per day cannot be greater than max hours per day.",
      variant: "destructive",
    });
    setLoading(false);
    return;
  }

  if (minWeek && maxWeek && minWeek > maxWeek) {
    toast({
      title: "Validation Error",
      description: "Min hours per week cannot be greater than max hours per week.",
      variant: "destructive",
    });
    setLoading(false);
    return;
  }

  if (minMonth && maxMonth && minMonth > maxMonth) {
    toast({
      title: "Validation Error",
      description: "Min hours per month cannot be greater than max hours per month.",
      variant: "destructive",
    });
    setLoading(false);
    return;
  }

    try {
      const { email, password, user_name, department, phone, manager,role, 
              benchmarking_excluded, custom_min_hours_per_day, custom_max_hours_per_day,
              custom_min_hours_per_week, custom_max_hours_per_week, 
              custom_min_hours_per_month, custom_max_hours_per_month } = values;
      
      // Only assign "user" role by default, admins can update roles after
      const payload = {
        email,
        password,
        user_name,
        department,
        phone,
        manager,
        role,
        // Include benchmarking overrides if organization allows them
        ...(orgSettings?.allow_user_level_override && {
          benchmarking_excluded,
          custom_min_hours_per_day: custom_min_hours_per_day ? parseInt(custom_min_hours_per_day) : null,
          custom_max_hours_per_day: custom_max_hours_per_day ? parseInt(custom_max_hours_per_day) : null,
          custom_min_hours_per_week: custom_min_hours_per_week ? parseInt(custom_min_hours_per_week) : null,
          custom_max_hours_per_week: custom_max_hours_per_week ? parseInt(custom_max_hours_per_week) : null,
          custom_min_hours_per_month: custom_min_hours_per_month ? parseInt(custom_min_hours_per_month) : null,
          custom_max_hours_per_month: custom_max_hours_per_month ? parseInt(custom_max_hours_per_month) : null,
        }),
      };
      const result = await apiCreateUser(payload);

      toast({
        title: "User created successfully",
        description: `User "${user_name || email}" was created.`,
      });

      setIsOpen(false);
      setValues(initialValues);
      setLoading(false);
      onUserCreated?.();
    } catch (err: any) {
      setError(err.message || "Could not create user");
      toast({
        title: "Failed to create user",
        description: err.message || "An error occurred",
      });
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {/* Only show trigger if not externally controlled */}
      {open === undefined && (
        <DialogTrigger asChild>
          <Button className="w-full md:w-auto gap-2" size="sm">
            <span>+ Create User</span>
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Fill in the details to register a new user.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Input
              name="email"
              type="email"
              placeholder="Email"
              required
              value={values.email}
              onChange={handleChange}
              disabled={loading}
            />
            <Input
              name="password"
              type="password"
              placeholder="Password"
              required
              value={values.password}
              onChange={handleChange}
              disabled={loading}
            />
            <Input
              name="user_name"
              required
              placeholder="Full Name"
              value={values.user_name}
              onChange={handleChange}
              disabled={loading}
            />
          <select
  name="role"
  className="border rounded px-2 py-2 text-sm bg-background"
  value={values.role}
  onChange={handleChange}
  disabled={loading || rolesLoading}
  required
>
  <option value="">
    {rolesLoading ? "Loading roles..." : "Select role"}
  </option>
  {roles.map((role) => (
    <option key={role.id} value={role.id}>
      {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
    </option>
  ))}
</select>

            <select
              name="department"
              className="border rounded px-2 py-2 text-sm bg-background"
              value={values.department}
              onChange={handleChange}
              disabled={loading || departmentsLoading}
              required
            >
              <option value="">{departmentsLoading ? "Loading departments..." : "Select department"}</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.name}>
                  {dept.name}
                </option>
              ))}
            </select>
            <Input
              name="phone"
              placeholder="Phone"
              value={values.phone}
              onChange={handleChange}
              disabled={loading}
            />
            {/* MANAGER DROPDOWN */}
            <select
              name="manager"
              className="border rounded px-2 py-2 text-sm bg-background"
              value={values.manager}
              onChange={handleChange}
              disabled={loading || usersLoading}
            >
              <option value="">Select Manager</option>
              {allUsers.filter(u=>u.role_name ==='manager' && u.is_active ).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.user_name ? `${u.user_name} (${u.email})` : u.email}
                </option>
              ))}
            </select>
            
            {/* BENCHMARKING OVERRIDES SECTION */}
            {orgSettings?.benchmarking_enabled && orgSettings?.allow_user_level_override && (
              <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
                <h4 className="text-sm font-semibold">Benchmarking Overrides</h4>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="benchmarking_excluded"
                    name="benchmarking_excluded"
                    checked={values.benchmarking_excluded}
                    onChange={(e) => setValues(v => ({ ...v, benchmarking_excluded: e.target.checked }))}
                    disabled={loading}
                    className="rounded"
                  />
                  <label htmlFor="benchmarking_excluded" className="text-sm">
                    Exclude from benchmarking analysis
                  </label>
                </div>
                
                {!values.benchmarking_excluded && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground">Min Hours/Day</label>
                      <Input
                        name="custom_min_hours_per_day"
                        type="number"
                        min="0"
                        placeholder={`Default: ${orgSettings?.min_hours_per_day || 0}`}
                        value={values.custom_min_hours_per_day}
                        onChange={handleChange}
                        disabled={loading}
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Max Hours/Day</label>
                      <Input
                        name="custom_max_hours_per_day"
                        type="number"
                        min="0"
                        placeholder={`Default: ${orgSettings?.max_hours_per_day || 8}`}
                        value={values.custom_max_hours_per_day}
                        onChange={handleChange}
                        disabled={loading}
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Min Hours/Week</label>
                      <Input
                        name="custom_min_hours_per_week"
                        type="number"
                        min="0"
                        placeholder={`Default: ${orgSettings?.min_hours_per_week || 0}`}
                        value={values.custom_min_hours_per_week}
                        onChange={handleChange}
                        disabled={loading}
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Max Hours/Week</label>
                      <Input
                        name="custom_max_hours_per_week"
                        type="number"
                        min="0"
                        placeholder={`Default: ${orgSettings?.max_hours_per_week || 40}`}
                        value={values.custom_max_hours_per_week}
                        onChange={handleChange}
                        disabled={loading}
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Min Hours/Month</label>
                      <Input
                        name="custom_min_hours_per_month"
                        type="number"
                        min="0"
                        placeholder={`Default: ${orgSettings?.min_hours_per_month || 0}`}
                        value={values.custom_min_hours_per_month}
                        onChange={handleChange}
                        disabled={loading}
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Max Hours/Month</label>
                      <Input
                        name="custom_max_hours_per_month"
                        type="number"
                        min="0"
                        placeholder={`Default: ${orgSettings?.max_hours_per_month || 160}`}
                        value={values.custom_max_hours_per_month}
                        onChange={handleChange}
                        disabled={loading}
                        className="text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {error && (<div className="text-red-600 text-sm">{error}</div>)}
          </div>
    
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create"}
            </Button>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={loading}>
                Cancel
              </Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateUserDialog;

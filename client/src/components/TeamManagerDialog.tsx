import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { apiClient } from "@/lib/api";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel
} from "@/components/ui/alert-dialog";

interface User {
  id: string;
  email: string;
  user_name?: string;
}

interface Team {
  id: string;
  name: string;
  description?: string | null;
  created_by: string;
}

interface TeamMember {
  id: string;
  user_id: string;
  role_within_team: string | null;
  joined_at: string | null;
  user: User;
}

interface TeamManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team?: Team | null;
  onTeamUpdated?: () => void;
}

const TeamManagerDialog: React.FC<TeamManagerDialogProps> = ({
  open,
  onOpenChange,
  team,
  onTeamUpdated,
}) => {
  const isEdit = Boolean(team);

  const [saving, setSaving] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [teamDesc, setTeamDesc] = useState("");
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [managerId, setManagerId] = useState<string>("");
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Reload manager when members change
  useEffect(() => {
    if (!open) return;

    const currentManager = members.find(m => m.role_within_team === "manager");
    if (currentManager) {
      setManagerId(currentManager.user_id);
    } else {
      setManagerId("");
    }
  }, [members, open]);

  // Reset when closing dialog
  useEffect(() => {
    if (!open) {
      setTeamName("");
      setTeamDesc("");
      setSelectedUserIds([]);
      setMembers([]);
      setManagerId("");
    } else if (open && team) {
      setTeamName(team.name || "");
      setTeamDesc(team.description || "");
    }
  }, [open, team]);

  // Load all users
  useEffect(() => {
    if (!open) return;

    apiClient.getUsers().then(setAllUsers).catch(() => {
      toast({ title: "Failed to load users" });
    });
  }, [open]);

  // Load team members when editing
  useEffect(() => {
    if (!open || !team) return;

    async function loadMembers() {
      try {
        const teamMembers = await apiClient.getTeamMembers(team.id);
        if (!teamMembers) return;

        const users = await apiClient.getUsers();
        const usersById: Record<string, User> = {};
        users.forEach((u) => (usersById[u.id] = u));

        const enriched = teamMembers
          .filter((m: any) => usersById[m.user_id])
          .map((m: any) => ({
            id: m.id,
            joined_at: m.joined_at,
            role_within_team: m.role_within_team,
            user_id: m.user_id,
            user: usersById[m.user_id],
          }));

        setMembers(enriched);
        setSelectedUserIds(enriched.map(m => m.user_id));
      } catch (err) {
        toast({ title: "Failed to load team members" });
      }
    }

    loadMembers();
  }, [open, team]);

  // -----------------------------
  // IMPORTANT NEW LOGIC
  // -----------------------------

  const currentManagerRemoved =
    isEdit &&
    managerId &&
    !selectedUserIds.includes(managerId);

  useEffect(() => {
    // If manager removed from selected members → clear managerId
    if (managerId && !selectedUserIds.includes(managerId)) {
      setManagerId("");
    }
  }, [selectedUserIds]);

  // -----------------------------
  // SAVE handler
  // -----------------------------

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (currentManagerRemoved) {
      toast({
        title: "Manager invalid",
        description: "Select a valid manager before updating."
      });
      return;
    }

    if (!managerId) {
      toast({ title: "Please select a team manager." });
      return;
    }

    setSaving(true);

    let teamId = team?.id;

    // Create new team
    if (!teamId) {
      const newTeam = await apiClient.createTeam({
        name: teamName,
        description: teamDesc,
      });
      teamId = newTeam.id;
    } else {
      // Update existing team basics
      await apiClient.updateTeam(teamId, {
        name: teamName,
        description: teamDesc,
      });
    }

    // Sync memberships
    const existing = await apiClient.getTeamMembers(teamId);
    const existingIds = existing.map((m: any) => m.user_id);

    const toAdd = selectedUserIds.filter(id => !existingIds.includes(id));
    const toRemove = existingIds.filter(id => !selectedUserIds.includes(id));

    // Prevent removing current manager
    for (const userId of toRemove) {
      if (userId === managerId) continue;
      await apiClient.removeTeamMember(teamId, userId);
    }

    for (const userId of toAdd) {
      await apiClient.addTeamMember(teamId, userId);
    }

    // Assign manager
    await apiClient.updateTeam(teamId, { manager_id: managerId });
    await apiClient.addTeamMember(teamId, managerId, "manager");

    toast({ title: isEdit ? "Team updated!" : "Team created!" });

    setSaving(false);
    onOpenChange(false);
    onTeamUpdated?.();
  }

  // -----------------------------
  // DELETE handler
  // -----------------------------

  async function handleDeleteTeam() {
    if (!team) return;

    setSaving(true);
    await apiClient.deleteTeam(team.id);
    toast({ title: "Team deleted" });

    setSaving(false);
    setDeleteOpen(false);
    onOpenChange(false);
    onTeamUpdated?.();
  }

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Team" : "Create Team"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">

          {/* TEAM NAME */}
          <div>
            <label className="block text-xs mb-1 text-muted-foreground">Team Name</label>
            <Input value={teamName} onChange={e => setTeamName(e.target.value)} required />
          </div>

          {/* TEAM DESC */}
          <div>
            <label className="block text-xs mb-1 text-muted-foreground">Description</label>
            <Input value={teamDesc} onChange={e => setTeamDesc(e.target.value)} />
          </div>

          {/* USERS CHECKBOX */}
          <div>
            <label className="block text-xs mb-1 text-muted-foreground">Assign Users</label>
            <div className="max-h-40 overflow-y-auto border rounded p-2">
              {allUsers.map(user => (
                <div key={user.id} className="flex items-center gap-2 mb-1">
                  <input
                    type="checkbox"
                    checked={selectedUserIds.includes(user.id)}
                    onChange={e => {
                      if (e.target.checked) {
                        setSelectedUserIds(prev => [...prev, user.id]);
                      } else {
                        // Prevent removing current manager unless new chosen
                        if (user.id === managerId) {
                          toast({
                            title: "Cannot remove manager",
                            description: "Assign a new manager before removing this one.",
                          });
                          return;
                        }
                        setSelectedUserIds(prev => prev.filter(id => id !== user.id));
                      }
                    }}
                  />
                  <label>{user.user_name || user.email}</label>
                </div>
              ))}
            </div>
          </div>

          {/* MANAGER SELECT */}
          <div>
            <label className="block text-xs mb-1 text-muted-foreground">Team Manager</label>

            <Select
              value={managerId}
              onValueChange={setManagerId}
              disabled={selectedUserIds.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a manager" />
              </SelectTrigger>
              <SelectContent>
                {allUsers
                  .filter(u => selectedUserIds.includes(u.id))
                  .map(u => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.user_name || u.email}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* FOOTER */}
          <DialogFooter>
            <Button variant="ghost" type="button" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>

            {isEdit && (
              <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Delete Team</Button>
                </AlertDialogTrigger>

                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete This Team?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive" onClick={handleDeleteTeam}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            <Button
              type="submit"
              disabled={
                saving ||
                !teamName ||
                !managerId ||
                currentManagerRemoved
              }
            >
              {isEdit ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>

      </DialogContent>
    </Dialog>
  );
};

export default TeamManagerDialog;

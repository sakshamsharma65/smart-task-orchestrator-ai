import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Bug,Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import useSupabaseSession from "@/hooks/useSupabaseSession";
import { useCurrentUserRoleAndTeams } from "@/hooks/useCurrentUserRoleAndTeams";
import { useUsersAndTeams } from "@/hooks/useUsersAndTeams";
import { format } from "date-fns";
import CreateDefectSheet from "@/components/CreateDefectSheet";
import DefectDetailsSheet from "@/components/DefectDetailsSheet";
import { formatOrgDate } from "@/lib/dateUtils";
import * as XLSX from "xlsx";


const SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-red-100 text-red-800 border-red-200",
  high:     "bg-orange-100 text-orange-800 border-orange-200",
  medium:   "bg-yellow-100 text-yellow-800 border-yellow-200",
  low:      "bg-green-100 text-green-800 border-green-200",
};

const STATUS_COLORS: Record<string, string> = {
  draft:       "bg-gray-100 text-gray-600 border-gray-200",
  submitted:   "bg-blue-100 text-blue-800 border-blue-200",
  approved:    "bg-emerald-100 text-emerald-800 border-emerald-200",
  rejected:    "bg-red-100 text-red-800 border-red-200",
  in_progress: "bg-purple-100 text-purple-800 border-purple-200",
  resolved:    "bg-teal-100 text-teal-800 border-teal-200",
  verified:    "bg-emerald-100 text-emerald-800 border-emerald-200",
  closed:      "bg-gray-200 text-gray-700 border-gray-300",
  reopened:    "bg-red-100 text-red-800 border-red-200",
};

function formatDefectNumber(n: number) {
  return `DEF-${String(n).padStart(5, "0")}`;
}

export default function DefectsPage() {

      // ── Excel export helper ────────────────────────────────────────────────────
  function downloadExcel(
    filename: string,
    sheetName: string,
    headers: string[],
    rows: (string | number | null | undefined)[][],
    metaRows?: string[][]
  ) {
    const wb = XLSX.utils.book_new();
    const sheetData: (string | number | null | undefined)[][] = [];

    // Optional metadata rows at top
    if (metaRows) {
      metaRows.forEach((r) => sheetData.push(r));
      sheetData.push([]);
    }

    sheetData.push(headers);
    rows.forEach((r) => sheetData.push(r));

    const ws = XLSX.utils.aoa_to_sheet(sheetData);

    // Auto-fit columns (rough approximation)
    const colWidths = headers.map((h, ci) => {
      const maxLen = Math.max(
        h.length,
        ...rows.map((r) => String(r[ci] ?? "").length)
      );
      return { wch: Math.min(Math.max(maxLen + 2, 10), 50) };
    });
    ws["!cols"] = colWidths;

    // Style the header row (bold) via a simple comment — xlsx-light doesn't support full styles
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${filename}_${formatOrgDate(new Date(), "yyyy-MM-dd")}.xlsx`);
  }

  const { user } = useSupabaseSession();
  const { roles } = useCurrentUserRoleAndTeams();
  const { users } = useUsersAndTeams();
  const queryClient = useQueryClient();

  const isAdmin = roles.includes("admin");
  const isManager = roles.includes("manager") || roles.includes("team_manager");

  const [search, setSearch] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterEnv, setFilterEnv] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedDefect, setSelectedDefect] = useState<any>(null);

  const { data: defects = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/defects"],
    queryFn: () => apiClient.get("/defects"),
  });
  const { data: projectList = [] } = useQuery<any[]>({
  queryKey: ["/api/projects"],
  queryFn: () => apiClient.get("/projects"),
});
const getProjectName = (projectId: string | null) => {
  if (!projectId) return "—";

  const project = projectList.find((p) => p.id === projectId);

  return project?.name || "Unknown";
};
  const filtered = useMemo(() => {
    return defects.filter((d) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        d.id ||
        d.title.toLowerCase().includes(q) ||
        formatDefectNumber(d.defect_number).toLowerCase().includes(q) ||
        (d.description || "").toLowerCase().includes(q);
      const matchesSeverity = filterSeverity === "all" || d.severity === filterSeverity;
      const matchesStatus   = filterStatus   === "all" || d.status   === filterStatus;
      const matchesType     = filterType     === "all" || d.type     === filterType;
      const matchesEnv      = filterEnv      === "all" || d.environment === filterEnv;
      return matchesSearch && matchesSeverity && matchesStatus && matchesType && matchesEnv ;
    });
  }, [defects, search, filterSeverity, filterStatus, filterType, filterEnv]);

  const getUserName = (id: string | null) => {
    if (!id) return "—";
    const u = users.find((u) => u.id === id);
    return u ? u.user_name || u.email : "—";
  };

  return (
    <div className="w-full min-h-screen bg-background">
      <div className="px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Bug className="w-6 h-6 text-orange-500" />
            <h1 className="text-2xl font-semibold">Defects</h1>
            <Badge variant="outline" className="ml-1">{defects.length} total</Badge>
          </div>
          <div className="flex item-center gap-2">
            <Button onClick={() => setCreateOpen(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> Report Defect
            </Button>
            <Button
                variant="outline"
                size="sm"
                className="gap-1.5 h-8 text-xs shrink-0"
                onClick={() => {
                  const meta = [["Defect Status Report"], [`Generated: ${formatOrgDate(new Date(), "PPP")}`]];
                  const headers = ["ID", "Title", "Severity", "Status", "Type", "Env", "Project", "Assigned To", "Reported On"];
                  const rows = filtered.map((d) => {
                    return [
                      formatDefectNumber(d.defect_number),
                      d.title,
                      d.severity,
                      d.status,
                      d.type,
                      d.environment,
                      getProjectName(d.project_id),
                      getUserName(d.assigned_to),
                      d.created_at ? formatOrgDate(new Date(d.created_at), "d MMM yyyy") : ""
                    ];
                  });
                  downloadExcel("Defect_Status_Report", "Status Report", headers, rows, meta);
                }}
              >
                <Download className="h-3.5 w-3.5" /> Export Excel
              </Button>
            </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-5">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search defects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterSeverity} onValueChange={setFilterSeverity}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Severity" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="reopened">Reopened</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="bug">Bug</SelectItem>
              <SelectItem value="regression">Regression</SelectItem>
              <SelectItem value="performance">Performance</SelectItem>
              <SelectItem value="ui">UI</SelectItem>
              <SelectItem value="security">Security</SelectItem>
              <SelectItem value="data">Data</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterEnv} onValueChange={setFilterEnv}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Environment" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Environments</SelectItem>
              <SelectItem value="production">Production</SelectItem>
              <SelectItem value="staging">Staging</SelectItem>
              <SelectItem value="qa">QA</SelectItem>
              <SelectItem value="development">Development</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground">Loading defects…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Bug className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>{defects.length === 0 ? "No defects reported yet." : "No defects match your filters."}</p>
            {defects.length === 0 && (
              <Button variant="outline" className="mt-4" onClick={() => setCreateOpen(true)}>
                Report First Defect
              </Button>
            )}
          </div>
        ) : (
          <div className="rounded-lg border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left p-3 font-medium text-muted-foreground w-28">ID</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Title</th>
                  <th className="text-left p-3 font-medium text-muted-foreground w-24">Severity</th>
                  <th className="text-left p-3 font-medium text-muted-foreground w-28">Status</th>
                  <th className="text-left p-3 font-medium text-muted-foreground w-24">Type</th>
                  <th className="text-left p-3 font-medium text-muted-foreground w-24">Env</th>
                  <th className="text-left p-3 font-medium text-muted-foreground w-40">Project</th>
                  <th className="text-left p-3 font-medium text-muted-foreground w-36">Assigned To</th>
                  <th className="text-left p-3 font-medium text-muted-foreground w-28">Reported on </th>
                  
                </tr>
              </thead>
              <tbody>
                {filtered.map((defect) => (
                  <tr
                    key={defect.id}
                    className="border-b last:border-0 hover:bg-muted/20 cursor-pointer transition-colors"
                    onClick={() => setSelectedDefect(defect)}
                  >
                    <td className="p-3 font-mono text-xs text-muted-foreground">
                      {formatDefectNumber(defect.defect_number)}
                    </td>
                    <td className="p-3 font-medium max-w-xs truncate">{defect.title}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${SEVERITY_COLORS[defect.severity] || ""}`}>
                        {defect.severity}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center whitespace-nowrap px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${STATUS_COLORS[defect.status] || ""}`}>
                        {defect.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-3 capitalize text-muted-foreground">{defect.type}</td>
                    <td className="p-3 capitalize text-muted-foreground">{defect.environment}</td>
                     <td className="p-3 text-muted-foreground">{getProjectName(defect.project_id)}</td>
                    <td className="p-3 text-muted-foreground">{getUserName(defect.assigned_to)}</td>
                    <td className="p-3 text-muted-foreground">
                      {defect.created_at ? formatOrgDate(defect.created_at) : "—"}
                    </td>
                 
                   
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreateDefectSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        currentUserId={user?.id || ""}
      />

      {selectedDefect && (
        <DefectDetailsSheet
          defect={selectedDefect}
          open={!!selectedDefect}
          onOpenChange={(open) => { if (!open) setSelectedDefect(null); }}
          currentUserId={user?.id || ""}
          isAdmin={isAdmin}
          isManager={isManager}
          onUpdated={(updated) => {
            setSelectedDefect(updated);
            queryClient.invalidateQueries({ queryKey: ["/api/defects"] });
          }}
        />
      )}
    </div>
  );
}
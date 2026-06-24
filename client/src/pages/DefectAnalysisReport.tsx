import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Filter, BarChart3, AlertCircle, Activity, Bug } from "lucide-react";
import * as XLSX from "xlsx";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient } from "@/lib/api";
// --- Interfaces ---
interface DefectAnalysisReportResponse {
  metrics: {
    total: number;
    open: number;
    closed: number;
    reopened: number;
    severities: { critical: number; high: number; medium: number; low: number; };
    aging: { zeroToThree: number; fourToSeven: number; greaterThanSeven: number; };
  };
  rootCauses: { category: string; count: number; remarks: string; }[];
  reporters: { resourceName: string; count: number; }[];
  developerMatrix: {
    developerName: string;
    totalDefects: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  }[];
  defects?: DetailedDefectAnalysisRow[];
}

interface DetailedDefectAnalysisRow {
  id: string;
  defectNumber: number | null;
  title: string;
  description: string | null;
  stepsToReproduce: string | null;
  expectedBehavior: string | null;
  actualBehavior: string | null;
  severity: string;
  priority: number | null;
  status: string;
  type: string;
  environment: string | null;
  projectName: string;
  teamName: string;
  reporterName: string;
  assignedToName: string;
  assignedByName: string;
  approvedByName: string;
  rootCauseAnalysis: string;
  resolution: string | null;
  rejectionReason: string | null;
  dueDate: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  approvedAt: string | null;
  resolvedAt: string | null;
  verifiedAt: string | null;
  ageDays: number;
  resolutionDays: number | null;
  attachmentCount: number;
  linkedTaskCount: number;
}

const ROOT_CAUSE_OPTIONS = [
  "Lack of Knowledge",
  "Lack of Training",
  "Requirement Changes",
  "Coding Error",
  "Design Issue",
  "Environment Issue"
];

type ExcelCell = string | number | null | undefined;

const formatExcelDate = (value?: string | null) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString();
};

const formatLabel = (value?: string | null) => {
  if (!value) return "";

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const stripHtml = (value?: string | null) => {
  if (!value) return "";

  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
};

const defectDisplayNumber = (defect: DetailedDefectAnalysisRow) => {
  if (!defect.defectNumber) return defect.id;
  return `DEF-${String(defect.defectNumber).padStart(5, "0")}`;
};

const appendWorksheet = (
  wb: XLSX.WorkBook,
  sheetName: string,
  rows: ExcelCell[][],
  enableFilter = true
) => {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const columnCount = Math.max(...rows.map((row) => row.length));

  ws["!cols"] = Array.from({ length: columnCount }, (_, columnIndex) => {
    const maxLength = Math.max(
      ...rows.map((row) => String(row[columnIndex] ?? "").length)
    );
    return { wch: Math.min(Math.max(maxLength + 2, 12), 60) };
  });

  if (enableFilter && rows.length > 1 && columnCount > 0) {
    ws["!autofilter"] = {
      ref: XLSX.utils.encode_range({
        s: { r: 0, c: 0 },
        e: { r: rows.length - 1, c: columnCount - 1 },
      }),
    };
  }

  XLSX.utils.book_append_sheet(wb, ws, sheetName);
};

export default function DefectAnalysisReport() {
  const [projectId, setProjectId] = useState<string>("all");
  const [rootCause, setRootCause] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Fetch Projects for the filter
  const { data: projects = [] } = useQuery({
    queryKey: ["/api/projects"],
      queryFn: () => apiClient.get("/projects"),
  });

  // Construct Query String for the Report
  const queryParams = new URLSearchParams();
  if (projectId !== "all") queryParams.append("projectId", projectId);
  if (rootCause !== "all") queryParams.append("rootCause", rootCause);
  if (startDate) queryParams.append("startDate", startDate);
  if (endDate) queryParams.append("endDate", endDate);

  // Fetch Report Data
  const { data: reportData, isLoading, refetch } = useQuery<DefectAnalysisReportResponse>({
    queryKey: ["/api/reports/defect-analysis", queryParams.toString()],
        queryFn: () => apiClient.get(`/reports/defect-analysis?${queryParams.toString()}`),
  });

  // --- Excel Export Logic ---
  const exportToExcel = () => {
    if (!reportData) return;
    
    const wb = XLSX.utils.book_new();
    const selectedProject = projects.find((p: any) => p.id === projectId);
    const detailedDefects = reportData.defects ?? [];

    appendWorksheet(wb, "Report Filters", [
      ["Field", "Value"],
      ["Generated On", new Date().toLocaleString()],
      ["Project", projectId === "all" ? "All Projects" : selectedProject?.name ?? projectId],
      ["Root Cause", rootCause === "all" ? "All Categories" : rootCause],
      ["Start Date", startDate || "Not Applied"],
      ["End Date", endDate || "Not Applied"],
      ["Total Detailed Rows", detailedDefects.length],
    ]);

    // 1. Executive Summary Sheet
    const summaryData = [
      ["Metric", "Count"],
      ["Total Defects Reported", reportData.metrics.total],
      ["Open Defects", reportData.metrics.open],
      ["Closed Defects", reportData.metrics.closed],
      ["Reopened Defects", reportData.metrics.reopened],
      ["Critical Severity", reportData.metrics.severities.critical],
      ["High Severity", reportData.metrics.severities.high],
      ["Medium Severity", reportData.metrics.severities.medium],
      ["Low Severity", reportData.metrics.severities.low],
      ["Aging 0-3 Days", reportData.metrics.aging.zeroToThree],
      ["Aging 4-7 Days", reportData.metrics.aging.fourToSeven],
      ["Aging > 7 Days", reportData.metrics.aging.greaterThanSeven],
    ];
    appendWorksheet(wb, "Executive Summary", summaryData);

    // 2. Root Cause Sheet
    const rcData = [
      ["Root Cause Category", "Defects Count", "Remarks"],
      ...reportData.rootCauses.map(rc => [rc.category, rc.count, rc.remarks])
    ];
    appendWorksheet(wb, "Root Cause Analysis", rcData);

    // 3. Reporters Sheet
    const repData = [
      ["Resource Name", "Defects Count"],
      ...reportData.reporters.map(rep => [rep.resourceName, rep.count])
    ];
    appendWorksheet(wb, "Reporters", repData);

    // 4. Developer Confidence Matrix Sheet
    const devData = [
      ["Developer Name", "Total Defects", "Critical", "High", "Medium", "Low"],
      ...reportData.developerMatrix.map(dev => [
        dev.developerName, dev.totalDefects, dev.critical, dev.high, dev.medium, dev.low
      ])
    ];
    appendWorksheet(wb, "Developer Matrix", devData);

    // 5. Detailed Defects Sheet
    const detailHeaders = [
      "Defect No.",
      "Title",
      "Project",
      "Team",
      "Status",
      "Severity",
      "Priority",
      "Type",
      "Environment",
      "Root Cause",
      "Reported By",
      "Assigned To",
      "Assigned By",
      "Approved By",
      "Created At",
      "Due Date",
      "Updated At",
      "Approved At",
      "Resolved At",
      "Verified At",
      "Age Days",
      "Resolution Days",
      "Linked Tasks",
      "Attachments",
      "Description",
      "Steps To Reproduce",
      "Expected Behavior",
      "Actual Behavior",
      "Resolution",
      "Rejection Reason",
      "Defect ID",
    ];

    const detailRows = detailedDefects.map((defect): ExcelCell[] => [
      defectDisplayNumber(defect),
      defect.title,
      defect.projectName,
      defect.teamName,
      formatLabel(defect.status),
      formatLabel(defect.severity),
      defect.priority ?? "",
      formatLabel(defect.type),
      formatLabel(defect.environment),
      defect.rootCauseAnalysis,
      defect.reporterName,
      defect.assignedToName,
      defect.assignedByName,
      defect.approvedByName,
      formatExcelDate(defect.createdAt),
      formatExcelDate(defect.dueDate),
      formatExcelDate(defect.updatedAt),
      formatExcelDate(defect.approvedAt),
      formatExcelDate(defect.resolvedAt),
      formatExcelDate(defect.verifiedAt),
      defect.ageDays,
      defect.resolutionDays ?? "",
      defect.linkedTaskCount,
      defect.attachmentCount,
      stripHtml(defect.description),
      stripHtml(defect.stepsToReproduce),
      stripHtml(defect.expectedBehavior),
      stripHtml(defect.actualBehavior),
      stripHtml(defect.resolution),
      stripHtml(defect.rejectionReason),
      defect.id,
    ]);

    appendWorksheet(wb, "Detailed Defects", [detailHeaders, ...detailRows]);

    XLSX.writeFile(wb, `Defect_Analysis_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Defect Analysis Report</h1>
          <p className="text-muted-foreground mt-1">Deep dive into project defect metrics, root causes, and team performance.</p>
        </div>
        <Button onClick={exportToExcel} disabled={isLoading || !reportData} className="gap-2">
          <Download className="w-4 h-4" /> Export to Excel 
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-muted/40">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-end">
          <div className="space-y-1.5 flex-1 w-full">
            <Label>Project</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger className="w-full bg-background">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 flex-1 w-full">
            <Label>Root Cause</Label>
            <Select value={rootCause} onValueChange={setRootCause}>
              <SelectTrigger className="w-full bg-background">
                <SelectValue placeholder="All Root Causes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {ROOT_CAUSE_OPTIONS.map(rc => (
                  <SelectItem key={rc} value={rc}>{rc}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 flex-1 w-full">
            <Label>Start Date</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-background" />
          </div>
          <div className="space-y-1.5 flex-1 w-full">
            <Label>End Date</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-background" />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 w-full" />)}
          </div>
          <Skeleton className="h-[400px] w-full" />
        </div>
      ) : reportData ? (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6 flex flex-row items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Total Defects</p>
                  <h3 className="text-3xl font-bold">{reportData.metrics.total}</h3>
                </div>
                <Bug className="w-8 h-8 text-primary/50" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex flex-row items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Open</p>
                  <h3 className="text-3xl font-bold text-orange-600">{reportData.metrics.open}</h3>
                </div>
                <Activity className="w-8 h-8 text-orange-500/50" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex flex-row items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Critical Severity</p>
                  <h3 className="text-3xl font-bold text-red-600">{reportData.metrics.severities.critical}</h3>
                </div>
                <AlertCircle className="w-8 h-8 text-red-500/50" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex flex-row items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Reopened</p>
                  <h3 className="text-3xl font-bold text-blue-600">{reportData.metrics.reopened}</h3>
                </div>
                <BarChart3 className="w-8 h-8 text-blue-500/50" />
              </CardContent>
            </Card>
          </div>

          {/* Progressive Disclosure Tabs */}
          <Tabs defaultValue="executive" className="w-full">
            <TabsList className="grid w-full md:w-[600px] grid-cols-3">
              <TabsTrigger value="executive">Executive Summary</TabsTrigger>
              <TabsTrigger value="rootcause">Root Cause & Reporters</TabsTrigger>
              <TabsTrigger value="matrix">Developer Matrix</TabsTrigger>
            </TabsList>

            {/* TAB 1: Executive Summary & Aging */}
            <TabsContent value="executive" className="space-y-4 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Metrics & Aging Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>Metric</TableHead>
                        <TableHead className="text-center">Count</TableHead>
                        <TableHead className="text-center border-l">Aging 0-3 Days</TableHead>
                        <TableHead className="text-center">Aging 4-7 Days</TableHead>
                        <TableHead className="text-center">Aging &gt;7 Days</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Total Defects Reported</TableCell>
                        <TableCell className="text-center font-bold">{reportData.metrics.total}</TableCell>
                        <TableCell className="text-center border-l">{reportData.metrics.aging.zeroToThree}</TableCell>
                        <TableCell className="text-center">{reportData.metrics.aging.fourToSeven}</TableCell>
                        <TableCell className="text-center">{reportData.metrics.aging.greaterThanSeven}</TableCell>
                      </TableRow>
                      <TableRow><TableCell className="font-medium">Open Defects</TableCell><TableCell className="text-center">{reportData.metrics.open}</TableCell><TableCell colSpan={3} className="border-l bg-muted/20"></TableCell></TableRow>
                      <TableRow><TableCell className="font-medium">Closed Defects</TableCell><TableCell className="text-center">{reportData.metrics.closed}</TableCell><TableCell colSpan={3} className="border-l bg-muted/20"></TableCell></TableRow>
                      <TableRow><TableCell className="font-medium text-red-600">Critical Defects</TableCell><TableCell className="text-center">{reportData.metrics.severities.critical}</TableCell><TableCell colSpan={3} className="border-l bg-muted/20"></TableCell></TableRow>
                      <TableRow><TableCell className="font-medium text-orange-600">High Severity</TableCell><TableCell className="text-center">{reportData.metrics.severities.high}</TableCell><TableCell colSpan={3} className="border-l bg-muted/20"></TableCell></TableRow>
                      <TableRow><TableCell className="font-medium text-yellow-600">Medium Severity</TableCell><TableCell className="text-center">{reportData.metrics.severities.medium}</TableCell><TableCell colSpan={3} className="border-l bg-muted/20"></TableCell></TableRow>
                      <TableRow><TableCell className="font-medium text-green-600">Low Severity</TableCell><TableCell className="text-center">{reportData.metrics.severities.low}</TableCell><TableCell colSpan={3} className="border-l bg-muted/20"></TableCell></TableRow>
                      <TableRow><TableCell className="font-medium text-blue-600">Reopened Defects</TableCell><TableCell className="text-center">{reportData.metrics.reopened}</TableCell><TableCell colSpan={3} className="border-l bg-muted/20"></TableCell></TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 2: Root Cause & Reporters */}
            <TabsContent value="rootcause" className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Root Cause Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-center">Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.rootCauses.length === 0 ? (
                        <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">No data available</TableCell></TableRow>
                      ) : (
                        reportData.rootCauses.map((rc, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{rc.category}</TableCell>
                            <TableCell className="text-center">{rc.count}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Defects Reported By</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>Resource Name</TableHead>
                        <TableHead className="text-center">Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.reporters.length === 0 ? (
                        <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">No data available</TableCell></TableRow>
                      ) : (
                        reportData.reporters.map((rep, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{rep.resourceName}</TableCell>
                            <TableCell className="text-center">{rep.count}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 3: Developer Confidence Matrix */}
            <TabsContent value="matrix" className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Developer Confidence Matrix</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>Developer Name</TableHead>
                        <TableHead className="text-center">Total Defects</TableHead>
                        <TableHead className="text-center">Critical</TableHead>
                        <TableHead className="text-center">High</TableHead>
                        <TableHead className="text-center">Medium</TableHead>
                        <TableHead className="text-center">Low</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.developerMatrix.length === 0 ? (
                        <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No data available</TableCell></TableRow>
                      ) : (
                        reportData.developerMatrix.map((dev, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{dev.developerName}</TableCell>
                            <TableCell className="text-center font-bold">{dev.totalDefects}</TableCell>
                            <TableCell className="text-center">
                              {dev.critical > 0 ? (
                                <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-red-300">{dev.critical}</Badge>
                              ) : <span className="text-muted-foreground">0</span>}
                            </TableCell>
                            <TableCell className="text-center">
                              {dev.high > 0 ? (
                                <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-300">{dev.high}</Badge>
                              ) : <span className="text-muted-foreground">0</span>}
                            </TableCell>
                            <TableCell className="text-center">
                              {dev.medium > 0 ? (
                                <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-300">{dev.medium}</Badge>
                              ) : <span className="text-muted-foreground">0</span>}
                            </TableCell>
                            <TableCell className="text-center">
                              {dev.low > 0 ? (
                                <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-300">{dev.low}</Badge>
                              ) : <span className="text-muted-foreground">0</span>}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <div className="text-center p-12 text-muted-foreground">
          Failed to load report data.
        </div>
      )}
    </div>
  );
}

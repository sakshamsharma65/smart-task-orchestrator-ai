
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { fetchTasks, Task, updateTask } from "@/integrations/supabase/tasks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, Search, Plus, Sparkles, List, Kanban } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import useSupabaseSession from "@/hooks/useSupabaseSession";
import CreateTaskSheet from "@/components/CreateTaskSheet";
import TaskCard from "@/components/TaskCard";
import AiTaskCreationSheet from "@/components/AiTaskCreationSheet";
import TaskDetailsSheet from "@/components/TaskDetailsSheet";
import EditTaskSheet from "@/components/EditTaskSheet";
import { useUsersAndTeams } from "@/hooks/useUsersAndTeams";
import { useTaskStatuses } from "@/hooks/useTaskStatuses";
import { fetchTasksPaginated, FetchTasksInput } from "@/integrations/supabase/tasks";
import TasksList from "@/components/TasksList";
import TasksNoResults from "@/components/TasksNoResults";
import TasksPagination from "@/components/TasksPagination";
import { useCurrentUserRoleAndTeams } from "@/hooks/useCurrentUserRoleAndTeams";
import KanbanColumn from "./MyTasks/KanbanColumn";
import KanbanTaskCard from "./MyTasks/KanbanTaskCard";
import { format, startOfMonth, endOfMonth } from "date-fns";
import DateRangePresetSelector from "@/components/DateRangePresetSelector";
import { useRolePermissions } from "@/hooks/useRolePermissions";
import { apiClient } from "@/lib/api";
function defaultDateRange() {

  const now = new Date();
  return {
    from: startOfMonth(now),
    to: endOfMonth(now),
  };
}

// Priorities filter dropdown
const priorities = [
  { label: "All", value: "all" },
  { label: "High", value: "1" },
  { label: "Medium", value: "2" },
  { label: "Low", value: "3" },
];

// Status filter dropdown
const statuses = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "In Progress", value: "in_progress" },
  { label: "Completed", value: "completed" },
];

// Add logic to filter/group by Task Group if needed (future extension)

const fallbackImage =
  "https://images.unsplash.com/photo-1582562124811-c09040d0a901?auto=format&fit=crop&w=400&q=80";

const pageSizeOptions = [25, 50, 75, 100];
const preferredStatusFlow = ["new", "in progress", "approval", "approved", "completed"];

const getStatusKey = (status: string) => {
  return status.trim().toLowerCase().replace(/_/g, " ");
};

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : null;
};

const getStatusStyleFromColor = (statusColor?: string) => {
  const color = statusColor || "#6b7280";
  const rgb = hexToRgb(color);

  if (!rgb) {
    return {
      bg: "bg-neutral-50/30",
      header: "text-neutral-700 bg-neutral-100/60 border-neutral-200",
      count: "bg-neutral-200 text-neutral-700",
      customStyles: {},
    };
  }

  return {
    bg: "bg-transparent",
    header: "text-white border-transparent",
    count: "text-white",
    customStyles: {
      bg: { backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)` },
      header: {
        backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`,
        color,
        borderColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`,
      },
      count: {
        backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25)`,
        color,
      },
    },
  };
};

const getStatusStyle = (statusKey: string, statusColor?: string) => {
  if (statusColor) {
    return getStatusStyleFromColor(statusColor);
  }

  const KANBAN_STYLES: Record<string, { bg: string; header: string; count: string }> = {
    backlog: {
      bg: "bg-gray-50/50",
      header: "text-gray-700 bg-gray-100/80 border-gray-200",
      count: "bg-gray-200 text-gray-700",
    },
    "in progress": {
      bg: "bg-blue-50/30",
      header: "text-blue-700 bg-blue-100/60 border-blue-200",
      count: "bg-blue-200 text-blue-700",
    },
    in_progress: {
      bg: "bg-blue-50/30",
      header: "text-blue-700 bg-blue-100/60 border-blue-200",
      count: "bg-blue-200 text-blue-700",
    },
    review: {
      bg: "bg-orange-50/30",
      header: "text-orange-700 bg-orange-100/60 border-orange-200",
      count: "bg-orange-200 text-orange-700",
    },
    completed: {
      bg: "bg-green-50/30",
      header: "text-green-700 bg-green-100/60 border-green-200",
      count: "bg-green-200 text-green-700",
    },
    new: {
      bg: "bg-purple-50/30",
      header: "text-purple-700 bg-purple-100/60 border-purple-200",
      count: "bg-purple-200 text-purple-700",
    },
    approved: {
      bg: "bg-emerald-50/30",
      header: "text-emerald-700 bg-emerald-100/60 border-emerald-200",
      count: "bg-emerald-200 text-emerald-700",
    },
    approval: {
      bg: "bg-amber-50/30",
      header: "text-amber-700 bg-amber-100/60 border-amber-200",
      count: "bg-amber-200 text-amber-700",
    },
  };

  return (
    KANBAN_STYLES[statusKey] ||
    KANBAN_STYLES[statusKey.replace(/\s+/g, "_")] ||
    {
      bg: "bg-neutral-50/30",
      header: "text-neutral-700 bg-neutral-100/60 border-neutral-200",
      count: "bg-neutral-200 text-neutral-700",
      customStyles: {},
    }
  );
};

const TasksPage: React.FC = () => {
  const { session, user, loading: sessionLoading } = useSupabaseSession();
  const { users, teams } = useUsersAndTeams();
  const { roles, loading: rolesLoading } = useCurrentUserRoleAndTeams();
  const { statuses, loading: statusesLoading } = useTaskStatuses();
  const [page, setPage] = useState(1);
  const [view, setView] = useState<"list" | "kanban">("list");
  const [pageSize, setPageSize] = useState(25);
    // AI Task Creation
  const [aiSheetOpen, setAiSheetOpen] = useState(false);

  const { data: aiAccess } = useQuery({
    queryKey: ["/api/ai/access"],
    queryFn: async () => {
      try {
        return await apiClient.get("/ai/access");
      } catch {
        return { can_use: false };
      }
    },
    enabled: !!user,
  });

  
  const aiEnabled = !!(aiAccess?.can_use);
  // Task Details Modal States
  const [detailsTask, setDetailsTask] = useState<Task | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const location = useLocation();

  // Overdue filter state
  const [overdueFilter, setOverdueFilter] = useState(false);

  // Sync status and overdue filter with URL query param on mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const statusParam = params.get("status");
    const overdueParam = params.get("overdue");
    if (statusParam && statusParam !== statusFilter) {
      setStatusFilter(statusParam);
       setShowFilters(true);
    }
    setOverdueFilter(overdueParam === "true");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);
  const [userFilter, setUserFilter] = useState("all");
  const [teamFilter, setTeamFilter] = useState("all");
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>(defaultDateRange());
  const [preset, setPreset] = useState<string>("This Month");
    const {canCreateTask} = useRolePermissions();
  
  function handlePresetChange(range: { from: Date | null; to: Date | null }, p: string) {
    setPreset(p);
   
    setDateRange(range);
  }

  const filters = useMemo(() => ({
    priorityFilter,
    setPriorityFilter,
    statusFilter,
    setStatusFilter,
    userFilter,
    setUserFilter,
    teamFilter,
    setTeamFilter,
    dateRange,
    setDateRange,
  }), [priorityFilter, statusFilter, userFilter, teamFilter, dateRange]);

  // Use React Query for tasks with stable key
  const { data: tasksResult, isLoading: loading, refetch: handleSearch } = useQuery({
    queryKey: ["/api/tasks", "paginated", page, pageSize, priorityFilter, statusFilter, userFilter, teamFilter, dateRange, user?.id,overdueFilter],
    queryFn: async () => {
      if (!user) return { tasks: [], total: 0, showTooManyWarning: false };
      
      const fetchInput: FetchTasksInput = {
        // Map filter values to expected field names
        assignedTo: userFilter !== "all" ? userFilter : undefined,
        teamId: teamFilter !== "all" ? teamFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        priority: priorityFilter !== "all" ? parseInt(priorityFilter) : undefined,
        fromDate: dateRange.from ? dateRange.from.toISOString().split('T')[0] : undefined,
        toDate: dateRange.to ? dateRange.to.toISOString().split('T')[0] : undefined,
        overdue: overdueFilter, // boolean
        offset: (page - 1) * pageSize,
        limit: pageSize,
      };
      
      const result = await fetchTasksPaginated(fetchInput);
      return {
        tasks: result.tasks,
        total: result.total,
        showTooManyWarning: false
      };
    },
    enabled: !!user && !rolesLoading,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  });

  const tasks = tasksResult?.tasks || [];
  const filteredTasks = useMemo(() => {
    let filtered = tasks;
 

  const now = new Date();
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  filtered = filtered.filter((task) => {
    if (!task.due_date) return true;

    const dueDate = new Date(task.due_date);

    // 👉 If task is from previous month
    if (dueDate < startOfCurrentMonth) {
      // show only if NOT completed
      return task.status?.toLowerCase() !== "completed";
    }

    // 👉 Current month → show all
    return true;  });
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((task) =>
        task.title?.toLowerCase().includes(q) ||
        task.status?.toLowerCase().includes(q) ||
        task.description?.toLowerCase().includes(q) ||
        task.assigned_to?.toLowerCase().includes(q) ||
        task.is_time_managed?.toString().toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [tasks, searchQuery, overdueFilter]);

  const totalTasks = tasksResult?.total || 0;
  const showTooManyWarning = tasksResult?.showTooManyWarning || false;

  const tasksByStatus = useMemo(() => {
    const columns: Record<string, Task[]> = {};
    statuses.forEach((statusObj) => {
      columns[getStatusKey(statusObj.name)] = [];
    });

    filteredTasks.forEach((task) => {
      const key = getStatusKey(task.status || "new");
      if (!columns[key]) columns[key] = [];
      columns[key].push(task);
    });

    return columns;
  }, [filteredTasks, statuses]);

  const sortedStatusKeys = useMemo(() => {
    return [...statuses]
      .map((status) => ({
        name: status.name,
        key: getStatusKey(status.name),
        order: status.sequence_order ?? Number.MAX_SAFE_INTEGER,
      }))
      .sort((a, b) => {
        const aRank = preferredStatusFlow.indexOf(a.key);
        const bRank = preferredStatusFlow.indexOf(b.key);
        const rankDiff =
          (aRank === -1 ? Number.MAX_SAFE_INTEGER : aRank) -
          (bRank === -1 ? Number.MAX_SAFE_INTEGER : bRank);

        if (rankDiff !== 0) return rankDiff;
        if (a.order !== b.order) return a.order - b.order;
        return a.name.localeCompare(b.name);
      })
      .map((status) => status.key);
  }, [statuses]);

  const CARD_TYPE = "TASK_CARD";

  const handleTaskDrop = async (taskId: string, newStatusKey: string) => {
    const statusObj = statuses.find((status) => getStatusKey(status.name) === newStatusKey);

    if (!statusObj) {
      toast({ title: "Invalid status" });
      return;
    }

    try {
      await updateTask(taskId, { status: statusObj.name });
      handleSearch();
      toast({ title: "Status updated", description: `Task moved to "${statusObj.name}"` });
    } catch (error: any) {
      toast({ title: "Failed to update status", description: error.message });
    }
  };

  const onDropTask = (item: { id: string; status: string }, statusKey: string) => {
    handleTaskDrop(item.id, statusKey);
  };

  // Restrict delete to status 'pending' or 'new'
  function canDelete(status: string) {
    // Find the status object and check its can_delete property
    const statusObj = statuses.find(s => s.name === status);
    return statusObj?.can_delete || false;
  }

  // Task Details Modal Functions
  const openDetailsForTask = (task: Task) => {
    setEditOpen(false);
    setEditTask(null);
    setDetailsTask(task);
    setDetailsOpen(true);
  };

  const openEditForTask = (task: Task) => {
    setDetailsOpen(false);
    setDetailsTask(null);
    setEditTask(task);
    setEditOpen(true);
  };



  // --- Removed duplicate roles state and side-effect ---

  return (
    <div className="w-full p-4 mx-0">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">All Tasks</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter size={16} />
            Filters
          </Button>
          <Button
            variant={view === "list" ? "default" : "outline"}
            onClick={() => setView("list")}
            className="gap-2"
          >
            <List className="w-4 h-4" />
            List
          </Button>
          <Button
            variant={view === "kanban" ? "default" : "outline"}
            onClick={() => setView("kanban")}
            className="gap-2"
          >
            <Kanban className="w-4 h-4" />
            Kanban
          </Button>
       {aiEnabled && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-300 dark:hover:bg-purple-950"
              onClick={() => setAiSheetOpen(true)}
            >
              <Sparkles className="w-4 h-4" />
              AI Create
            </Button>
          )}
        <CreateTaskSheet onTaskCreated={handleSearch}>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Create Task
            </Button>
          </CreateTaskSheet>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Search tasks by title, description, or assignee..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="bg-white rounded-lg border shadow-sm p-4">
            <h3 className="text-lg font-medium mb-4">Advanced Filters</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Date Range */}
              <div className="md:col-span-3">
                <label className="block text-sm font-medium mb-2">Date Range</label>
                <DateRangePresetSelector
                  dateRange={dateRange}
                  preset={preset}
                  onChange={handlePresetChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Priority Filter */}
              <div>
                <label className="block text-sm font-medium mb-2">Priority</label>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="1">High</SelectItem>
                    <SelectItem value="2">Medium</SelectItem>
                    <SelectItem value="3">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {statuses.map(status => (
                      <SelectItem key={status.id} value={status.name}>
                        {status.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* User Filter */}
              <div>
                <label className="block text-sm font-medium mb-2">Assigned To</label>
                <Select value={userFilter} onValueChange={setUserFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {users.map((user: any) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.user_name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Team Filter */}
              <div>
                <label className="block text-sm font-medium mb-2">Team</label>
                <Select value={teamFilter} onValueChange={setTeamFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Teams" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Teams</SelectItem>
                    {teams.map((team: any) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1">
        {showTooManyWarning && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded mb-4 text-center">
            <strong>
              Too many results ({totalTasks}). Please refine your filters to narrow down the results. Only up to 100 can be loaded at a time.
            </strong>
          </div>
        )}

        {loading && (
          <div className="text-muted-foreground mb-4 text-center">Loading...</div>
        )}

        {!loading && filteredTasks.length === 0 && (
          <div className="flex flex-col items-center justify-center mt-16">
            <div className="w-40 h-40 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
              <Search className="w-16 h-16 text-gray-400" />
            </div>
            <div className="text-muted-foreground text-lg mb-2">No tasks found</div>
            <div className="text-sm text-gray-500">Try adjusting your filters or search criteria</div>
          </div>
        )}

        {!loading && filteredTasks.length > 0 && view === "list" && (
          <>
            <div className="mb-4 text-sm text-gray-600">
              Showing {filteredTasks.length} of {totalTasks} tasks
            </div>
            <TasksList 
              tasks={filteredTasks} 
              onTaskUpdated={handleSearch} 
              canDelete={canDelete} 
              statuses={statuses} 
              onOpenDetails={openDetailsForTask} 
            />
            <TasksPagination
              page={page}
              setPage={setPage}
              pageSize={pageSize}
              setPageSize={setPageSize}
              totalTasks={totalTasks}
              pageSizeOptions={pageSizeOptions}
            />
          </>
        )}

        {!loading && filteredTasks.length > 0 && view === "kanban" && (
          <DndProvider backend={HTML5Backend}>
            <div className="flex gap-6 overflow-x-auto pb-8 px-2">
              {sortedStatusKeys.map((statusKey, index) => {
                const statusObj = statuses.find((status) => getStatusKey(status.name) === statusKey);

                return (
                  <React.Fragment key={statusKey}>
                    <KanbanColumn
                      statusKey={statusKey}
                      statusLabel={statusObj ? statusObj.name : statusKey}
                      onDrop={onDropTask}
                      CARD_TYPE={CARD_TYPE}
                      statusStyle={getStatusStyle(statusKey, statusObj?.color)}
                      taskCount={tasksByStatus[statusKey]?.length || 0}
                    >
                      {tasksByStatus[statusKey] && tasksByStatus[statusKey].length > 0 ? (
                        tasksByStatus[statusKey].map((task) => (
                          <KanbanTaskCard
                            key={task.id}
                            task={task}
                            CARD_TYPE={CARD_TYPE}
                            onClick={() => openDetailsForTask(task)}
                            statusColor={statusObj?.color}
                          />
                        ))
                      ) : (
                        <div className="text-muted-foreground text-sm py-4 text-center">No tasks</div>
                      )}
                    </KanbanColumn>

                    {index < sortedStatusKeys.length - 1 && (
                      <div className="flex items-stretch py-4 px-2">
                        <div className="w-px bg-gradient-to-b from-transparent via-gray-300/60 to-transparent min-h-[400px] flex-shrink-0" />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </DndProvider>
        )}
      </div>

      {/* Task Details Modal */}
      <TaskDetailsSheet
        task={detailsTask}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        currentUser={user}
        onUpdated={handleSearch}
        onEdit={openEditForTask}
      />

      {/* Edit Task Modal */}
      <EditTaskSheet
        task={editTask}
        onUpdated={() => {
          setEditOpen(false);
          handleSearch();
        }}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
            {/* AI Task Creation Sheet */}
      <AiTaskCreationSheet
        open={aiSheetOpen}
        onOpenChange={setAiSheetOpen}
        onTaskCreated={handleSearch}
        currentUserId={user?.id}
      />
    </div>
  );
};

export default TasksPage;

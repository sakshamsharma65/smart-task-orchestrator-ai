
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import RolePermissions from "./pages/RolePermissions";
import AuthPage from "@/pages/Auth";
import AdminLayout from "@/layouts/AdminLayout";
import AdminUsers from "@/pages/AdminUsers";
import AdminTeams from "@/pages/AdminTeams";
import DeletedUsers from "@/pages/DeletedUsers";
import AdminSettings from "./pages/AdminSettings";
import TasksPage from "./pages/Tasks";
import MyTasksPage from "./pages/MyTasks";
import HistoricalTasks from "./pages/HistoricalTasks";
import AdminDashboard from "./pages/AdminDashboardSimple";
import TaskReport from "@/pages/TaskReportSimple";
import AnalyticsReport from "@/pages/AnalyticsReportSimple";
import TaskOverdueReport from "@/pages/TaskOverdueReportAdvanced";
import TaskGroupsPage from "./pages/TaskGroups";
import MyTeams from "./pages/MyTeams";
import Benchmarking from "./pages/Benchmarking";
import BenchmarkingReport from "./pages/BenchmarkingReport";
import { RoleProvider } from "@/contexts/RoleProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { queryClient } from "@/lib/queryClient";
import HelpPage from "@/pages/HelpPage";
import ForgotPassword from "@/pages/ForgotPassword";
import VerifyOtp from "@/pages/VerifyOtp";
import ResetPassword from "@/pages/ResetPassword";
import ForgotPasswordFlow from "@/pages/ForgotPasswordFlow";
import ActivityLogPage from "@/pages/ActivityLogPage";
import ProjectReports from "@/pages/ProjectReports";
import Projects from "@/pages/Projects";
import ProjectDetail from "@/pages/ProjectDetail";
import CreateProject from "@/pages/CreateProject";
import { GoogleOAuthProvider } from '@react-oauth/google';
const GOOGLE_CLIENT_ID = "145033670665-8jufo1s5bfujldjm9uik95l5kgdkrqli.apps.googleusercontent.com";
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <RoleProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<AuthPage />} />
              <Route path="/auth" element={<AuthPage />} />
            <Route
              path="/users"
              element={
                <AdminLayout>
                  <AdminUsers />
                </AdminLayout>
              }
            />
            <Route path="/activity-log" element={
               <AdminLayout>
              <ActivityLogPage /></AdminLayout>
              } />

            <Route
              path="/teams"
              element={
                <AdminLayout>
                  <AdminTeams />
                </AdminLayout>
              }
            />
            <Route
              path="/deleted-users"
              element={
                <AdminLayout>
                  <DeletedUsers />
                </AdminLayout>
              }
            />
            <Route
              path="/role-permissions"
              element={
                <AdminLayout>
                  <RolePermissions />
                </AdminLayout>
              }
            />
            <Route
              path="/settings"
              element={
                <AdminLayout>
                  <AdminSettings />
                </AdminLayout>
              }
            />
            <Route
              path="/tasks"
              element={
                <AdminLayout>
                  <TasksPage />
                </AdminLayout>
              }
            />
            {/* Task Groups route */}
            <Route
              path="/task-groups"
              element={
                <AdminLayout>
                  <TaskGroupsPage />
                </AdminLayout>
              }
            />
                 <Route
              path="/projects/reports"
              element={
                <AdminLayout>
                  <ProjectReports />
                </AdminLayout>
              }
            />
               {/* Projects route */}
            <Route
              path="/projects"
              element={
                <AdminLayout>
                  <Projects />
                </AdminLayout>
              }
            />
            <Route
              path="/projects/:id"
              element={
                <AdminLayout>
                  <ProjectDetail />
                </AdminLayout>
              }
            />
     <Route
              path="/projects/new"
              element={
                <AdminLayout>
                  <CreateProject />
                </AdminLayout>
              }
            />
            <Route
          path="/my-tasks"
              element={
                <AdminLayout>
                  <MyTasksPage />
                </AdminLayout>
              }
            />
            <Route
              path="/historical-tasks"
              element={
                <AdminLayout>
                  <HistoricalTasks />
                </AdminLayout>
              }
            />
            <Route
              path="/dashboard"
              element={
                <AdminLayout>
                  <AdminDashboard />
                </AdminLayout>
              }
            />
            <Route
              path="/reports/task"
              element={
                <AdminLayout>
                  <TaskReport />
                </AdminLayout>
              }
            />
            <Route
              path="/reports/overdue"
              element={
                <AdminLayout>
                  <TaskOverdueReport />
                </AdminLayout>
              }
            />
            <Route
              path="/reports/analytics"
              element={
                <AdminLayout>
                  <AnalyticsReport />
                </AdminLayout>
              }
            />
            <Route
              path="/reports/benchmarking"
              element={
                <AdminLayout>
                  <BenchmarkingReport />
                </AdminLayout>
              }
            />
            {/* Admin Benchmarking route */}
            <Route
              path="/admin/benchmarking"
              element={
                <AdminLayout>
                  <Benchmarking />
                </AdminLayout>
              }
            />
            {/* Tasks page for regular users */}
            <Route
              path="/tasks"
              element={
                <AdminLayout>
                  <TasksPage />
                </AdminLayout>
              }
            />
            {/* My Teams page for plain users */}
            <Route
              path="/my-teams"
              element={
                <AdminLayout>
                  <MyTeams />
                </AdminLayout>
              }
            />
            {/* Benchmarking page for users */}
            <Route
              path="/benchmarking"
              element={
                <AdminLayout>
                  <Benchmarking />
                </AdminLayout>
              }
            />
             <Route
              path="/forgot-password"
              element={<ForgotPasswordFlow />}
              />
            <Route
              path="/verify-otp"
              element={ 
                <VerifyOtp email="" onVerified={(token: string) => { /* handle OTP verified, e.g., show a message or redirect */ }} />
              }
            />
              
              
            {/* Help page route */}
            <Route
              path="/help"
              element={
                <AdminLayout>
                  <HelpPage />
                </AdminLayout>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </RoleProvider>
      </AuthProvider>
    </GoogleOAuthProvider></TooltipProvider>
  </QueryClientProvider>
);

export default App;

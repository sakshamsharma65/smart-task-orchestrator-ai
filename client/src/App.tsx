import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
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
import ForgotPasswordFlow from "@/pages/ForgotPasswordFlow";
import ResetPassword from "@/pages/ResetPassword";
import ActivityLogPage from "@/pages/ActivityLogPage";
import ProjectReports from "@/pages/ProjectReports";
import Projects from "@/pages/Projects";
import ProjectDetail from "@/pages/ProjectDetail";
import CreateProject from "@/pages/CreateProject";
import DefectsPage from "@/pages/Defects";
import PortalLogin from "@/pages/PortalLogin";
import PortalDashboard from "@/pages/PortalDashboard";
import PortalChangePassword from "@/pages/PortalChangePassword";
import PortalProjectView from "@/pages/PortalProjectView";

import Clients from "@/pages/Clients";
import ClientDetail from "@/pages/ClientDetail";
import DefectBoardPage from "@/pages/DefectBoard";
import MyDefectsPage from "@/pages/MyDefects";
import VerifyOtp from "./pages/VerifyOtp";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { apiClient } from "@/lib/api";
import { setOrgDateSettings } from "@/lib/dateUtils";
const GOOGLE_CLIENT_ID = "145033670665-8jufo1s5bfujldjm9uik95l5kgdkrqli.apps.googleusercontent.com";

const OrganizationSettingsSync = () => {
  const { data: settings } = useQuery({
    queryKey: ["/api/organization-settings"],
    queryFn: () => apiClient.get("/organization-settings"),
    staleTime: 5 * 60 * 1000,
  });

  React.useEffect(() => {
    if (settings) {
      setOrgDateSettings(settings);
    }
  }, [settings]);

  return null;
};

const ForgotPasswordRoute = () => {
  const navigate = useNavigate();

  return (
    <ForgotPassword
      onOtpSent={(email) => {
        navigate("/verify-otp", { state: { email } });
      }}
    />
  );
};

const VerifyOtpRoute = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email as string | undefined;

  if (!email) {
    return <Navigate to="/forgot-password" replace />;
  }

  return (
    <VerifyOtp
      email={email}
      onVerified={(token: string) => {
        navigate("/reset-password", { state: { email, token } });
      }}
    />
  );
};

const ResetPasswordRoute = () => {
  const location = useLocation();
  const email = location.state?.email as string | undefined;
  const token = location.state?.token as string | undefined;

  if (!email || !token) {
    return <Navigate to="/forgot-password" replace />;
  }

  return <ResetPassword email={email} token={token} />;
};

const App = () => (
  
  <QueryClientProvider client={queryClient}>
    <OrganizationSettingsSync />
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
                        {/* Defect Management routes */}
            <Route
              path="/defects"
              element={
                <AdminLayout>
                  <DefectsPage />
                </AdminLayout>
              }
            />
            <Route
              path="/defects/board"
              element={
                <AdminLayout>
                  <DefectBoardPage />
                </AdminLayout>
              }
            />
            <Route
              path="/defects/my"
              element={
                <AdminLayout>
                  <MyDefectsPage />
                </AdminLayout>
              }
            />
            <Route
              path="/clients"
              element={
                <AdminLayout>
                  <Clients />
                </AdminLayout>
              }
            />
            <Route
              path="/clients/:id"
              element={
                <AdminLayout>
                  <ClientDetail />
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
              path="/verify-otp"
              element={<VerifyOtpRoute />}
              />
            <Route
              path="/forgot-password"
              element={<ForgotPasswordRoute />}
              />
            <Route
              path="/reset-password"
              element={<ResetPasswordRoute />}
              />
             <Route
              path="/forgot-passwordFlow"
              element={<ForgotPasswordFlow />}
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
                <Route path="/portal/login" element={<PortalLogin />} />
            <Route path="/portal/dashboard" element={<PortalDashboard />} />
            <Route path="/portal/change-password" element={<PortalChangePassword />} />
            <Route path="/portal/projects/:id" element={<PortalProjectView />} />
       
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

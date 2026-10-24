import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import MainLayout from "@/layouts/MainLayout";

import Home from "@/pages/Home";
import Chat from "@/pages/Chat";
import Login from "@/pages/Login";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import Register from "@/pages/Register";
import ProfileSetup from "@/pages/ProfileSetup";
import VerifyEmail from "@/pages/VerifyEmail";
import CheckEmail from "@/pages/CheckEmail";
import Assessment from "./pages/Assessment";
import Settings from "@/pages/Settings";
import Dashboard from "@/pages/Dashboard";
import MoodTracking from "@/pages/MoodTracking";
import ProfessionalsPage from "@/pages/ProfessionalsPage";
import ProfessionalProfile from "@/pages/ProfessionalProfile";
import MyAppointments from "@/pages/MyAppointments";
import AppointmentDetail from "@/pages/AppointmentDetail";
import ProfessionalApplicationPage from "@/pages/ProfessionalApplicationPage";
import AdminApplicationsPage from "@/pages/AdminApplicationsPage";
import AdminAppointmentsPage from "@/pages/AdminAppointmentsPage";
import AdminDashboardPage from "@/pages/AdminDashboardPage";
import AdminUsersPage from "@/pages/AdminUsersPage";
import AdminAnalyticsPage from "@/pages/AdminAnalyticsPage";
import AdminReportsPage from "@/pages/AdminReportsPage";
import AdminKnowledgeBasePage from "@/pages/AdminKnowledgeBasePage";
import AdminContentPage from "@/pages/AdminContentPage";
import NotFoundPage from "@/pages/NotFoundPage";
import RoleRoute from "@/components/auth/RoleRoute";
import ProfessionalDashboardPage from "@/pages/ProfessionalDashboardPage";
import ProfessionalLogin from "@/pages/ProfessionalLogin";
import ProfessionalRegister from "@/pages/ProfessionalRegister";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/*
            Public marketing, auth and onboarding pages own their full-page
            layout, so they render without the authenticated app shell.
          */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile-setup" element={<ProfileSetup />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/check-email" element={<CheckEmail />} />
          <Route path="/assessment" element={<Assessment />} />
          <Route path="/professional/login" element={<ProfessionalLogin />} />
          <Route
            path="/professional/register"
            element={<ProfessionalRegister />}
          />

          {/* Authenticated application shell (responsive sidebar + top bar). */}
          <Route element={<MainLayout />}>
            {/* Appointments are shared by patients and their professionals. */}
            <Route
              element={
                <RoleRoute allowedRoles={["user", "professional"]} />
              }
            >
              <Route path="/appointments" element={<MyAppointments />} />
              <Route path="/appointments/:id" element={<AppointmentDetail />} />
            </Route>

            {/* Patient-only features. Admins and professionals are redirected
                to their own portals by RoleRoute. */}
            <Route element={<RoleRoute allowedRoles={["user"]} />}>
              <Route path="/chat" element={<Chat />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/mood" element={<MoodTracking />} />
              <Route path="/professionals" element={<ProfessionalsPage />} />
              <Route
                path="/professionals/:id"
                element={<ProfessionalProfile />}
              />
              <Route
                path="/professional-application"
                element={<ProfessionalApplicationPage />}
              />
            </Route>

            {/* Account settings are safe for every authenticated role. */}
            <Route
              element={
                <RoleRoute allowedRoles={["user", "professional", "admin"]} />
              }
            >
              <Route path="/settings" element={<Settings />} />
            </Route>

            {/* Professional-only routes. */}
            <Route element={<RoleRoute allowedRoles={["professional"]} />}>
              <Route
                path="/professional/dashboard"
                element={<ProfessionalDashboardPage />}
              />
            </Route>

            {/* Admin-only routes. */}
            <Route element={<RoleRoute allowedRoles={["admin"]} />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route
                path="/admin/applications"
                element={<AdminApplicationsPage />}
              />
              <Route
                path="/admin/appointments"
                element={<AdminAppointmentsPage />}
              />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
              <Route path="/admin/reports" element={<AdminReportsPage />} />
              <Route
                path="/admin/knowledge-base"
                element={<AdminKnowledgeBasePage />}
              />
              <Route path="/admin/content" element={<AdminContentPage />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
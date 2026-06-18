import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import LoginPage from "./routes/login";
import RegisterPage from "./routes/register";
import ProfilePage from "./routes/profile";
import JobsIndex from "./routes/jobs.index";
import JobDetail from "./routes/jobs.$jobId";
import Companies from "./routes/companies.$slug";
import ApplicationsPage from "./routes/applications";
import AdminLayout from "./routes/admin";
import AdminIndex from "./routes/admin.index";
import AdminUsers from "./routes/admin.users";
import AdminJobs from "./routes/admin.jobs";
import AdminApplications from "./routes/admin.applications";
import AdminInterviews from "./routes/admin.interviews";
import AdminSettings from "./routes/admin.settings";
import AdminRtdbDebug from "./routes/admin.rtdb-debug";
import { MaintenanceGate } from "@/components/MaintenanceGate";
import { Toaster } from "@/components/ui/sonner";
import { startFirebaseSync } from "@/lib/store";
import { isFirebaseConfigured } from "@/lib/firebase";
import "./styles.css";

function FirebaseBootstrap() {
  useEffect(() => {
    startFirebaseSync();
  }, []);
  return null;
}

const container = document.getElementById("root");
if (!container) throw new Error("Root container not found");

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <FirebaseBootstrap />
      {!isFirebaseConfigured && (
        <div className="bg-amber-100 px-4 py-2 text-center text-xs text-amber-900">
          Firebase Realtime DB not configured — running on local fallback. Add{" "}
          <code className="mx-1">VITE_FIREBASE_DATABASE_URL</code> to your <code>.env</code> and
          restart the dev server.
        </div>
      )}
      <MaintenanceGate>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/jobs" element={<JobsIndex />} />
          <Route path="/jobs/:jobId" element={<JobDetail />} />
          <Route path="/companies/:slug" element={<Companies />} />
          <Route path="/applications" element={<ApplicationsPage />} />

          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminIndex />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="jobs" element={<AdminJobs />} />
            <Route path="applications" element={<AdminApplications />} />
            <Route path="interviews" element={<AdminInterviews />} />
            <Route path="settings" element={<AdminSettings />} />
            {/* RTDB debug removed */}
          </Route>

          <Route path="*" element={<App />} />
        </Routes>
      </MaintenanceGate>
      <Toaster />
    </BrowserRouter>
  </React.StrictMode>,
);

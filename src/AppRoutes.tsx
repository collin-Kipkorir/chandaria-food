import React, { useEffect } from "react";
import { Routes, Route, Navigate, useNavigationType, useLocation } from "react-router-dom";
import { useNavigationLoader } from "@/components/NavigationLoader";

import IndexPage from "./routes/index";
import JobsIndex from "./routes/jobs.index";
import JobDetail from "./routes/jobs.$jobId";
import CompanyPage from "./routes/companies.$slug";
import Login from "./routes/login";
import Register from "./routes/register";
import Profile from "./routes/profile";
import Applications from "./routes/applications";
import AdminLayout from "./routes/admin";
import AdminIndex from "./routes/admin.index";

export default function AppRoutes() {
  const navType = useNavigationType();
  const loc = useLocation();
  const loader = useNavigationLoader();

  useEffect(() => {
    // show loader briefly on route change
    loader.start();
    const t = setTimeout(() => loader.done(), 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loc.pathname, navType]);

  return (
    <Routes>
      <Route path="/" element={<IndexPage />} />
      <Route path="/jobs" element={<JobsIndex />} />
      <Route path="/jobs/:jobId" element={<JobDetail />} />
      <Route path="/companies/:slug" element={<CompanyPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/applications" element={<Applications />} />
      <Route path="/admin" element={<AdminLayout />}> 
        <Route index element={<AdminIndex />} />
      </Route>
    </Routes>
  );
}

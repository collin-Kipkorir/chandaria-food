import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

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

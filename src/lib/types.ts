export type Role = "admin" | "seeker";
export type UserStatus = "active" | "inactive" | "suspended";
export type WebsiteMode = "online" | "maintenance" | "readonly" | "beta";

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  passwordHash: string; // mock: plain for MVP
  county: string;
  skills: string[];
  education: string;
  experience: string;
  cvUrl: string;
  role: Role;
  status: UserStatus;
  betaApproved?: boolean;
  createdAt: string;
}

export interface EmailCampaign {
  id: string;
  title: string;
  subject: string;
  message: string;
  bannerImageUrl: string;
  status: "draft" | "scheduled" | "running" | "paused" | "completed" | "cancelled";
  scheduledTime?: string;
  createdAt: string;
}

export interface EmailLog {
  id: string;
  campaignId: string;
  userId: string;
  status: "sent" | "failed" | "skipped";
  sentAt: string;
}

export interface InterviewInvitation {
  id: string;
  userId: string;
  companyName: string;
  jobTitle: string;
  interviewDate: string;
  interviewTime: string;
  venue: string;
  message: string;
  bannerImageUrl: string;
  status: "pending" | "confirmed" | "declined" | "completed";
  createdAt: string;
}

export interface SystemSettings {
  websiteMode: WebsiteMode;
  maintenanceMessage: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  adminAction: string;
  target: string;
  createdAt: string;
}

export type JobType = "full-time" | "part-time" | "contract" | "internship";
export type JobStatus = "open" | "closed";

export interface Job {
  id: string;
  companyName: string;
  companyLogoUrl?: string;
  title: string;
  location: string;
  county: string;
  jobType: JobType;
  salaryRange?: string;
  skills: string[];
  description: string;
  responsibilities: string;
  requirements: string;
  applyDeadline?: string;
  status: JobStatus;
  createdAt: string;
}

export type ApplicationStatus = "submitted" | "reviewed" | "shortlisted" | "rejected" | "hired";

export interface JobApplication {
  id: string;
  jobId: string;
  userId?: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  county?: string;
  educationLevel?: string;
  expectedSalary?: string;
  coverLetter?: string;
  cvUrl: string;
  cvFileName?: string;
  status: ApplicationStatus;
  createdAt: string;
}

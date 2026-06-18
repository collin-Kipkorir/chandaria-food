#!/usr/bin/env node
import admin from 'firebase-admin';

// Simple seeding script: writes a set of hardcoded jobs to /jobs in Realtime DB.
// Requires GOOGLE_APPLICATION_CREDENTIALS pointing to a service account JSON with
// Realtime Database write permissions, and optionally FIREBASE_DATABASE_URL.

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.warn('GOOGLE_APPLICATION_CREDENTIALS not set — trying application default credentials');
}

try {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: process.env.FIREBASE_DATABASE_URL || undefined,
  });
} catch (err) {
  console.error('Failed to initialize firebase-admin:', err);
  process.exit(1);
}

const db = admin.database();

const SEED_JOBS = [
  {
    id: 'chandaria-prod-ops',
    companyName: 'Chandaria Food Plus',
    companyLogoUrl: '',
    title: 'Production Operations Supervisor',
    location: 'Industrial Area, Nairobi',
    county: 'Nairobi',
    jobType: 'full-time',
    salaryRange: 'KSh 60,000 – 90,000',
    skills: ['Production', 'Quality Control', 'Team Leadership', 'FMCG'],
    description:
      'Oversee daily production line operations at our flagship food processing facility. Ensure output, quality, and safety targets are consistently met.',
    responsibilities:
      'Plan and supervise shift schedules; monitor line KPIs; enforce HACCP and food safety; coach line operators; coordinate with quality and maintenance teams.',
    requirements:
      'Diploma/Degree in Food Science, Industrial Engineering, or related. 3+ yrs FMCG production. Strong leadership and reporting skills.',
    applyDeadline: '',
    status: 'open',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'chandaria-qa-officer',
    companyName: 'Chandaria Food Plus',
    companyLogoUrl: '',
    title: 'Quality Assurance Officer',
    location: 'Industrial Area, Nairobi',
    county: 'Nairobi',
    jobType: 'full-time',
    salaryRange: 'KSh 45,000 – 65,000',
    skills: ['HACCP', 'ISO 22000', 'Lab Testing', 'Quality Control'],
    description:
      'Ensure every Chandaria Food Plus product meets internal and regulatory quality standards from raw material to finished good.',
    responsibilities:
      'Conduct in-process and finished product checks; maintain QA documentation; manage corrective actions; support audits.',
    requirements:
      'BSc in Food Science / Microbiology. HACCP certification. 2+ yrs in food manufacturing QA.',
    applyDeadline: '',
    status: 'open',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'chandaria-sales-rep',
    companyName: 'Chandaria Food Plus',
    companyLogoUrl: '',
    title: 'Field Sales Representative',
    location: 'Mombasa Region',
    county: 'Mombasa',
    jobType: 'full-time',
    salaryRange: 'KSh 35,000 + commission',
    skills: ['Sales', 'FMCG', 'Customer Relations', 'Route Planning'],
    description:
      'Grow Chandaria Food Plus distribution across the coastal region through direct retail engagement.',
    responsibilities:
      'Visit assigned outlets daily; secure orders; merchandise products; report market intelligence weekly.',
    requirements: 'Diploma in Sales/Marketing. 1+ yr FMCG field sales. Valid driving licence preferred.',
    applyDeadline: '',
    status: 'open',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'chandaria-warehouse-intern',
    companyName: 'Chandaria Food Plus',
    companyLogoUrl: '',
    title: 'Warehouse & Logistics Intern',
    location: 'Industrial Area, Nairobi',
    county: 'Nairobi',
    jobType: 'internship',
    salaryRange: 'KSh 20,000 stipend',
    skills: ['Inventory', 'Logistics', 'Excel'],
    description:
      '6-month internship supporting inbound/outbound logistics and stock control at the main DC.',
    responsibilities:
      'Stock counts; dispatch documentation; assist warehouse supervisor with daily reports.',
    requirements: 'Recent graduate in Supply Chain / Logistics. Strong Excel. Eager to learn.',
    applyDeadline: '',
    status: 'open',
    createdAt: new Date().toISOString(),
  },
];

async function seed() {
  console.log('Seeding jobs to Firebase Realtime Database...');
  try {
    for (const job of SEED_JOBS) {
      await db.ref(`jobs/${job.id}`).set(job);
      console.log('Seeded job', job.id);
    }
    console.log('Seeding complete.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seed();

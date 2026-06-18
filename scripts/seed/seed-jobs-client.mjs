#!/usr/bin/env node
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set } from 'firebase/database';

// Client-side seeder using the Firebase JS SDK. This writes a small set of
// example jobs under /jobs. Use for dev/testing only.

const firebaseConfig = {
  apiKey: 'AIzaSyCP9B03uei8_k8GOAv1Sz-VSXwcv3_T6JE',
  authDomain: 'chandarana-foodplus-62c54.firebaseapp.com',
  databaseURL: 'https://chandarana-foodplus-62c54-default-rtdb.firebaseio.com',
  projectId: 'chandarana-foodplus-62c54',
  storageBucket: 'chandarana-foodplus-62c54.firebasestorage.app',
  messagingSenderId: '4092435792',
  appId: '1:4092435792:web:1063aceb762bc45f922055',
  measurementId: 'G-9FDDN4C7VY',
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

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
  console.log('Seeding jobs using client SDK...');
  for (const job of SEED_JOBS) {
    const r = ref(db, `jobs/${job.id}`);
    await set(r, job);
    console.log('Wrote', job.id);
  }
  console.log('Done');
}

seed().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});

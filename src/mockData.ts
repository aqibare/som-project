import { Role, User, Attendance, Schedule, Notification } from './types';

export interface MockUser extends User {
  supervisorId?: string;
}

export interface Goal {
  id: string;
  userId: string;
  supervisorId?: string;
  title: string;
  progress: number;
  category: string;
  steps: { id: string; title: string; completed: boolean }[];
  createdAt?: string;
  completedAt?: string;
}

export interface Evaluation {
  id: string;
  internId: string;
  supervisorId?: string;
  score: number;
  feedback: string;
  date: string;
  reaction?: string;
}

export const INITIAL_MOCK_USERS: MockUser[] = [
  { id: '1', name: 'Alice Smith', email: 'alice@som.eu', role: 'supervisor' },
  { id: '2', name: 'Bob Johnson', email: 'bob@som.eu', role: 'supervisor' },
  { id: '3', name: 'Charlie Brown', email: 'charlie@som.eu', role: 'intern', supervisorId: '1', assignedAt: '2026-03-01' },
  { id: '4', name: 'Diana Prince', email: 'diana@som.eu', role: 'intern', supervisorId: '1', assignedAt: '2026-03-15' },
  { id: '5', name: 'Ethan Hunt', email: 'ethan@som.eu', role: 'admin' },
  { id: '6', name: 'Fiona Gallagher', email: 'fiona@som.eu', role: 'intern', supervisorId: '2', assignedAt: '2026-04-01' },
];

export const INITIAL_GOALS: Goal[] = [
  { 
    id: '1', 
    userId: '3',
    title: 'Master React Fundamentals', 
    progress: 65, 
    category: 'Technical',
    steps: [
      { id: 's1', title: 'JSX and Components', completed: true },
      { id: 's2', title: 'State and Props', completed: true },
      { id: 's3', title: 'Hooks (useState, useEffect)', completed: false },
      { id: 's4', title: 'Context API', completed: false },
    ]
  },
  { 
    id: '2', 
    userId: '3',
    title: 'Complete Onboarding Docs', 
    progress: 100, 
    category: 'Administrative',
    steps: [
      { id: 's5', title: 'Read Employee Handbook', completed: true },
      { id: 's6', title: 'Sign NDA', completed: true },
      { id: 's7', title: 'Setup Workstation', completed: true },
    ]
  },
  { 
    id: '3', 
    userId: '4',
    title: 'Assist in Project Alpha', 
    progress: 30, 
    category: 'Project',
    steps: [
      { id: 's8', title: 'Initial Briefing', completed: true },
      { id: 's9', title: 'Drafting Requirements', completed: false },
      { id: 's10', title: 'First Prototype', completed: false },
    ]
  },
  { 
    id: '4', 
    userId: '6',
    title: 'Database Optimization', 
    progress: 50, 
    category: 'Technical',
    steps: [
      { id: 's11', title: 'Analyze Query Performance', completed: true },
      { id: 's12', title: 'Index Creation', completed: false },
      { id: 's13', title: 'Schema Refactoring', completed: false },
    ]
  },
];

export const INITIAL_ATTENDANCE: Attendance[] = [
  { id: '1', userId: '3', date: '2026-03-30', checkIn: '08:55', checkOut: '17:05', status: 'present' },
  { id: '2', userId: '4', date: '2026-03-30', checkIn: '09:15', checkOut: '17:10', status: 'late' },
  { id: '3', userId: '6', date: '2026-03-30', checkIn: '08:45', checkOut: '17:00', status: 'present' },
  { id: '4', userId: '3', date: '2026-03-29', checkIn: '08:50', checkOut: '17:00', status: 'present' },
  { id: '5', userId: '3', date: '2026-03-28', checkIn: '09:05', checkOut: '17:15', status: 'late' },
  { id: '6', userId: '4', date: '2026-03-29', checkIn: '08:58', checkOut: '17:02', status: 'present' },
];

export const INITIAL_EVALUATIONS: Evaluation[] = [
  { id: '1', internId: '3', score: 85, feedback: 'Great progress on React fundamentals. Keep up the good work!', date: '2026-03-25' },
  { id: '2', internId: '3', score: 90, feedback: 'Excellent teamwork during the project Alpha kickoff.', date: '2026-03-28' },
  { id: '3', internId: '4', score: 75, feedback: 'Good effort, but try to be more punctual with your check-ins.', date: '2026-03-29' },
];

export const INITIAL_SCHEDULE: Schedule = {
  id: '1',
  startTime: '09:00',
  endTime: '17:00'
};

export const INITIAL_NOTIFICATIONS: Notification[] = [];

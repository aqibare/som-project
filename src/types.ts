export type Role = 'supervisor' | 'admin' | 'intern';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  codeId?: string;
  password?: string;
  supervisorId?: string;
  // New fields
  institution?: string;
  nim?: string;
  semester?: string;
  major?: string;
  department?: string;
  assignedAt?: string;
  photoURL?: string;
}

export interface Attendance {
  id: string;
  userId: string;
  supervisorId?: string;
  date: string;
  checkIn: string;
  checkOut?: string;
  status: 'present' | 'absent' | 'late' | 'excused';
}

export interface Report {
  id: string;
  userId: string;
  supervisorId?: string;
  type: 'activity' | 'permission';
  title?: string;
  description: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
}

export interface Schedule {
  id: string;
  startTime: string; // e.g., "09:00"
  endTime: string;   // e.g., "17:00"
}

export interface Notification {
  id: string;
  userId: string; // recipient
  senderId?: string; // e.g., intern who is late
  title: string;
  message: string;
  type: 'warning' | 'info' | 'error';
  date: string;
  read: boolean;
}

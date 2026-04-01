export type Role = 'supervisor' | 'admin' | 'intern';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Attendance {
  id: string;
  userId: string;
  date: string;
  checkIn: string;
  checkOut?: string;
  status: 'present' | 'absent' | 'late';
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

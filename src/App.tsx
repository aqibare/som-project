/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { User, Attendance, Schedule, Notification } from './types';
import { INITIAL_MOCK_USERS, INITIAL_GOALS, INITIAL_ATTENDANCE, INITIAL_EVALUATIONS, INITIAL_SCHEDULE, INITIAL_NOTIFICATIONS, MockUser, Goal, Evaluation } from './mockData';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Shared states for persistence between logins
  const [mockUsers, setMockUsers] = useState<MockUser[]>(() => {
    const saved = localStorage.getItem('som_mockUsers');
    return saved ? JSON.parse(saved) : INITIAL_MOCK_USERS;
  });
  const [goals, setGoals] = useState<Goal[]>(() => {
    const saved = localStorage.getItem('som_goals');
    return saved ? JSON.parse(saved) : INITIAL_GOALS;
  });
  const [attendance, setAttendance] = useState<Attendance[]>(() => {
    const saved = localStorage.getItem('som_attendance');
    return saved ? JSON.parse(saved) : INITIAL_ATTENDANCE;
  });
  const [evaluations, setEvaluations] = useState<Evaluation[]>(() => {
    const saved = localStorage.getItem('som_evaluations');
    return saved ? JSON.parse(saved) : INITIAL_EVALUATIONS;
  });
  const [schedule, setSchedule] = useState<Schedule>(() => {
    const saved = localStorage.getItem('som_schedule');
    return saved ? JSON.parse(saved) : INITIAL_SCHEDULE;
  });
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem('som_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  // Persist states to localStorage
  useEffect(() => {
    localStorage.setItem('som_mockUsers', JSON.stringify(mockUsers));
  }, [mockUsers]);

  useEffect(() => {
    localStorage.setItem('som_goals', JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem('som_attendance', JSON.stringify(attendance));
  }, [attendance]);

  useEffect(() => {
    localStorage.setItem('som_evaluations', JSON.stringify(evaluations));
  }, [evaluations]);

  useEffect(() => {
    localStorage.setItem('som_schedule', JSON.stringify(schedule));
  }, [schedule]);

  useEffect(() => {
    localStorage.setItem('som_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = (userData: User) => {
    setIsLoading(true);
    setTimeout(() => {
      setUser(userData);
      setIsLoading(false);
    }, 1000);
  };

  const handleLogout = () => {
    setIsLoading(true);
    setTimeout(() => {
      setUser(null);
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-som-bg selection:bg-som-olive selection:text-white">
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-som-bg"
          >
            <div className="flex flex-col items-center space-y-6">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.3, 1, 0.3]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
                className="w-12 h-12 border border-som-ink/20 rounded-full flex items-center justify-center bg-white/50"
              >
                <span className="serif text-xl italic font-light">S</span>
              </motion.div>
              <p className="text-[10px] uppercase tracking-[0.4em] font-bold text-som-ink/30">
                Initializing Portal
              </p>
            </div>
          </motion.div>
        ) : !user ? (
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Login onLogin={handleLogin} mockUsers={mockUsers} />
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Dashboard 
              user={user} 
              onLogout={handleLogout}
              mockUsers={mockUsers}
              setMockUsers={setMockUsers}
              goals={goals}
              setGoals={setGoals}
              attendance={attendance}
              setAttendance={setAttendance}
              evaluations={evaluations}
              setEvaluations={setEvaluations}
              schedule={schedule}
              setSchedule={setSchedule}
              notifications={notifications}
              setNotifications={setNotifications}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

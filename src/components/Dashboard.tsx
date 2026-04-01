import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Role, Attendance, Schedule, Notification } from '../types';
import { MockUser, Goal, Evaluation } from '../mockData';
import { 
  LogOut, Shield, UserCircle, Briefcase, Bell, Settings, Search, 
  Users, UserPlus, Link as LinkIcon, MoreVertical, Trash2, Edit2, Check,
  Target, TrendingUp, Plus, ArrowUpRight, Activity, Clock, Calendar, AlertTriangle
} from 'lucide-react';
import { cn } from '../lib/utils';

interface DashboardProps {
  user: User;
  onLogout: () => void;
  mockUsers: MockUser[];
  setMockUsers: React.Dispatch<React.SetStateAction<MockUser[]>>;
  goals: Goal[];
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
  attendance: Attendance[];
  setAttendance: React.Dispatch<React.SetStateAction<Attendance[]>>;
  evaluations: Evaluation[];
  setEvaluations: React.Dispatch<React.SetStateAction<Evaluation[]>>;
  schedule: Schedule;
  setSchedule: React.Dispatch<React.SetStateAction<Schedule>>;
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
}

export default function Dashboard({ 
  user, 
  onLogout,
  mockUsers,
  setMockUsers,
  goals,
  setGoals,
  attendance,
  setAttendance,
  evaluations,
  setEvaluations,
  schedule,
  setSchedule,
  notifications,
  setNotifications
}: DashboardProps) {
  const [selectedSupervisor, setSelectedSupervisor] = useState('');
  const [selectedIntern, setSelectedIntern] = useState('');
  const [showAssignSuccess, setShowAssignSuccess] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Intern specific state
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalCategory, setNewGoalCategory] = useState('Technical');
  const [showGoalSuccess, setShowGoalSuccess] = useState(false);
  const [checkInLog, setCheckInLog] = useState<{ id: string; goalTitle: string; date: string }[]>([]);

  // Supervisor specific state
  const [selectedInternForEval, setSelectedInternForEval] = useState<string | null>(null);
  const [evalScore, setEvalScore] = useState(0);
  const [evalFeedback, setEvalFeedback] = useState('');
  const [showEvalSuccess, setShowEvalSuccess] = useState(false);
  const [selectedInternForAttendance, setSelectedInternForAttendance] = useState<string | null>(null);

  // Admin specific state
  const [editingSchedule, setEditingSchedule] = useState(false);
  const [tempStartTime, setTempStartTime] = useState(schedule.startTime);
  const [tempEndTime, setTempEndTime] = useState(schedule.endTime);

  const today = new Date().toISOString().split('T')[0];
  const userAttendanceToday = attendance.find(a => a.userId === user.id && a.date === today);

  // Check for late interns and generate notifications
  React.useEffect(() => {
    const checkLateInterns = () => {
      const now = new Date();
      const currentToday = now.toISOString().split('T')[0];
      const currentTimeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      
      if (currentTimeStr > schedule.startTime) {
        const interns = mockUsers.filter(u => u.role === 'intern');
        const newNotifications: Notification[] = [];

        interns.forEach(intern => {
          const hasAttended = attendance.some(a => a.userId === intern.id && a.date === currentToday);
          if (!hasAttended) {
            // Check if notification already exists for today to avoid duplicates
            const alreadyNotifiedIntern = notifications.some(n => 
              n.userId === intern.id && 
              n.date === currentToday && 
              n.title === 'Attendance Warning'
            );

            if (!alreadyNotifiedIntern) {
              // Notification for Intern
              newNotifications.push({
                id: Math.random().toString(36).substr(2, 9),
                userId: intern.id,
                title: 'Attendance Warning',
                message: `You haven't checked in yet! Working hours started at ${schedule.startTime}.`,
                type: 'warning',
                date: currentToday,
                read: false
              });
            }

            // Notification for Supervisor
            if (intern.supervisorId) {
              const alreadyNotifiedSupervisor = notifications.some(n => 
                n.userId === intern.supervisorId && 
                n.senderId === intern.id &&
                n.date === currentToday && 
                n.title === 'Intern Late/Absent'
              );

              if (!alreadyNotifiedSupervisor) {
                newNotifications.push({
                  id: Math.random().toString(36).substr(2, 9),
                  userId: intern.supervisorId,
                  senderId: intern.id,
                  title: 'Intern Late/Absent',
                  message: `${intern.name} has not checked in yet for today.`,
                  type: 'error',
                  date: currentToday,
                  read: false
                });
              }
            }
          }
        });

        if (newNotifications.length > 0) {
          setNotifications(prev => [...newNotifications, ...prev]);
        }
      }
    };

    const interval = setInterval(checkLateInterns, 60000); // Check every minute
    checkLateInterns(); // Initial check
    return () => clearInterval(interval);
  }, [schedule, mockUsers, attendance, notifications, setNotifications]);

  // Helper for supervisor to get intern stats
  const getInternStats = (internId: string) => {
    const internGoals = goals.filter(g => g.userId === internId);
    const internEvals = evaluations.filter(e => e.internId === internId);
    
    const goalsMet = internGoals.filter(g => g.progress === 100).length;
    const totalGoals = internGoals.length;
    
    const avgScore = internEvals.length > 0 
      ? (internEvals.reduce((acc, curr) => acc + curr.score, 0) / internEvals.length).toFixed(1)
      : '0.0';
      
    const overallProgress = internGoals.length > 0
      ? Math.round(internGoals.reduce((acc, curr) => acc + curr.progress, 0) / internGoals.length)
      : 0;

    return { goalsMet, totalGoals, avgScore, overallProgress, internGoals };
  };

  const handleDailyCheckIn = () => {
    if (userAttendanceToday) return;
    const now = new Date();
    const checkInTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    
    // Compare check-in time with schedule start time
    const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
    const isLate = now.getHours() > startHour || (now.getHours() === startHour && now.getMinutes() > startMinute);

    const newAttendance: Attendance = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      date: today,
      checkIn: checkInTime,
      status: isLate ? 'late' : 'present'
    };
    setAttendance(prev => [newAttendance, ...prev]);

    // If late, notify supervisor
    if (isLate) {
      const intern = mockUsers.find(u => u.id === user.id);
      if (intern?.supervisorId) {
        // Check if a late notification was already sent today for this intern
        const alreadyNotified = notifications.some(n => 
          n.userId === intern.supervisorId && 
          n.senderId === user.id && 
          n.date === today && 
          (n.title === 'Intern Late Check-in' || n.title === 'Intern Late/Absent')
        );

        if (!alreadyNotified) {
          const lateNotification: Notification[] = [{
            id: Math.random().toString(36).substr(2, 9),
            userId: intern.supervisorId,
            senderId: user.id,
            title: 'Intern Late Check-in',
            message: `${user.name} checked in late at ${checkInTime}.`,
            type: 'warning',
            date: today,
            read: false
          }];
          setNotifications(prev => [...lateNotification, ...prev]);
        }
      }
    }
  };

  const handleDailyCheckOut = () => {
    if (!userAttendanceToday || userAttendanceToday.checkOut) return;
    setAttendance(prev => prev.map(a => 
      a.id === userAttendanceToday.id 
        ? { ...a, checkOut: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) } 
        : a
    ));
  };

  const getRoleColor = (role: Role) => {
    switch (role) {
      case 'supervisor': return 'text-som-clay';
      case 'admin': return 'text-som-olive';
      case 'intern': return 'text-som-ink/60';
      default: return 'text-som-ink';
    }
  };

  const getRoleIcon = (role: Role) => {
    switch (role) {
      case 'supervisor': return <Shield className="w-5 h-5" />;
      case 'admin': return <UserCircle className="w-5 h-5" />;
      case 'intern': return <Briefcase className="w-5 h-5" />;
    }
  };

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupervisor || !selectedIntern) return;

    setMockUsers(prev => prev.map(u => 
      u.id === selectedIntern ? { ...u, supervisorId: selectedSupervisor } : u
    ));

    setShowAssignSuccess(true);
    setTimeout(() => setShowAssignSuccess(false), 3000);
    setSelectedSupervisor('');
    setSelectedIntern('');
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;

    const newGoal: Goal = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      title: newGoalTitle,
      progress: 0,
      category: newGoalCategory,
      steps: [
        { id: Math.random().toString(36).substr(2, 9), title: 'Initial Research', completed: false },
        { id: Math.random().toString(36).substr(2, 9), title: 'Implementation', completed: false },
        { id: Math.random().toString(36).substr(2, 9), title: 'Testing', completed: false },
      ]
    };

    setGoals(prev => [newGoal, ...prev]);
    setNewGoalTitle('');
    setNewGoalCategory('Technical');
    setShowGoalSuccess(true);
    setTimeout(() => setShowGoalSuccess(false), 3000);
  };

  const handleToggleStep = (goalId: string, stepId: string) => {
    setGoals(prev => prev.map(g => {
      if (g.id === goalId) {
        const updatedSteps = g.steps.map(s => 
          s.id === stepId ? { ...s, completed: !s.completed } : s
        );
        const completedCount = updatedSteps.filter(s => s.completed).length;
        const nextProgress = Math.round((completedCount / updatedSteps.length) * 100);
        return { ...g, steps: updatedSteps, progress: nextProgress };
      }
      return g;
    }));
  };

  const handleCheckIn = (goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    setGoals(prev => prev.map(g => {
      if (g.id === goalId) {
        const nextProgress = Math.min(g.progress + 10, 100);
        return { ...g, progress: nextProgress };
      }
      return g;
    }));

    setCheckInLog(prev => [
      { 
        id: Math.random().toString(36).substr(2, 9), 
        goalTitle: goal.title, 
        date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      },
      ...prev.slice(0, 4)
    ]);
  };

  const handleGiveEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInternForEval || evalScore === 0 || !evalFeedback.trim()) return;

    const newEval: Evaluation = {
      id: Math.random().toString(36).substr(2, 9),
      internId: selectedInternForEval,
      score: evalScore,
      feedback: evalFeedback,
      date: new Date().toISOString().split('T')[0]
    };

    setEvaluations(prev => [newEval, ...prev]);
    setShowEvalSuccess(true);
    setTimeout(() => setShowEvalSuccess(false), 3000);
    setSelectedInternForEval(null);
    setEvalScore(0);
    setEvalFeedback('');
  };

  const handleUpdateSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    setSchedule({
      ...schedule,
      startTime: tempStartTime,
      endTime: tempEndTime
    });
    setEditingSchedule(false);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const supervisors = mockUsers.filter(u => u.role === 'supervisor');
  const interns = mockUsers.filter(u => u.role === 'intern');

  const handleReaction = (evalId: string, reaction: string) => {
    setEvaluations(prev => prev.map(ev => 
      ev.id === evalId ? { ...ev, reaction } : ev
    ));
  };

  const averageProgress = Math.round(goals.reduce((acc, g) => acc + g.progress, 0) / goals.length);

  return (
    <div className="min-h-screen bg-som-bg flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-som-ink/5 bg-white/30 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <div className="serif text-2xl italic font-light tracking-tighter">SOM</div>
            <div className="hidden md:flex items-center space-x-6 text-xs uppercase tracking-widest font-medium text-som-ink/60">
              <a href="#" className="hover:text-som-ink transition-colors">Overview</a>
              <a href="#" className="hover:text-som-ink transition-colors">Documents</a>
              <a href="#" className="hover:text-som-ink transition-colors">Team</a>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button className="p-2 text-som-ink/40 hover:text-som-ink transition-colors">
              <Search className="w-5 h-5" />
            </button>
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-som-ink/40 hover:text-som-ink transition-colors relative"
              >
                <Bell className="w-5 h-5" />
                {notifications.filter(n => n.userId === user.id && !n.read).length > 0 && (
                  <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-som-clay rounded-full" />
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-4 w-80 bg-white rounded-[2rem] border border-som-ink/5 shadow-2xl shadow-som-ink/10 z-50 overflow-hidden"
                  >
                    <div className="p-6 border-b border-som-ink/5 flex items-center justify-between">
                      <h4 className="text-[10px] uppercase tracking-widest font-bold text-som-ink/40">Notifications</h4>
                      <span className="text-[10px] font-mono text-som-ink/20">
                        {notifications.filter(n => n.userId === user.id && !n.read).length} Unread
                      </span>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                      {notifications.filter(n => n.userId === user.id).length > 0 ? (
                        notifications
                          .filter(n => n.userId === user.id)
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .map(notification => (
                            <div 
                              key={notification.id}
                              className={cn(
                                "p-6 border-b border-som-ink/5 last:border-0 transition-colors",
                                !notification.read ? "bg-som-bg/30" : "opacity-60"
                              )}
                            >
                              <div className="flex items-start space-x-3">
                                <div className={cn(
                                  "p-2 rounded-xl shrink-0",
                                  notification.type === 'warning' ? "bg-yellow-100 text-yellow-600" : 
                                  notification.type === 'error' ? "bg-red-100 text-red-600" :
                                  "bg-blue-100 text-blue-600"
                                )}>
                                  <AlertTriangle className="w-3 h-3" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex justify-between items-start mb-1">
                                    <p className="text-[10px] uppercase tracking-widest font-bold">{notification.title}</p>
                                    {!notification.read && (
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          markNotificationAsRead(notification.id);
                                        }}
                                        className="text-[8px] uppercase tracking-widest font-bold text-som-olive hover:underline"
                                      >
                                        Mark read
                                      </button>
                                    )}
                                  </div>
                                  <p className="text-xs font-light leading-relaxed text-som-ink/70">{notification.message}</p>
                                  <p className="text-[8px] text-som-ink/30 mt-2 font-mono uppercase">{notification.date}</p>
                                </div>
                              </div>
                            </div>
                          ))
                      ) : (
                        <div className="p-12 text-center">
                          <p className="text-xs text-som-ink/30 serif italic">No notifications yet.</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="h-8 w-px bg-som-ink/10 mx-2" />
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium leading-none">{user.name}</p>
                <p className={`text-[10px] uppercase tracking-widest font-bold mt-1 ${getRoleColor(user.role)}`}>
                  {user.role}
                </p>
              </div>
              <button 
                onClick={onLogout}
                className="w-10 h-10 rounded-full border border-som-ink/10 flex items-center justify-center hover:bg-som-ink hover:text-white transition-all duration-300"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12">
        <header className="mb-12">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center space-x-2 mb-4">
              <span className={`p-1.5 rounded-full bg-white border border-som-ink/5 ${getRoleColor(user.role)}`}>
                {getRoleIcon(user.role)}
              </span>
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-som-ink/40">Portal Access Granted</span>
            </div>
            <h1 className="text-5xl font-light serif mb-4 tracking-tight">
              Good morning, <span className="italic">{user.name.split(' ')[0]}</span>.
            </h1>
            <p className="text-som-ink/50 font-light max-w-xl leading-relaxed">
              Welcome to your {user.role} workspace. Here you can manage your daily tasks, 
              view reports, and collaborate with your team in a minimalist environment.
            </p>
          </motion.div>
        </header>

        {/* Admin Specific Features */}
        {user.role === 'admin' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="mb-12 grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* User Management */}
            <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] border border-som-ink/5 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-som-olive/10 text-som-olive">
                    <Users className="w-5 h-5" />
                  </div>
                  <h3 className="serif text-2xl">Manage Users</h3>
                </div>
                <button className="flex items-center space-x-2 text-[10px] uppercase tracking-widest font-bold bg-som-ink text-white px-4 py-2 rounded-full hover:bg-som-olive transition-colors">
                  <UserPlus className="w-3 h-3" />
                  <span>Add User</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-som-ink/5 text-[10px] uppercase tracking-widest font-bold text-som-ink/40">
                      <th className="pb-4 font-bold">User</th>
                      <th className="pb-4 font-bold">Role</th>
                      <th className="pb-4 font-bold">Supervisor</th>
                      <th className="pb-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-som-ink/5">
                    {mockUsers.map((u) => (
                      <tr key={u.id} className="group">
                        <td className="py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-som-bg flex items-center justify-center text-[10px] font-bold uppercase">
                              {u.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{u.name}</p>
                              <p className="text-[10px] text-som-ink/40">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <span className={cn(
                            "text-[10px] uppercase tracking-widest font-bold",
                            getRoleColor(u.role)
                          )}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-4">
                          <p className="text-xs text-som-ink/60 italic font-serif">
                            {u.supervisorId 
                              ? mockUsers.find(s => s.id === u.supervisorId)?.name 
                              : u.role === 'intern' ? 'Unassigned' : 'N/A'}
                          </p>
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-1.5 hover:bg-som-bg rounded-lg text-som-ink/40 hover:text-som-ink transition-colors">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button className="p-1.5 hover:bg-red-50 rounded-lg text-som-ink/40 hover:text-red-500 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Assign Supervisor to Intern */}
            <div className="bg-white p-8 rounded-[2rem] border border-som-ink/5 shadow-sm flex flex-col">
              <div className="flex items-center space-x-3 mb-8">
                <div className="p-2 rounded-xl bg-som-clay/10 text-som-clay">
                  <LinkIcon className="w-5 h-5" />
                </div>
                <h3 className="serif text-2xl">Assign Mentorship</h3>
              </div>

              <form onSubmit={handleAssign} className="space-y-6 flex-1">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-som-ink/40">Select Supervisor</label>
                  <select 
                    value={selectedSupervisor}
                    onChange={(e) => setSelectedSupervisor(e.target.value)}
                    className="w-full bg-som-bg border-none rounded-xl py-3 px-4 text-sm focus:ring-1 focus:ring-som-olive transition-all appearance-none cursor-pointer"
                    required
                  >
                    <option value="">Choose a supervisor...</option>
                    {supervisors.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-som-ink/40">Select Intern</label>
                  <select 
                    value={selectedIntern}
                    onChange={(e) => setSelectedIntern(e.target.value)}
                    className="w-full bg-som-bg border-none rounded-xl py-3 px-4 text-sm focus:ring-1 focus:ring-som-olive transition-all appearance-none cursor-pointer"
                    required
                  >
                    <option value="">Choose an intern...</option>
                    {interns.map(i => (
                      <option key={i.id} value={i.id}>{i.name}</option>
                    ))}
                  </select>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit"
                    className="w-full py-4 rounded-full bg-som-olive text-white font-medium text-xs uppercase tracking-widest hover:bg-som-ink transition-all duration-500 shadow-lg shadow-som-olive/20"
                  >
                    Confirm Assignment
                  </button>
                </div>

                <AnimatePresence>
                  {showAssignSuccess && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-center space-x-2 text-som-olive text-[10px] font-bold uppercase tracking-widest"
                    >
                      <Check className="w-3 h-3" />
                      <span>Assignment Successful</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>

              <div className="mt-8 p-4 rounded-2xl bg-som-bg/50 border border-som-ink/5">
                <p className="text-[10px] text-som-ink/40 leading-relaxed italic">
                  Assigning a supervisor grants them access to view the intern's progress reports and daily logs.
                </p>
              </div>
            </div>

            {/* Schedule Management */}
            <div className="bg-som-ink text-white p-8 rounded-[2rem] border border-som-ink/5 shadow-xl shadow-som-ink/20 flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-white/10 text-som-olive">
                    <Clock className="w-5 h-5" />
                  </div>
                  <h3 className="serif text-2xl">Working Hours</h3>
                </div>
                {!editingSchedule && (
                  <button 
                    onClick={() => setEditingSchedule(true)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {editingSchedule ? (
                <form onSubmit={handleUpdateSchedule} className="space-y-6 flex-1">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-white/40">Start Time</label>
                    <input 
                      type="time"
                      value={tempStartTime}
                      onChange={(e) => setTempStartTime(e.target.value)}
                      className="w-full bg-white/10 border-none rounded-xl py-3 px-4 text-sm focus:ring-1 focus:ring-som-olive transition-all text-white"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-white/40">End Time</label>
                    <input 
                      type="time"
                      value={tempEndTime}
                      onChange={(e) => setTempEndTime(e.target.value)}
                      className="w-full bg-white/10 border-none rounded-xl py-3 px-4 text-sm focus:ring-1 focus:ring-som-olive transition-all text-white"
                      required
                    />
                  </div>
                  <div className="flex space-x-3 pt-4">
                    <button 
                      type="button"
                      onClick={() => setEditingSchedule(false)}
                      className="flex-1 py-3 rounded-full border border-white/20 text-white font-medium text-[10px] uppercase tracking-widest hover:bg-white/5 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 py-3 rounded-full bg-som-olive text-white font-medium text-[10px] uppercase tracking-widest hover:bg-som-bg hover:text-som-olive transition-all shadow-lg shadow-som-olive/20"
                    >
                      Save
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-8 flex-1 flex flex-col justify-center">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 rounded-3xl bg-white/5 border border-white/10 text-center">
                      <p className="text-[10px] uppercase tracking-widest font-bold text-white/30 mb-2">Starts At</p>
                      <p className="text-3xl serif italic">{schedule.startTime}</p>
                    </div>
                    <div className="p-6 rounded-3xl bg-white/5 border border-white/10 text-center">
                      <p className="text-[10px] uppercase tracking-widest font-bold text-white/30 mb-2">Ends At</p>
                      <p className="text-3xl serif italic">{schedule.endTime}</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-som-olive/10 border border-som-olive/20">
                    <p className="text-[10px] text-som-olive leading-relaxed italic text-center">
                      Interns checking in after {schedule.startTime} will be automatically marked as "Late".
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Intern Specific Features */}
        {user.role === 'intern' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="mb-12 grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Goal Management */}
            <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] border border-som-ink/5 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-som-olive/10 text-som-olive">
                    <Target className="w-5 h-5" />
                  </div>
                  <h3 className="serif text-2xl">Personal Goals</h3>
                </div>
              </div>

              {/* Create Goal Form */}
              <form onSubmit={handleAddGoal} className="mb-10 grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                <div className="md:col-span-7 space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-som-ink/40">New Target</label>
                  <input 
                    type="text"
                    value={newGoalTitle}
                    onChange={(e) => setNewGoalTitle(e.target.value)}
                    placeholder="e.g. Learn Advanced CSS Grid"
                    className="w-full bg-som-bg border-none rounded-xl py-3 px-4 text-sm focus:ring-1 focus:ring-som-olive transition-all"
                    required
                  />
                </div>
                <div className="md:col-span-3 space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-som-ink/40">Category</label>
                  <select 
                    value={newGoalCategory}
                    onChange={(e) => setNewGoalCategory(e.target.value)}
                    className="w-full bg-som-bg border-none rounded-xl py-3 px-4 text-sm focus:ring-1 focus:ring-som-olive transition-all appearance-none cursor-pointer"
                  >
                    <option value="Technical">Technical</option>
                    <option value="Project">Project</option>
                    <option value="Soft Skills">Soft Skills</option>
                    <option value="Administrative">Administrative</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <button 
                    type="submit"
                    className="w-full p-3.5 rounded-xl bg-som-ink text-white hover:bg-som-olive transition-colors flex items-center justify-center"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </form>

              {/* Goals List */}
              <div className="space-y-6">
                {goals.filter(g => g.userId === user.id).length > 0 ? (
                  goals.filter(g => g.userId === user.id).map((goal) => (
                    <div key={goal.id} className="p-8 rounded-[2rem] bg-som-bg/30 border border-som-ink/5 group relative overflow-hidden">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <span className="text-[9px] uppercase tracking-widest font-bold text-som-olive bg-som-olive/10 px-2 py-0.5 rounded mb-2 inline-block">
                            {goal.category}
                          </span>
                          <h4 className="text-xl serif">{goal.title}</h4>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl serif text-som-olive">{goal.progress}%</span>
                          <p className="text-[8px] uppercase tracking-widest font-bold text-som-ink/30">Completion</p>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="h-1.5 w-full bg-som-ink/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${goal.progress}%` }}
                            className="h-full bg-som-olive"
                          />
                        </div>

                        <div className="space-y-3">
                          <p className="text-[10px] uppercase tracking-widest font-bold text-som-ink/40 mb-2">Milestones</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {goal.steps.map(step => (
                              <button 
                                key={step.id}
                                onClick={() => handleToggleStep(goal.id, step.id)}
                                className={cn(
                                  "flex items-center space-x-3 p-4 rounded-2xl border transition-all text-left group/step",
                                  step.completed 
                                    ? "bg-som-olive/5 border-som-olive/20 text-som-olive" 
                                    : "bg-white border-som-ink/5 text-som-ink/60 hover:border-som-olive/30"
                                )}
                              >
                                <div className={cn(
                                  "w-5 h-5 rounded-full border flex items-center justify-center transition-all shrink-0",
                                  step.completed ? "bg-som-olive border-som-olive text-white" : "border-som-ink/20 group-hover/step:border-som-olive/50"
                                )}>
                                  {step.completed && <Check className="w-3 h-3" />}
                                </div>
                                <span className={cn(
                                  "text-xs font-light",
                                  step.completed ? "line-through opacity-60" : ""
                                )}>
                                  {step.title}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 bg-som-bg/20 rounded-[2rem] border border-dashed border-som-ink/10">
                    <p className="text-sm text-som-ink/30 italic serif">No goals set yet. Start by adding one above.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Performance & Stats */}
            <div className="space-y-8">
              {/* Daily Attendance Card */}
              <div className="bg-som-olive text-white p-8 rounded-[2rem] shadow-xl shadow-som-olive/20 relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-colors" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-xl bg-white/10">
                        <Clock className="w-5 h-5" />
                      </div>
                      <h3 className="serif text-2xl">Daily Attendance</h3>
                    </div>
                    <div className="text-[10px] font-mono opacity-50">{today}</div>
                  </div>

                  {!userAttendanceToday ? (
                    <div className="space-y-6">
                      <p className="text-sm font-light opacity-80">You haven't checked in for today yet. Please mark your attendance.</p>
                      <button 
                        onClick={handleDailyCheckIn}
                        className="w-full py-4 rounded-full bg-white text-som-olive font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-som-bg transition-all shadow-lg"
                      >
                        Check-in Now
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-white/10 border border-white/10">
                          <p className="text-[8px] uppercase tracking-widest font-bold opacity-50 mb-1">Check-in</p>
                          <p className="text-xl serif">{userAttendanceToday.checkIn}</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/10 border border-white/10">
                          <p className="text-[8px] uppercase tracking-widest font-bold opacity-50 mb-1">Check-out</p>
                          <p className="text-xl serif">{userAttendanceToday.checkOut || '--:--'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            userAttendanceToday.status === 'present' ? "bg-green-400" : "bg-yellow-400"
                          )} />
                          <span className="text-[10px] uppercase tracking-widest font-bold opacity-80">
                            Status: {userAttendanceToday.status}
                          </span>
                        </div>
                        {!userAttendanceToday.checkOut && (
                          <button 
                            onClick={handleDailyCheckOut}
                            className="text-[10px] uppercase tracking-widest font-bold border-b border-white/30 pb-1 hover:border-white transition-colors"
                          >
                            Check-out
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2rem] border border-som-ink/5 shadow-sm">
                <div className="flex items-center space-x-3 mb-8">
                  <div className="p-2 rounded-xl bg-som-clay/10 text-som-clay">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <h3 className="serif text-2xl">Performance</h3>
                </div>

                <div className="space-y-8">
                  <div className="text-center py-6">
                    <div className="relative inline-block">
                      <svg className="w-32 h-32 transform -rotate-90">
                        <circle
                          cx="64"
                          cy="64"
                          r="58"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          className="text-som-bg"
                        />
                        <motion.circle
                          cx="64"
                          cy="64"
                          r="58"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={364.4}
                          initial={{ strokeDashoffset: 364.4 }}
                          animate={{ strokeDashoffset: 364.4 - (364.4 * averageProgress) / 100 }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          className="text-som-olive"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-light serif">{averageProgress}%</span>
                        <span className="text-[8px] uppercase tracking-widest font-bold text-som-ink/40">Average</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-som-bg/50 border border-som-ink/5">
                      <p className="text-[10px] uppercase tracking-widest font-bold text-som-ink/40 mb-1">Goals</p>
                      <p className="text-2xl serif">{goals.length}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-som-bg/50 border border-som-ink/5">
                      <p className="text-[10px] uppercase tracking-widest font-bold text-som-ink/40 mb-1">Finished</p>
                      <p className="text-2xl serif">{goals.filter(g => g.progress === 100).length}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-som-ink/5">
                    <h4 className="text-[10px] uppercase tracking-widest font-bold text-som-ink/40 mb-4">Weekly Activity</h4>
                    <div className="flex items-end justify-between h-20 px-2">
                      {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                        <motion.div 
                          key={i}
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          className="w-2 bg-som-olive/20 rounded-t-full hover:bg-som-olive transition-colors cursor-help"
                        />
                      ))}
                    </div>
                    <div className="flex justify-between mt-2 text-[8px] font-mono text-som-ink/30 px-1">
                      <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-som-ink text-white p-8 rounded-[2rem] shadow-xl shadow-som-ink/20">
                <div className="flex items-center space-x-3 mb-6">
                  <ArrowUpRight className="w-5 h-5 text-som-olive" />
                  <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold">Recent Check-ins</h4>
                </div>
                <div className="space-y-4">
                  {checkInLog.length > 0 ? (
                    checkInLog.map((log) => (
                      <div key={log.id} className="flex justify-between items-center border-b border-white/10 pb-2 last:border-0">
                        <div className="flex flex-col">
                          <span className="text-xs font-medium">{log.goalTitle}</span>
                          <span className="text-[8px] text-white/40 uppercase tracking-widest">{log.date}</span>
                        </div>
                        <div className="p-1 rounded-full bg-som-olive/20 text-som-olive">
                          <Check className="w-3 h-3" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] text-white/40 italic">No check-ins today yet.</p>
                  )}
                </div>
                <div className="mt-6 flex items-center space-x-2 text-[10px] font-bold text-som-olive cursor-pointer hover:underline">
                  <span>View All History</span>
                  <ArrowUpRight className="w-3 h-3" />
                </div>
              </div>

              {/* Supervisor Feedback Section */}
              <div className="bg-white p-8 rounded-[2rem] border border-som-ink/5 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-som-olive/10 text-som-olive">
                      <Bell className="w-5 h-5" />
                    </div>
                    <h3 className="serif text-2xl">Supervisor Feedback</h3>
                  </div>
                  <span className="text-[10px] font-mono text-som-ink/30">
                    {evaluations.filter(e => e.internId === user.id).length} Total
                  </span>
                </div>

                <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {evaluations
                    .filter(e => e.internId === user.id)
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((evaluation) => (
                      <div key={evaluation.id} className="p-6 rounded-2xl bg-som-bg/30 border border-som-ink/5 space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-[10px] uppercase tracking-widest font-bold text-som-ink/40 mb-1">{evaluation.date}</p>
                            <div className="flex items-center space-x-2">
                              <span className="text-xl serif text-som-olive">{evaluation.score}%</span>
                              <span className="text-[10px] text-som-ink/30 uppercase tracking-tighter">Performance Score</span>
                            </div>
                          </div>
                          {evaluation.reaction && (
                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-lg">
                              {evaluation.reaction}
                            </div>
                          )}
                        </div>
                        
                        <p className="text-sm text-som-ink/70 font-light leading-relaxed italic">
                          "{evaluation.feedback}"
                        </p>

                        <div className="pt-4 border-t border-som-ink/5 flex items-center justify-between">
                          <span className="text-[9px] uppercase tracking-widest font-bold text-som-ink/30">React to feedback</span>
                          <div className="flex space-x-2">
                            {['👍', '🙏', '🔥', '💡'].map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() => handleReaction(evaluation.id, emoji)}
                                className={cn(
                                  "w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110",
                                  evaluation.reaction === emoji 
                                    ? "bg-som-olive text-white shadow-lg shadow-som-olive/20" 
                                    : "bg-white text-som-ink/40 hover:bg-som-bg"
                                )}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  
                  {evaluations.filter(e => e.internId === user.id).length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-sm text-som-ink/30 serif italic">No feedback received yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Supervisor Specific Features */}
        {user.role === 'supervisor' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="mb-12 space-y-12"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Monitor Interns */}
              <div className="lg:col-span-2 space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-som-olive/10 text-som-olive">
                      <Users className="w-5 h-5" />
                    </div>
                    <h3 className="serif text-3xl">Monitor Interns</h3>
                  </div>
                  <div className="text-[10px] uppercase tracking-widest font-bold text-som-ink/40">
                    {mockUsers.filter(u => u.supervisorId === user.id).length} Active Assignments
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {mockUsers.filter(u => u.supervisorId === user.id).length > 0 ? (
                      mockUsers.filter(u => u.supervisorId === user.id).map((intern) => {
                        const stats = getInternStats(intern.id);
                        return (
                          <motion.div 
                            key={intern.id} 
                            whileHover={{ y: -4 }}
                            className="bg-white p-8 rounded-[2.5rem] border border-som-ink/5 shadow-sm hover:shadow-md transition-all group"
                          >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                              <div className="flex items-center space-x-5">
                                <div className="w-16 h-16 rounded-full bg-som-bg border border-som-ink/5 flex items-center justify-center serif italic text-2xl text-som-ink/80 overflow-hidden relative">
                                  <img 
                                    src={`https://picsum.photos/seed/${intern.id}/100/100`} 
                                    alt={intern.name}
                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                                <div>
                                  <h4 className="font-medium text-xl mb-1">{intern.name}</h4>
                                  <p className="text-xs text-som-ink/40 font-light">{intern.email}</p>
                                  <div className="flex items-center space-x-2 mt-2">
                                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                    <span className="text-[10px] uppercase tracking-widest font-bold text-som-ink/30">Active Now</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center space-x-8">
                                <div className="text-right">
                                  <p className="text-[10px] uppercase tracking-widest font-bold text-som-ink/40 mb-1">Overall Progress</p>
                                  <div className="flex items-center space-x-3">
                                    <div className="w-24 h-1.5 bg-som-bg rounded-full overflow-hidden">
                                      <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${stats.overallProgress}%` }}
                                        className="h-full bg-som-olive"
                                      />
                                    </div>
                                    <span className="text-lg serif text-som-olive">{stats.overallProgress}%</span>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <button 
                                    onClick={() => setSelectedInternForAttendance(intern.id)}
                                    className="p-3 rounded-full bg-som-bg text-som-ink/40 hover:text-som-olive hover:bg-som-olive/10 transition-all"
                                    title="View Attendance"
                                  >
                                    <Calendar className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => setSelectedInternForEval(intern.id)}
                                    className="bg-som-ink text-white text-[10px] uppercase tracking-widest font-bold px-6 py-3 rounded-full hover:bg-som-olive transition-all shadow-lg shadow-som-ink/10"
                                  >
                                    Evaluate
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Mini Stats for Intern */}
                            <div className="mt-8 pt-8 border-t border-som-ink/5 grid grid-cols-3 gap-4">
                              <div className="text-center">
                                <p className="text-[8px] uppercase tracking-widest font-bold text-som-ink/30 mb-1">Goals Met</p>
                                <p className="text-sm serif">{stats.goalsMet} / {stats.totalGoals}</p>
                              </div>
                              <div className="text-center border-x border-som-ink/5">
                                <p className="text-[8px] uppercase tracking-widest font-bold text-som-ink/30 mb-1">Last Check-in</p>
                                <p className="text-sm serif">
                                  {attendance.filter(a => a.userId === intern.id).length > 0 
                                    ? attendance.filter(a => a.userId === intern.id).sort((a, b) => b.date.localeCompare(a.date))[0].date
                                    : 'N/A'}
                                </p>
                              </div>
                              <div className="text-center">
                                <p className="text-[8px] uppercase tracking-widest font-bold text-som-ink/30 mb-1">Avg Score</p>
                                <p className="text-sm serif">{stats.avgScore}</p>
                              </div>
                            </div>

                            {/* Task Monitoring Section */}
                            <div className="mt-8 pt-8 border-t border-som-ink/5">
                              <div className="flex items-center justify-between mb-6">
                                <h5 className="text-[10px] uppercase tracking-[0.2em] font-bold text-som-ink/40">Active Tasks & Steps</h5>
                                <div className="h-px flex-1 mx-4 bg-som-ink/5" />
                              </div>
                              <div className="space-y-6">
                                {stats.internGoals.length > 0 ? (
                                  stats.internGoals.map(goal => (
                                    <div key={goal.id} className="space-y-3">
                                      <div className="flex justify-between items-center">
                                        <span className="text-xs font-medium text-som-ink/80">{goal.title}</span>
                                        <span className="text-[10px] font-serif italic text-som-olive">{goal.progress}%</span>
                                      </div>
                                      <div className="w-full h-1 bg-som-bg rounded-full overflow-hidden">
                                        <div 
                                          className="h-full bg-som-olive transition-all duration-500" 
                                          style={{ width: `${goal.progress}%` }} 
                                        />
                                      </div>
                                      <div className="flex flex-wrap gap-2">
                                        {goal.steps.map(step => (
                                          <div 
                                            key={step.id}
                                            className={cn(
                                              "text-[8px] px-2 py-1 rounded-full border transition-all",
                                              step.completed 
                                                ? "bg-som-olive/10 border-som-olive/20 text-som-olive" 
                                                : "bg-som-bg border-som-ink/5 text-som-ink/30"
                                            )}
                                          >
                                            {step.title}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-[10px] text-som-ink/30 italic">No tasks assigned yet.</p>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })
                  ) : (
                    <div className="text-center py-20 bg-white/50 border-2 border-dashed border-som-ink/5 rounded-[3rem]">
                      <p className="text-som-ink/30 italic serif text-xl">No interns assigned to your mentorship yet.</p>
                      <p className="text-[10px] uppercase tracking-widest font-bold text-som-ink/20 mt-2">Contact Admin to assign interns</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar for Supervisor */}
              <div className="space-y-8">
                {/* Team Overview Card */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-som-ink/5 shadow-sm">
                  <div className="flex items-center space-x-3 mb-8">
                    <div className="p-2 rounded-xl bg-som-clay/10 text-som-clay">
                      <Activity className="w-5 h-5" />
                    </div>
                    <h4 className="text-[10px] uppercase tracking-[0.3em] font-bold text-som-ink/40">Team Overview</h4>
                  </div>
                  
                  <div className="space-y-8">
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-light text-som-ink/50">Total Interns</span>
                      <span className="text-4xl serif">{mockUsers.filter(u => u.supervisorId === user.id).length}</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-light text-som-ink/50">Pending Evals</span>
                      <span className="text-4xl serif text-som-clay">2</span>
                    </div>
                    <div className="pt-6 border-t border-som-ink/5">
                      <p className="text-[10px] text-som-ink/40 leading-relaxed italic font-light">
                        "Mentorship is a brain to pick, an ear to listen, and a push in the right direction."
                      </p>
                    </div>
                  </div>
                </div>

                {/* Recent Evaluations Card */}
                <div className="bg-som-ink text-white p-8 rounded-[2.5rem] shadow-xl shadow-som-ink/20 relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-som-olive/10 rounded-full blur-2xl group-hover:bg-som-olive/20 transition-colors" />
                  <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold mb-6 flex items-center space-x-2">
                    <Check className="w-3 h-3 text-som-olive" />
                    <span>Recent Evaluations</span>
                  </h4>
                  <div className="space-y-5">
                    {evaluations.length > 0 ? (
                      evaluations.slice(0, 3).map(ev => (
                        <div key={ev.id} className="border-b border-white/10 pb-4 last:border-0">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-medium">
                              {mockUsers.find(u => u.id === ev.internId)?.name}
                            </span>
                            <span className="text-xs font-serif italic text-som-olive">{ev.score}%</span>
                          </div>
                          <p className="text-[10px] text-white/40 line-clamp-2 font-light italic leading-relaxed">
                            "{ev.feedback}"
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-white/30 italic font-light">No evaluations submitted in this period.</p>
                    )}
                  </div>
                  {evaluations.length > 0 && (
                    <button className="mt-6 text-[10px] uppercase tracking-widest font-bold text-som-olive hover:text-white transition-colors flex items-center space-x-2">
                      <span>View Full History</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Team Attendance Card */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-som-ink/5 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-xl bg-som-olive/10 text-som-olive">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <h4 className="text-[10px] uppercase tracking-[0.3em] font-bold text-som-ink/40">Today's Attendance</h4>
                    </div>
                    <div className="text-[8px] font-mono text-som-ink/30 uppercase tracking-widest">
                      Starts: {schedule.startTime}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {mockUsers.filter(u => u.supervisorId === user.id).map(intern => {
                      const internAttendance = attendance.find(a => a.userId === intern.id && a.date === today);
                      const isPastStart = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) > schedule.startTime;
                      
                      return (
                        <div key={intern.id} className="flex items-center justify-between py-3 border-b border-som-ink/5 last:border-0">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-som-bg flex items-center justify-center text-[10px] serif italic overflow-hidden">
                              <img 
                                src={`https://picsum.photos/seed/${intern.id}/50/50`} 
                                alt={intern.name}
                                className="w-full h-full object-cover opacity-50"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-medium">{intern.name}</span>
                              <span className={cn(
                                "text-[8px] uppercase tracking-widest",
                                internAttendance?.status === 'late' ? "text-yellow-600 font-bold" : "text-som-ink/40"
                              )}>
                                {internAttendance ? (
                                  `${internAttendance.status === 'late' ? 'Late: ' : ''}${internAttendance.checkIn}`
                                ) : (
                                  isPastStart ? (
                                    <span className="text-red-500 font-bold flex items-center space-x-1">
                                      <AlertTriangle className="w-2 h-2" />
                                      <span>Not checked in</span>
                                    </span>
                                  ) : 'Not checked in'
                                )}
                              </span>
                            </div>
                          </div>
                          {internAttendance ? (
                            <div className={cn(
                              "w-2 h-2 rounded-full",
                              internAttendance.status === 'present' ? "bg-green-400" : "bg-yellow-400"
                            )} title={internAttendance.status} />
                          ) : (
                            <div className={cn(
                              "w-2 h-2 rounded-full",
                              isPastStart ? "bg-red-400 animate-pulse" : "bg-som-ink/10"
                            )} title={isPastStart ? "Late/Absent" : "Waiting"} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Success Message for Evaluation */}
                <AnimatePresence>
                  {showEvalSuccess && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="p-4 rounded-2xl bg-som-olive/10 border border-som-olive/20 flex items-center space-x-3"
                    >
                      <div className="p-1.5 rounded-full bg-som-olive text-white">
                        <Check className="w-3 h-3" />
                      </div>
                      <span className="text-[10px] uppercase tracking-widest font-bold text-som-olive">Evaluation Recorded</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Evaluation Modal */}
            <AnimatePresence>
              {selectedInternForEval && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-som-ink/60 backdrop-blur-md"
                >
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="bg-white w-full max-w-xl rounded-[3rem] p-12 shadow-2xl relative overflow-hidden"
                  >
                    {/* Decorative element */}
                    <div className="absolute top-0 left-0 w-full h-2 bg-som-olive" />
                    
                    <button 
                      onClick={() => setSelectedInternForEval(null)}
                      className="absolute top-10 right-10 text-som-ink/20 hover:text-som-ink transition-colors p-2 hover:bg-som-bg rounded-full"
                    >
                      <Plus className="w-6 h-6 rotate-45" />
                    </button>

                    <div className="mb-10">
                      <div className="flex items-center space-x-3 mb-4">
                        <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-som-olive">Performance Review</span>
                        <div className="h-px w-12 bg-som-olive/20" />
                      </div>
                      <h3 className="serif text-4xl mb-3">Evaluate Intern</h3>
                      <p className="text-sm text-som-ink/50 font-light">
                        Providing feedback for <span className="font-medium text-som-ink italic">{mockUsers.find(u => u.id === selectedInternForEval)?.name}</span>
                      </p>
                    </div>

                    <form onSubmit={handleGiveEvaluation} className="space-y-8">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] uppercase tracking-widest font-bold text-som-ink/40">Performance Score</label>
                          <span className="text-2xl font-serif italic text-som-olive">{evalScore}<span className="text-xs text-som-ink/30 not-italic ml-1">/ 100</span></span>
                        </div>
                        <div className="relative pt-2">
                          <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            step="5"
                            value={evalScore}
                            onChange={(e) => setEvalScore(parseInt(e.target.value))}
                            className="w-full h-1.5 bg-som-bg rounded-full appearance-none cursor-pointer accent-som-olive"
                          />
                          <div className="flex justify-between mt-2 text-[8px] font-mono text-som-ink/20 uppercase tracking-tighter">
                            <span>Needs Improvement</span>
                            <span>Exceptional</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-som-ink/40">Feedback & Observations</label>
                        <textarea 
                          value={evalFeedback}
                          onChange={(e) => setEvalFeedback(e.target.value)}
                          placeholder="What did they excel at? Where can they grow?"
                          className="w-full bg-som-bg border-none rounded-[2rem] py-6 px-7 text-sm focus:ring-1 focus:ring-som-olive transition-all min-h-[160px] resize-none placeholder:text-som-ink/20"
                          required
                        />
                      </div>

                      <div className="pt-4">
                        <button 
                          type="submit"
                          className="w-full py-5 rounded-full bg-som-ink text-white font-medium text-xs uppercase tracking-widest hover:bg-som-olive transition-all duration-500 shadow-xl shadow-som-ink/20 flex items-center justify-center space-x-3 group"
                        >
                          <span>Submit Evaluation</span>
                          <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Attendance History Modal */}
            <AnimatePresence>
              {selectedInternForAttendance && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-som-ink/60 backdrop-blur-md"
                >
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="bg-white w-full max-w-2xl rounded-[3rem] p-12 shadow-2xl relative overflow-hidden"
                  >
                    {/* Decorative element */}
                    <div className="absolute top-0 left-0 w-full h-2 bg-som-clay" />
                    
                    <button 
                      onClick={() => setSelectedInternForAttendance(null)}
                      className="absolute top-10 right-10 text-som-ink/20 hover:text-som-ink transition-colors p-2 hover:bg-som-bg rounded-full"
                    >
                      <Plus className="w-6 h-6 rotate-45" />
                    </button>

                    <div className="mb-10">
                      <div className="flex items-center space-x-3 mb-4">
                        <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-som-clay">Attendance Monitoring</span>
                        <div className="h-px w-12 bg-som-clay/20" />
                      </div>
                      <h3 className="serif text-4xl mb-3">Attendance History</h3>
                      <p className="text-sm text-som-ink/50 font-light">
                        Reviewing records for <span className="font-medium text-som-ink italic">{mockUsers.find(u => u.id === selectedInternForAttendance)?.name}</span>
                      </p>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-som-ink/5">
                            <th className="py-4 text-[10px] uppercase tracking-widest font-bold text-som-ink/40">Date</th>
                            <th className="py-4 text-[10px] uppercase tracking-widest font-bold text-som-ink/40">Check-in</th>
                            <th className="py-4 text-[10px] uppercase tracking-widest font-bold text-som-ink/40">Check-out</th>
                            <th className="py-4 text-[10px] uppercase tracking-widest font-bold text-som-ink/40 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-som-ink/5">
                          {attendance
                            .filter(a => a.userId === selectedInternForAttendance)
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .map((record) => (
                              <tr key={record.id} className="group hover:bg-som-bg/30 transition-colors">
                                <td className="py-4 text-sm font-medium">{record.date}</td>
                                <td className="py-4 text-sm text-som-ink/60 font-light">{record.checkIn}</td>
                                <td className="py-4 text-sm text-som-ink/60 font-light">{record.checkOut || '--:--'}</td>
                                <td className="py-4 text-right">
                                  <span className={cn(
                                    "text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded",
                                    record.status === 'present' ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"
                                  )}>
                                    {record.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          {attendance.filter(a => a.userId === selectedInternForAttendance).length === 0 && (
                            <tr>
                              <td colSpan={4} className="py-12 text-center text-som-ink/30 italic serif">
                                No attendance records found for this intern.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-10 p-8 rounded-[2rem] bg-som-bg/50 border border-som-ink/5 flex items-center justify-between">
                      <div className="flex items-center space-x-8">
                        <div className="text-center">
                          <p className="text-[8px] uppercase tracking-widest font-bold text-som-ink/30 mb-1">Present</p>
                          <p className="text-2xl serif text-green-600">
                            {attendance.filter(a => a.userId === selectedInternForAttendance && a.status === 'present').length}
                          </p>
                        </div>
                        <div className="w-px h-10 bg-som-ink/10" />
                        <div className="text-center">
                          <p className="text-[8px] uppercase tracking-widest font-bold text-som-ink/30 mb-1">Late</p>
                          <p className="text-2xl serif text-yellow-600">
                            {attendance.filter(a => a.userId === selectedInternForAttendance && a.status === 'late').length}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] uppercase tracking-widest font-bold text-som-ink/30 mb-1">Attendance Rate</p>
                        <p className="text-2xl serif">
                          {Math.round((attendance.filter(a => a.userId === selectedInternForAttendance).length / 20) * 100)}%
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Dashboard Grid (Admin Only) */}
        {user.role === 'admin' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Stats/Cards */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6"
            >
              <div className="bg-white p-8 rounded-[2rem] border border-som-ink/5 shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex justify-between items-start mb-8">
                  <div className="p-3 rounded-2xl bg-som-bg group-hover:bg-som-olive/10 transition-colors">
                    <Settings className="w-6 h-6 text-som-olive" />
                  </div>
                  <span className="text-xs font-mono text-som-ink/30">01</span>
                </div>
                <h3 className="serif text-2xl mb-2">System Health</h3>
                <p className="text-sm text-som-ink/50 font-light mb-6">All systems are operational and running at peak performance.</p>
                <div className="h-1 w-full bg-som-bg rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '94%' }}
                    transition={{ duration: 1.5, delay: 0.5 }}
                    className="h-full bg-som-olive"
                  />
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-som-ink/40">Efficiency</span>
                  <span className="text-[10px] font-mono text-som-olive">94%</span>
                </div>
              </div>

              <div className="bg-som-olive text-white p-8 rounded-[2rem] shadow-xl shadow-som-olive/20 group">
                <div className="flex justify-between items-start mb-8">
                  <div className="p-3 rounded-2xl bg-white/10 group-hover:bg-white/20 transition-colors">
                    <Activity className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-mono text-white/30">02</span>
                </div>
                <h3 className="serif text-2xl mb-2 text-white">Platform Stats</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-end border-b border-white/10 pb-2">
                    <span className="text-[10px] uppercase tracking-widest font-bold opacity-50">Total Interns</span>
                    <span className="text-2xl serif">{mockUsers.filter(u => u.role === 'intern').length}</span>
                  </div>
                  <div className="flex justify-between items-end border-b border-white/10 pb-2">
                    <span className="text-[10px] uppercase tracking-widest font-bold opacity-50">Total Supervisors</span>
                    <span className="text-2xl serif">{mockUsers.filter(u => u.role === 'supervisor').length}</span>
                  </div>
                </div>
              </div>

              <div className="sm:col-span-2 bg-white p-8 rounded-[2rem] border border-som-ink/5 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="serif text-2xl">Recent Activity</h3>
                  <button className="text-[10px] uppercase tracking-widest font-bold text-som-olive">Download Report</button>
                </div>
                <div className="space-y-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between py-4 border-b border-som-ink/5 last:border-0">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-full bg-som-bg flex items-center justify-center text-xs serif italic">
                          {i}
                        </div>
                        <div>
                          <p className="text-sm font-medium">Project update published</p>
                          <p className="text-xs text-som-ink/40 font-light">2 hours ago by Sarah M.</p>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-1 rounded bg-som-bg text-som-ink/60 font-bold uppercase tracking-tighter">
                        Completed
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Sidebar Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="space-y-8"
            >
              <div className="bg-white/50 backdrop-blur-sm p-8 rounded-[2rem] border border-som-ink/5">
                <h4 className="text-[10px] uppercase tracking-[0.3em] font-bold text-som-ink/40 mb-6">Role Privileges</h4>
                <ul className="space-y-4">
                  {[
                    { label: 'Access Level', value: 'Tier 2' },
                    { label: 'Data Editing', value: 'Enabled' },
                    { label: 'Team Management', value: 'None' },
                    { label: 'System Logs', value: 'View Only' },
                  ].map((item, i) => (
                    <li key={i} className="flex justify-between items-center text-xs">
                      <span className="font-light text-som-ink/50">{item.label}</span>
                      <span className="font-medium">{item.value}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden group">
                <img 
                  src="https://picsum.photos/seed/minimal/800/1000" 
                  alt="Minimalist workspace" 
                  className="object-cover w-full h-full transition-transform duration-1000 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-som-ink/80 via-transparent to-transparent flex flex-col justify-end p-8">
                  <p className="text-white/60 text-[10px] uppercase tracking-widest font-bold mb-2">Inspiration</p>
                  <h3 className="serif text-2xl text-white italic">"Simplicity is the ultimate sophistication."</h3>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Sidebar Info for Interns (Moved here for layout consistency) */}
        {user.role === 'intern' && (
          <div className="mt-8">
             <p className="text-[10px] text-som-ink/30 text-center font-light uppercase tracking-[0.5em]">
               Focus on the process, not just the outcome.
             </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-som-ink/5 py-12 bg-white/20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
          <div className="serif text-xl italic font-light">SOM</div>
          <div className="flex space-x-8 text-[10px] uppercase tracking-widest font-bold text-som-ink/40">
            <a href="#" className="hover:text-som-ink transition-colors">Privacy</a>
            <a href="#" className="hover:text-som-ink transition-colors">Terms</a>
            <a href="#" className="hover:text-som-ink transition-colors">Support</a>
          </div>
          <p className="text-[10px] text-som-ink/30 font-light">
            &copy; 2026 SOM PORTAL. DESIGNED FOR CLARITY.
          </p>
        </div>
      </footer>
    </div>
  );
}

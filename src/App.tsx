/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { User, Attendance, Schedule, Notification, Report } from './types';
import { INITIAL_MOCK_USERS, INITIAL_GOALS, INITIAL_ATTENDANCE, INITIAL_EVALUATIONS, INITIAL_SCHEDULE, INITIAL_NOTIFICATIONS, INITIAL_REPORTS, MockUser, Goal, Evaluation } from './mockData';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  doc, 
  getDoc, 
  setDoc, 
  query, 
  where,
  getDocFromServer,
  or
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './lib/firebaseUtils';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Shared states
  const [mockUsers, setMockUsers] = useState<MockUser[]>(INITIAL_MOCK_USERS);
  const [goals, setGoals] = useState<Goal[]>(INITIAL_GOALS);
  const [attendance, setAttendance] = useState<Attendance[]>(INITIAL_ATTENDANCE);
  const [evaluations, setEvaluations] = useState<Evaluation[]>(INITIAL_EVALUATIONS);
  const [schedule, setSchedule] = useState<Schedule>(INITIAL_SCHEDULE);
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [reports, setReports] = useState<Report[]>(INITIAL_REPORTS);

  // Test connection to Firestore
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. ");
        }
      }
    }
    testConnection();
  }, []);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setUser(userDoc.data() as User);
          } else {
            // New user - default to intern for demo purposes if not found
            // EXCEPT for the default admin email
            const isAdminEmail = firebaseUser.email === "areifaqib@gmail.com";
            const newUser: User = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || 'New User',
              email: firebaseUser.email || '',
              role: isAdminEmail ? 'admin' : 'intern'
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
            await setDoc(doc(db, 'public_users', firebaseUser.uid), {
              id: newUser.id,
              name: newUser.name,
              role: newUser.role
            });
            setUser(newUser);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
        }
      } else {
        setUser(null);
      }
      setIsAuthReady(true);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Firestore Real-time Listeners
  useEffect(() => {
    if (!isAuthReady || !user) return;

    const usersQuery = user.role === 'admin'
      ? collection(db, 'users')
      : user.role === 'supervisor'
        ? query(collection(db, 'users'), where('supervisorId', '==', user.id))
        : query(collection(db, 'users'), where('id', '==', user.id));

    const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as MockUser));
      setMockUsers(usersData);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));

    const unsubCurrentUser = onSnapshot(doc(db, 'users', user.id), (doc) => {
      if (doc.exists()) {
        setUser(doc.data() as User);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, `users/${user.id}`));

    // Scoped queries based on role
    const goalsQuery = user.role === 'admin' 
      ? collection(db, 'goals') 
      : user.role === 'supervisor'
        ? query(collection(db, 'goals'), where('supervisorId', '==', user.id))
        : query(collection(db, 'goals'), where('userId', '==', user.id));

    const attendanceQuery = user.role === 'admin'
      ? collection(db, 'attendance')
      : user.role === 'supervisor'
        ? query(collection(db, 'attendance'), or(where('supervisorId', '==', user.id), where('userId', '==', user.id)))
        : query(collection(db, 'attendance'), where('userId', '==', user.id));

    const evaluationsQuery = user.role === 'admin'
      ? collection(db, 'evaluations')
      : user.role === 'supervisor'
        ? query(collection(db, 'evaluations'), or(where('supervisorId', '==', user.id), where('internId', '==', user.id)))
        : query(collection(db, 'evaluations'), where('internId', '==', user.id));

    const reportsQuery = user.role === 'admin'
      ? collection(db, 'reports')
      : user.role === 'supervisor'
        ? query(collection(db, 'reports'), or(where('supervisorId', '==', user.id), where('userId', '==', user.id)))
        : query(collection(db, 'reports'), where('userId', '==', user.id));

    const unsubGoals = onSnapshot(goalsQuery, (snapshot) => {
      const goalsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Goal));
      setGoals(goalsData);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'goals'));

    const unsubAttendance = onSnapshot(attendanceQuery, (snapshot) => {
      const attendanceData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Attendance));
      setAttendance(attendanceData);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'attendance'));

    const unsubEvaluations = onSnapshot(evaluationsQuery, (snapshot) => {
      const evaluationsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Evaluation));
      setEvaluations(evaluationsData);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'evaluations'));

    const unsubReports = onSnapshot(reportsQuery, (snapshot) => {
      const reportsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Report));
      setReports(reportsData);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'reports'));

    const unsubSchedule = onSnapshot(doc(db, 'settings', 'schedule'), (snapshot) => {
      if (snapshot.exists()) {
        setSchedule({ ...snapshot.data(), id: snapshot.id } as Schedule);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'settings/schedule'));

    const unsubNotifications = onSnapshot(query(collection(db, 'notifications'), where('userId', '==', user.id)), (snapshot) => {
      const notificationsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Notification));
      setNotifications(notificationsData);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'notifications'));

    return () => {
      unsubUsers();
      unsubCurrentUser();
      unsubGoals();
      unsubAttendance();
      unsubEvaluations();
      unsubReports();
      unsubSchedule();
      unsubNotifications();
    };
  }, [isAuthReady, user?.id, user?.role]);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
    setIsLoading(false);
  };

  if (!isAuthReady) return null;

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
            <Login mockUsers={mockUsers} />
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
              goals={goals}
              attendance={attendance}
              evaluations={evaluations}
              schedule={schedule}
              notifications={notifications}
              reports={reports}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Role } from '../types';
import { cn } from '../lib/utils';
import { LogIn, Shield, UserCircle, Briefcase, ArrowLeft } from 'lucide-react';
import { MockUser } from '../mockData';
import { auth, db } from '../../firebase';
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { KeyRound, Hash } from 'lucide-react';

interface LoginProps {
  mockUsers: MockUser[];
}

const roles: { id: Role; label: string; icon: React.ReactNode; description: string }[] = [
  {
    id: 'supervisor',
    label: 'Supervisor',
    icon: <Shield className="w-5 h-5" />,
    description: 'Oversee operations and personnel with your system ID.'
  },
  {
    id: 'admin',
    label: 'Admin',
    icon: <UserCircle className="w-5 h-5" />,
    description: 'Manage system settings and users via Google authentication.'
  },
  {
    id: 'intern',
    label: 'Intern',
    icon: <Briefcase className="w-5 h-5" />,
    description: 'Access your learning portal using your assigned Code ID.'
  }
];

export default function Login({ mockUsers }: LoginProps) {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codeId, setCodeId] = useState('');
  const [password, setPassword] = useState('');

  const handleGoogleLogin = async () => {
    if (selectedRole !== 'admin') {
      setError('Please use Code ID login for this role');
      return;
    }

    setIsLoading(true);
    setError(null);
    const provider = new GoogleAuthProvider();
    
    try {
      await signInWithPopup(auth, provider);
      // App.tsx will handle the user profile creation/loading
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || 'Failed to sign in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole || selectedRole === 'admin') return;
    if (!codeId || !password) {
      setError('Please enter both Code ID and Password');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Behind the scenes, we use email/password auth
      // The email is codeId@som.portal
      const email = `${codeId.trim()}@som.portal`;
      await signInWithEmailAndPassword(auth, email, password);
      
      // Verification of role happens automatically because the app will load the user profile
      // and if the role doesn't match, we could sign them out, but usually the admin
      // creates the user with the correct role.
    } catch (err: any) {
      console.error("Code login error:", err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Invalid Code ID or Password');
      } else {
        setError(err.message || 'Failed to sign in');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-som-bg">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1 }}
            className="inline-block mb-6"
          >
            <div className="w-16 h-16 border border-som-ink/20 rounded-full flex items-center justify-center mx-auto bg-white/50 backdrop-blur-sm">
              <span className="serif text-2xl font-light italic">S</span>
            </div>
          </motion.div>
          <h1 className="text-4xl font-light tracking-tight mb-2 serif">
            Portal Access
          </h1>
          <p className="text-som-ink/60 font-light text-sm uppercase tracking-widest">
            {selectedRole ? `Accessing as ${selectedRole}` : 'Select your role to continue'}
          </p>
        </div>

        <div className="space-y-8">
          <div className="grid grid-cols-1 gap-4">
            {roles.map((role) => (
              <motion.button
                key={role.id}
                type="button"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => {
                  setSelectedRole(role.id);
                  setError(null);
                }}
                className={cn(
                  "relative flex items-center p-4 rounded-2xl border transition-all duration-300 text-left group bg-white/40",
                  selectedRole === role.id 
                    ? "border-som-olive bg-white/80 shadow-sm" 
                    : "border-som-ink/10 hover:border-som-olive/30 hover:bg-white/60"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center mr-4 transition-colors",
                  selectedRole === role.id ? "bg-som-olive text-white" : "bg-som-bg"
                )}>
                  {role.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-sm">{role.label}</h3>
                  <p className="text-xs font-light leading-relaxed text-som-ink/50">
                    {role.description}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {selectedRole === 'admin' ? (
              <motion.div
                key="admin-login"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <motion.button
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "w-full py-4 rounded-full font-medium text-sm tracking-widest uppercase transition-all duration-500 flex items-center justify-center space-x-3 bg-som-ink text-white hover:bg-som-olive shadow-xl shadow-som-ink/10",
                    isLoading && "opacity-70 cursor-not-allowed"
                  )}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Sign in with Google</span>
                    </>
                  )}
                </motion.button>
              </motion.div>
            ) : selectedRole ? (
              <motion.form
                key="code-login"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleCodeLogin}
                className="space-y-4"
              >
                <div className="space-y-3">
                  <div className="relative">
                    <Hash className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-som-ink/30" />
                    <input 
                      type="text"
                      placeholder="Code ID (e.g. SOM-1234)"
                      value={codeId}
                      onChange={(e) => setCodeId(e.target.value)}
                      className="w-full bg-white border border-som-ink/5 rounded-full py-4 pl-12 pr-6 text-sm focus:ring-1 focus:ring-som-olive transition-all placeholder:text-som-ink/20"
                      required
                    />
                  </div>
                  <div className="relative">
                    <KeyRound className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-som-ink/30" />
                    <input 
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white border border-som-ink/5 rounded-full py-4 pl-12 pr-6 text-sm focus:ring-1 focus:ring-som-olive transition-all placeholder:text-som-ink/20"
                      required
                    />
                  </div>
                </div>

                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "w-full py-4 rounded-full font-medium text-sm tracking-widest uppercase transition-all duration-500 flex items-center justify-center space-x-3 bg-som-ink text-white hover:bg-som-olive shadow-xl shadow-som-ink/10",
                    isLoading && "opacity-70 cursor-not-allowed"
                  )}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Access Portal</span>
                    </>
                  )}
                </motion.button>
              </motion.form>
            ) : null}
          </AnimatePresence>

          {error && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-500 text-xs text-center font-light"
            >
              {error}
            </motion.p>
          )}
        </div>

        <div className="mt-12 text-center">
          <p className="text-xs text-som-ink/40 font-light tracking-wide">
            &copy; 2026 SOM PORTAL. ALL RIGHTS RESERVED.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

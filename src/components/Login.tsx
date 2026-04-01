import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Role, User } from '../types';
import { cn } from '../lib/utils';
import { LogIn, Shield, UserCircle, Briefcase, ArrowLeft, Check } from 'lucide-react';
import { INITIAL_MOCK_USERS, MockUser } from '../mockData';

interface LoginProps {
  onLogin: (user: User) => void;
  mockUsers: MockUser[];
}

const roles: { id: Role; label: string; icon: React.ReactNode; description: string }[] = [
  {
    id: 'supervisor',
    label: 'Supervisor',
    icon: <Shield className="w-5 h-5" />,
    description: 'Full access to oversee all operations and personnel.'
  },
  {
    id: 'admin',
    label: 'Admin',
    icon: <UserCircle className="w-5 h-5" />,
    description: 'Manage system settings, users, and daily administrative tasks.'
  },
  {
    id: 'intern',
    label: 'Intern',
    icon: <Briefcase className="w-5 h-5" />,
    description: 'Limited access for learning and assisting in basic tasks.'
  }
];

export default function Login({ onLogin, mockUsers }: LoginProps) {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showAccountSelection, setShowAccountSelection] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const filteredUsers = mockUsers.filter(u => u.role === selectedRole);

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setShowAccountSelection(true);
  };

  const handleAccountSelect = (user: User) => {
    onLogin(user);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;

    // Simulate login with manual credentials
    const user: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1) + ' User',
      email: email || `${selectedRole}@example.com`,
      role: selectedRole
    };
    onLogin(user);
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
            {showAccountSelection ? 'Select Account' : 'Welcome Back'}
          </h1>
          <p className="text-som-ink/60 font-light text-sm uppercase tracking-widest">
            {showAccountSelection ? `Available ${selectedRole}s` : 'Select your role to continue'}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {!showAccountSelection ? (
            <motion.div
              key="role-selection"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 gap-4">
                {roles.map((role) => (
                  <motion.button
                    key={role.id}
                    type="button"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleRoleSelect(role.id)}
                    className={cn(
                      "relative flex items-center p-4 rounded-2xl border transition-all duration-300 text-left group bg-white/40 border-som-ink/10 hover:border-som-olive/30 hover:bg-white/60"
                    )}
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center mr-4 bg-som-bg transition-colors">
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

              <form onSubmit={handleLogin} className="space-y-8">
                <div className="space-y-4">
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white/40 border-b border-som-ink/10 py-3 px-1 focus:outline-none focus:border-som-olive transition-colors font-light text-sm"
                    />
                  </div>
                  <div className="relative">
                    <input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white/40 border-b border-som-ink/10 py-3 px-1 focus:outline-none focus:border-som-olive transition-colors font-light text-sm"
                    />
                  </div>
                </div>

                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={!selectedRole && !email}
                  className={cn(
                    "w-full py-4 rounded-full font-medium text-sm tracking-widest uppercase transition-all duration-500 flex items-center justify-center space-x-2",
                    (selectedRole || email) 
                      ? "bg-som-ink text-white hover:bg-som-olive" 
                      : "bg-som-ink/10 text-som-ink/30 cursor-not-allowed"
                  )}
                >
                  <span>Enter Portal</span>
                  <LogIn className="w-4 h-4" />
                </motion.button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="account-selection"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <button 
                onClick={() => setShowAccountSelection(false)}
                className="flex items-center space-x-2 text-[10px] uppercase tracking-widest font-bold text-som-ink/40 hover:text-som-ink transition-colors mb-4"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Back to Roles</span>
              </button>

              <div className="grid grid-cols-1 gap-3">
                {filteredUsers.map((u) => (
                  <motion.button
                    key={u.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAccountSelect(u)}
                    className="flex items-center p-4 rounded-2xl border border-som-ink/5 bg-white/60 hover:border-som-olive/30 transition-all text-left group"
                  >
                    <div className="w-10 h-10 rounded-full bg-som-bg flex items-center justify-center mr-4 serif italic text-lg text-som-ink/40 group-hover:bg-som-olive group-hover:text-white transition-colors">
                      {u.name[0]}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium">{u.name}</h4>
                      <p className="text-[10px] text-som-ink/40">{u.email}</p>
                    </div>
                    <div className="p-2 rounded-full bg-som-bg group-hover:bg-som-olive/10 text-transparent group-hover:text-som-olive transition-all">
                      <Check className="w-3 h-3" />
                    </div>
                  </motion.button>
                ))}
              </div>

              <div className="pt-4 text-center">
                <p className="text-[10px] text-som-ink/30 italic">
                  Select an account above to enter the {selectedRole} dashboard.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-12 text-center">
          <p className="text-xs text-som-ink/40 font-light tracking-wide">
            &copy; 2026 SOM PORTAL. ALL RIGHTS RESERVED.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

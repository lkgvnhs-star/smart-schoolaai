'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Building2, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '@/src/supabaseClient';

export default function LoginForm({ onLoginSuccess }: { onLoginSuccess: (data: any) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // 1. Try to sign in
      let { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // 2. If it fails due to invalid credentials, try to sign up automatically (First time setup)
      if (authError && authError.message.includes('Invalid login credentials')) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        
        if (signUpError) {
          if (signUpError.message.includes('User already registered') || signUpError.message.includes('already exists')) {
            setError('Invalid login credentials. Please check your password.');
          } else {
            setError(signUpError.message);
          }
          setIsLoading(false);
          return;
        }

        
        data = signUpData as any;
        authError = null;
        
        // Wait a small moment for the database trigger to create the profile
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if (authError) {
        setError(authError.message);
      } else if (data.user) {
        // Find out the role based on profile or fallback to email check
        const { data: profile } = await supabase.from('profiles').select('role, school_id').eq('id', data.user.id).single();
        
        const role = profile?.role || (email === 'superadmin@gmail.com' ? 'super_admin' : 'school_admin');
        const userSchoolId = profile?.school_id || data.user.user_metadata?.schoolId;

        // In a real app we'd be strict, but for setup/demo we allow login
        // If schoolId is missing, the dashboard will handle it.

        await fetch('/api/auth/set-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: data.user.id, role, schoolId: userSchoolId })
        });

        onLoginSuccess({ 
          userId: data.user.id, 
          role: role,
          schoolId: userSchoolId 
        });
      }
    } catch (err) {
      setError('An unexpected error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white border border-gray-100 rounded-[32px] p-8 md:p-12 shadow-2xl shadow-indigo-50"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-4 bg-indigo-50 text-indigo-600 rounded-3xl mb-6">
            <Building2 className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-display font-bold text-gray-900 tracking-tight">EduPrep AI</h1>
          <p className="text-gray-500 mt-2">School & Assessment Management</p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-gray-900"
                placeholder="admin@school.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-gray-900"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-xl shadow-gray-200"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Sign In
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-gray-50 text-center">
          <p className="text-xs text-gray-400 font-mono uppercase tracking-widest">
            Fixed Credentials Enabled
          </p>
        </div>
      </motion.div>
    </div>
  );
}

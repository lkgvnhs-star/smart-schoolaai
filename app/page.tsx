'use client';

import { useState, useEffect } from 'react';
import LoginForm from '@/components/LoginForm';
import SuperAdminDashboard from '@/components/SuperAdminDashboard';
import SchoolAdminDashboard from '@/components/SchoolAdminDashboard';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/src/supabaseClient';

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      const email = data.session.user.email;
      const role = email === 'superadmin@gmail.com' ? 'super_admin' : 'school_admin';
      const userSchoolId = data.session.user.user_metadata?.schoolId || 'demo-school-id';
      
      await fetch('/api/auth/set-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: data.session.user.id, role, schoolId: userSchoolId })
      });

      setSession({
        userId: data.session.user.id,
        role: role,
        schoolId: userSchoolId
      });
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!session) {
    return <LoginForm onLoginSuccess={(data) => setSession(data)} />;
  }

  if (session.role === 'super_admin') {
    return <SuperAdminDashboard />;
  }

  if (session.role === 'school_admin') {
    return <SchoolAdminDashboard schoolId={session.schoolId} />;
  }

  return <LoginForm onLoginSuccess={(data) => setSession(data)} />;
}

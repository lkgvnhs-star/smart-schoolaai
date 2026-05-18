'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  School, 
  Plus, 
  Settings, 
  Trash2, 
  Power, 
  PowerOff, 
  Edit2, 
  UserPlus, 
  Search,
  Building2,
  MapPin,
  CreditCard,
  LogOut
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/src/supabaseClient';

export default function SuperAdminDashboard() {
  const [schools, setSchools] = useState<any[]>([]);
  const [isAddingSchool, setIsAddingSchool] = useState(false);
  const [isAddingAdmin, setIsAddingAdmin] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', city: '', plan: 'Basic' });
  const [adminData, setAdminData] = useState({ email: '', password: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSchools = async () => {
    try {
      const res = await fetch('/api/admin/schools');
      if (res.ok) {
        const data = await res.json();
        setSchools(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("Failed to fetch schools:", e);
      setSchools([]);
    }
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  const handleAddSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMsg('');
    setIsSubmitting(true);
    const res = await fetch('/api/admin/schools', {
      method: 'POST',
      body: JSON.stringify(formData)
    });

    setIsSubmitting(false);

    if (res.ok) {
      setIsAddingSchool(false);
      setFormData({ name: '', city: '', plan: 'Basic' });
      fetchSchools();
    } else {
      try {
        const d = await res.json();
        setErrorMsg(d.error || 'Failed to add school');
      } catch (e) {
        setErrorMsg('Failed to add school (Unexpected response)');
      }
    }
  };

  const handleUpdateStatus = async (id: string, currentStatus: string) => {
    await fetch('/api/admin/schools', {
      method: 'PUT',
      body: JSON.stringify({ id, status: currentStatus === 'active' ? 'inactive' : 'active' })
    });
    fetchSchools();
  };

  const handleDeleteSchool = async (id: string) => {
    if (confirm('Are you sure you want to delete this school?')) {
      await fetch('/api/admin/schools', {
        method: 'DELETE',
        body: JSON.stringify({ id })
      });
      fetchSchools();
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    // For admin creation, you must use edge functions or the admin API because 
    // supabase.auth.signUp logs the current user out or requires email verification.
    // As a fallback for this demo, we'll hit the auth signup but then we shouldn't unless we handle it properly.
    // Instead we'll hit the /api/admin/school-admins endpoint since we can't do it purely client-side
    // cleanly without an admin key.
    const res = await fetch('/api/admin/school-admins', {
      method: 'POST',
      body: JSON.stringify({ ...adminData, schoolId: isAddingAdmin })
    });
    if (res.ok) {
      setIsAddingAdmin(null);
      setAdminData({ email: '', password: '' });
      alert('Admin credentials created successfully');
    } else {
      try {
        const data = await res.json();
        setErrorMsg(data.error || 'Failed to create admin');
      } catch (e) {
        setErrorMsg('Failed to create admin (Unexpected response)');
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.reload();
  };

  const filteredSchools = schools.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xl">
            <Building2 className="w-8 h-8" />
            <span className="font-display">EduPrep AI</span>
          </div>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-semibold">Super Admin</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <button className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg">
            <School className="w-4 h-4" />
            Manage Schools
          </button>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <header className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-gray-900 tracking-tight">School Management</h1>
            <p className="text-gray-500 mt-1">Add and manage authorized partner schools.</p>
          </div>
          
          <button 
            onClick={() => setIsAddingSchool(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-full font-medium hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
          >
            <Plus className="w-5 h-5" />
            Add New School
          </button>
        </header>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text"
            placeholder="Search by school name or city..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm"
          />
        </div>

        {/* Schools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredSchools.map((school) => (
              <motion.div 
                key={school.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-2xl ${school.status === 'active' ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-400'}`}>
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleUpdateStatus(school.id, school.status)}
                      className={`p-2 rounded-lg ${school.status === 'active' ? 'hover:bg-red-50 text-gray-400 hover:text-red-600' : 'hover:bg-green-50 text-gray-400 hover:text-green-600'}`}
                      title={school.status === 'active' ? 'Deactivate' : 'Activate'}
                    >
                      {school.status === 'active' ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                    </button>
                    <button 
                      onClick={() => handleDeleteSchool(school.id)}
                      className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-1">{school.name}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {school.city}
                  </span>
                  <span className="flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5" />
                    {school.plan} Plan
                  </span>
                </div>

                <div className="flex gap-2 pt-4 border-t border-gray-50">
                  <button 
                    onClick={() => setIsAddingAdmin(school.id)}
                    className="flex-1 flex items-center justify-center gap-2 bg-gray-50 text-gray-700 py-2.5 rounded-xl font-medium text-sm hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-transparent hover:border-indigo-100"
                  >
                    <UserPlus className="w-4 h-4" />
                    Add School Admin
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {filteredSchools.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-100">
            <School className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-medium">No schools found</p>
          </div>
        )}
      </main>

      {/* Add School Modal */}
      {isAddingSchool && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
          >
            <h2 className="text-2xl font-bold mb-6 font-display">Authorise New School</h2>
            <form onSubmit={handleAddSchool} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">School Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="e.g. Oakridge International"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">City</label>
                <input 
                  required
                  type="text" 
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="e.g. Hyderabad"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Basic Plan</label>
                <select 
                  value={formData.plan}
                  onChange={(e) => setFormData({...formData, plan: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                >
                  <option>Basic</option>
                  <option>Growth</option>
                  <option>Enterprise</option>
                </select>
              </div>
              {errorMsg && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg leading-tight">{errorMsg}</p>}
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsAddingSchool(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Adding...' : 'Add School'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Add Admin Modal */}
      {isAddingAdmin && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <UserPlus className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold font-display">Create Admin Credentials</h2>
            </div>
            <form onSubmit={handleAddAdmin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Admin Email</label>
                <input 
                  required
                  type="email" 
                  value={adminData.email}
                  onChange={(e) => setAdminData({...adminData, email: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="admin@school.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Temp Password</label>
                <input 
                  required
                  type="password" 
                  value={adminData.password}
                  onChange={(e) => setAdminData({...adminData, password: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
              {errorMsg && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg leading-tight">{errorMsg}</p>}
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsAddingAdmin(null)}
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                >
                  Create Account
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

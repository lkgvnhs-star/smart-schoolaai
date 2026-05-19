'use client';

import { useState, useEffect, useRef, forwardRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  UserSquare2, 
  Library, 
  FileText, 
  Sparkles, 
  BarChart3, 
  LogOut,
  Plus,
  Search,
  Upload,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  FileDown,
  Printer,
  ChevronRight,
  School as SchoolIcon,
  X,
  Loader2,
  Trash2,
  Save,
  Layout,
  Copy
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useReactToPrint } from 'react-to-print';
import { supabase } from '@/src/supabaseClient';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  Cell
} from 'recharts';

interface Section {
  id: string;
  title: string;
  count: number;
  marks: number;
}

export default function SchoolAdminDashboard({ schoolId }: { schoolId?: string }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [teachers, setTeachers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [syllabusList, setSyllabusList] = useState<any[]>([]);
  const [papers, setPapers] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [preloadedTemplate, setPreloadedTemplate] = useState<any>(null);
  const [viewingPaper, setViewingPaper] = useState<any>(null);
  const [autoPrintMode, setAutoPrintMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const fetchData = useCallback(async () => {
    if (!schoolId) return;
    try {
      setIsLoading(true);
      const urls = [
        '/api/school/teachers',
        '/api/school/students',
        '/api/school/syllabus',
        '/api/school/assessments-list',
        '/api/school/templates',
      ];
      const fetchResults = await Promise.all(urls.map(url => fetch(url)));
      const [t, s, syl, p, tmpl] = await Promise.all(fetchResults.map(async (r) => {
        if (!r.ok) return [];
        try {
          return await r.json();
        } catch (e) {
          console.error("JSON parse error:", e);
          return [];
        }
      }));
      
      setTeachers(Array.isArray(t) ? t : []);
      setStudents(Array.isArray(s) ? s : []);
      setSyllabusList(Array.isArray(syl) ? syl : []);
      setPapers(Array.isArray(p) ? p : []);
      setTemplates(Array.isArray(tmpl) ? tmpl : []);
    } catch (error) {
      console.error("Fetch Data Error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.reload();
  };

  if (!schoolId) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8 text-center">
        <div className="max-w-md bg-white p-12 rounded-[40px] shadow-xl border border-gray-100">
          <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-display font-bold mb-4">Account Pending</h1>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Your account is active but hasn&apos;t been assigned to a school yet. 
            Please log in as <strong>superadmin@gmail.com</strong> to create and link schools.
          </p>
          <button onClick={handleLogout} className="w-full button-primary py-4 text-white">
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full z-10">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xl">
            <SchoolIcon className="w-8 h-8" />
            <span className="font-display">EduPrep AI</span>
          </div>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-semibold text-ellipsis overflow-hidden whitespace-nowrap">Dashboard</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <NavItem icon={BookOpen} label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
          <NavItem icon={Users} label="Teachers" active={activeTab === 'teachers'} onClick={() => setActiveTab('teachers')} />
          <NavItem icon={UserSquare2} label="Students" active={activeTab === 'students'} onClick={() => setActiveTab('students')} />
          <NavItem icon={Library} label="Syllabus Library" active={activeTab === 'library'} onClick={() => setActiveTab('library')} />
          <NavItem icon={Sparkles} label="AI Paper Generator" active={activeTab === 'generator'} onClick={() => setActiveTab('generator')} />
          <NavItem icon={FileText} label="Assessments" active={activeTab === 'assessments'} onClick={() => setActiveTab('assessments')} />
          <NavItem icon={BarChart3} label="Performance" active={activeTab === 'performance'} onClick={() => setActiveTab('performance')} />
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        <AnimatePresence mode="wait">
          {viewingPaper ? (
            <PaperPreview 
              paper={viewingPaper} 
              onBack={() => { setViewingPaper(null); setAutoPrintMode(false); }} 
              autoPrint={autoPrintMode}
              onPrintComplete={() => setAutoPrintMode(false)}
            />
          ) : (
            <>
              {activeTab === 'overview' && <OverviewView teachers={teachers} students={students} syllabus={syllabusList} papers={papers} onNavigate={setActiveTab} />}
              {activeTab === 'teachers' && <TeachersView teachers={teachers} onUpdate={fetchData} />}
              {activeTab === 'students' && <StudentsView students={students} onUpdate={fetchData} />}
              {activeTab === 'library' && <LibraryView syllabus={syllabusList} onUpdate={fetchData} />}
              {activeTab === 'generator' && <GeneratorView syllabus={syllabusList} templates={templates} onUpdateTemplates={fetchData} initialTemplate={preloadedTemplate} onClearTemplate={() => setPreloadedTemplate(null)} />}
              {activeTab === 'templates' && <TemplatesView templates={templates} onUpdate={fetchData} onUse={(t: any) => { setPreloadedTemplate(t); setActiveTab('generator'); }} />}
              {activeTab === 'assessments' && <AssessmentsView onAction={(p: any, mode: 'preview' | 'print') => { setViewingPaper(p); setAutoPrintMode(mode === 'print'); }} />}
              {activeTab === 'performance' && <PerformanceView students={students} />}
            </>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function NavItem({ icon: Icon, label, active, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${
        active 
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
          : 'text-gray-600 hover:bg-gray-50'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

// --- Sub-Views ---

function OverviewView({ teachers, students, syllabus, papers, onNavigate }: any) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-display font-bold">Good Morning, Admin</h1>
          <p className="text-gray-400">Here&apos;s what&apos;s happening at your school today.</p>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-indigo-600">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={item}>
          <StatCard icon={Users} label="Teachers" value={teachers.length} color="text-blue-600" bgColor="bg-blue-50" />
        </motion.div>
        <motion.div variants={item}>
          <StatCard icon={UserSquare2} label="Students" value={students.length} color="text-indigo-600" bgColor="bg-indigo-50" />
        </motion.div>
        <motion.div variants={item}>
          <StatCard icon={Library} label="Resources" value={syllabus.length} color="text-purple-600" bgColor="bg-purple-50" />
        </motion.div>
        <motion.div variants={item}>
          <StatCard icon={FileText} label="Papers" value={papers.length} color="text-emerald-600" bgColor="bg-emerald-50" />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div variants={item} className="lg:col-span-2 bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <ActionButton 
              icon={Plus} 
              label="Add Teacher" 
              desc="Staff credentials" 
              onClick={() => onNavigate('teachers')} 
              color="text-blue-600"
              bgColor="hover:bg-blue-50"
            />
            <ActionButton 
              icon={Plus} 
              label="Add Student" 
              desc="Enrol new pupil" 
              onClick={() => onNavigate('students')} 
              color="text-indigo-600"
              bgColor="hover:bg-indigo-50"
            />
            <ActionButton 
              icon={Upload} 
              label="Upload Syllabus" 
              desc="AI ingestion" 
              onClick={() => onNavigate('library')} 
              color="text-purple-600"
              bgColor="hover:bg-purple-50"
            />
            <ActionButton 
              icon={Sparkles} 
              label="Generate Paper" 
              desc="Design assessment" 
              onClick={() => onNavigate('generator')} 
              color="text-emerald-600"
              bgColor="hover:bg-emerald-50"
            />
            <ActionButton 
              icon={Search} 
              label="Check Performance" 
              desc="Student analytics" 
              onClick={() => onNavigate('performance')} 
              color="text-orange-600"
              bgColor="hover:bg-orange-50"
            />
          </div>
        </motion.div>

        <motion.div variants={item} className="bg-indigo-900 text-white p-8 rounded-[32px] shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-xl font-bold mb-6">Syllabus Health</h2>
            <div className="space-y-6">
              <ProgressItem label="Content Coverage" value={65} />
              <ProgressItem label="AI Ingestion" value={88} />
              <ProgressItem label="Paper Ready" value={42} />
            </div>
            <button 
              onClick={() => onNavigate('library')}
              className="mt-8 w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
            >
              View Library <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <Sparkles className="absolute -bottom-8 -right-8 w-32 h-32 text-white/5 rotate-12" />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div variants={item} className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold mb-4">Recent Syllabus</h2>
          <div className="space-y-4">
            {syllabus.slice(0, 3).map((s: any) => (
              <div key={s.id} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-2xl transition-colors group cursor-pointer" onClick={() => onNavigate('library')}>
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                  <Library className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-sm">{s.title}</div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-widest">{new Date(s.createdAt || s.created_at).toLocaleDateString()}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-200 group-hover:text-indigo-400" />
              </div>
            ))}
            {syllabus.length === 0 && <p className="text-sm text-gray-400 italic">No syllabus uploaded yet.</p>}
          </div>
        </motion.div>

        <motion.div variants={item} className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold mb-4">Paper Statistics</h2>
          <div className="flex items-center justify-between py-4 border-b border-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-sm text-gray-600">Active Assessments</span>
            </div>
            <span className="font-bold">{papers.length}</span>
          </div>
          <div className="flex items-center justify-between py-4 border-b border-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-sm text-gray-600">Total Teachers</span>
            </div>
            <span className="font-bold">{teachers.length}</span>
          </div>
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-indigo-500" />
              <span className="text-sm text-gray-600">Total Students</span>
            </div>
            <span className="font-bold">{students.length}</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function ProgressItem({ label, value }: { label: string, value: number }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs font-bold uppercase tracking-widest opacity-60">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }} 
          animate={{ width: `${value}%` }} 
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.4)]"
        />
      </div>
    </div>
  );
}

function ActionButton({ icon: Icon, label, desc, onClick, color, bgColor }: any) {
  return (
    <button 
      onClick={onClick}
      className={`p-4 bg-gray-50 rounded-2xl ${bgColor} transition-all text-left flex flex-col items-start gap-2 group`}
    >
      <div className={`p-2 rounded-xl bg-white shadow-sm transition-transform group-hover:scale-110 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="font-bold text-sm">{label}</div>
        <div className="text-[10px] text-gray-400 group-hover:text-gray-500 transition-colors uppercase tracking-wider font-semibold">{desc}</div>
      </div>
    </button>
  );
}

function StatCard({ icon: Icon, label, value, color, bgColor }: any) {
  return (
    <div className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow cursor-default">
      <div className={`p-3 rounded-xl ${bgColor} ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest leading-none mb-1">{label}</p>
        <p className="text-2xl font-display font-bold text-gray-900 leading-none">{value}</p>
      </div>
    </div>
  );
}

function TeachersView({ teachers, onUpdate }: any) {
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [formData, setFormData] = useState({ name: '', classes: [] as string[], subjects: [] as string[] });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);
    const res = await fetch('/api/school/teachers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    setIsSubmitting(false);
    if (res.ok) {
      setIsAdding(false);
      setFormData({ name: '', classes: [], subjects: [] });
      onUpdate();
    } else {
      const data = await res.json();
      setErrorMsg(data.error || 'Failed to add teacher');
    }
  };

  const CLASSES = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
  const SUBJECTS = ['Telugu', 'Hindi', 'English', 'Maths', 'Science', 'Physics', 'Biology', 'Social'];

  const handleDeleteTeacher = async (id: string) => {
    if (!confirm('Are you sure you want to remove this teacher?')) return;
    try {
      const res = await fetch(`/api/school/teachers?id=${id}`, { method: 'DELETE' });
      if (res.ok) onUpdate();
      else alert('Failed to delete teacher');
    } catch (e) { alert('Request failed'); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-display font-bold">Faculty Management</h1>
        <button onClick={() => setIsAdding(true)} className="bg-indigo-600 text-white px-5 py-2.5 rounded-full font-medium flex items-center gap-2">
          <Plus className="w-5 h-5" /> Add Teacher
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teachers.map((t: any) => (
          <div key={t.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative group">
            <button 
              onClick={() => handleDeleteTeacher(t.id)}
              className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <h3 className="text-xl font-bold mb-2">{t.name}</h3>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1">
                {t.classes?.map((c: string) => <span key={c} className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md font-bold">{c}</span>)}
              </div>
              <div className="flex flex-wrap gap-1">
                {t.subjects?.map((s: string) => <span key={s} className="text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md font-bold uppercase">{s}</span>)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {isAdding && (
        <Modal title="Add New Teacher" onClose={() => setIsAdding(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input required className="input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <label className="label">Assigned Classes</label>
              <div className="grid grid-cols-5 gap-2">
                {CLASSES.map(c => (
                  <button 
                    key={c} type="button"
                    onClick={() => {
                      const newClasses = formData.classes.includes(c) ? formData.classes.filter(i => i !== c) : [...formData.classes, c];
                      setFormData({...formData, classes: newClasses});
                    }}
                    className={`text-xs p-1 rounded border ${formData.classes.includes(c) ? 'bg-indigo-600 text-white' : 'bg-gray-50'}`}
                  >{c}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Subjects Expertise</label>
              <div className="grid grid-cols-3 gap-2">
                {SUBJECTS.map(s => (
                  <button 
                    key={s} type="button"
                    onClick={() => {
                      const newSubjects = formData.subjects.includes(s) ? formData.subjects.filter(i => i !== s) : [...formData.subjects, s];
                      setFormData({...formData, subjects: newSubjects});
                    }}
                    className={`text-xs p-1 rounded border ${formData.subjects.includes(s) ? 'bg-indigo-600 text-white' : 'bg-gray-50'}`}
                  >{s}</button>
                ))}
              </div>
            </div>
            {errorMsg && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg leading-tight">{errorMsg}</p>}
            <button disabled={isSubmitting} className="button-primary w-full py-3 mt-4 disabled:opacity-50 text-white">
              {isSubmitting ? 'Saving...' : 'Save Teacher'}
            </button>
          </form>
        </Modal>
      )}
    </motion.div>
  );
}

function StudentsView({ students, onUpdate }: any) {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ name: '', class: '1st' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/school/students', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData) 
    });
    setIsAdding(false);
    onUpdate();
  };

  const handleDeleteStudent = async (id: string) => {
    if (!confirm('Permanently remove this student? All results will be lost.')) return;
    try {
      const res = await fetch(`/api/school/students?id=${id}`, { method: 'DELETE' });
      if (res.ok) onUpdate();
      else alert('Failed to delete student');
    } catch (e) { alert('Request failed'); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-display font-bold">Student Database</h1>
        <button onClick={() => setIsAdding(true)} className="bg-indigo-600 text-white px-5 py-2.5 rounded-full font-medium flex items-center gap-2">
          <Plus className="w-5 h-5" /> Add Student
        </button>
      </div>

      <div className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-400 text-xs uppercase tracking-widest font-bold">
            <tr>
              <th className="px-8 py-4">Name</th>
              <th className="px-8 py-4">Class</th>
              <th className="px-8 py-4">ID</th>
              <th className="px-8 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {students.map((s: any) => (
              <tr key={s.id} className="hover:bg-gray-50 transition-colors group">
                <td className="px-8 py-5 font-bold text-gray-900">{s.name}</td>
                <td className="px-8 py-5 text-gray-600">{s.class}</td>
                <td className="px-8 py-5 text-xs font-mono text-gray-400">{String(s.id).slice(0, 8)}</td>
                <td className="px-8 py-5 text-right">
                  <button onClick={() => handleDeleteStudent(s.id)} className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isAdding && (
        <Modal title="Enrol Student" onClose={() => setIsAdding(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Student Name</label>
              <input required className="input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <label className="label">Current Class</label>
              <select className="input" value={formData.class} onChange={e => setFormData({...formData, class: e.target.value})}>
                {['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <button className="button-primary w-full py-3 mt-4 text-white">Save Student</button>
          </form>
        </Modal>
      )}
    </motion.div>
  );
}

function LibraryView({ syllabus, onUpdate }: any) {
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({ title: '', fileType: 'pdf' as 'pdf' | 'jpg' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFormData({...formData, fileType: file.type.includes('pdf') ? 'pdf' : 'jpg'});
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    setIsProcessing(true);

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) {
       alert("Not logged in");
       setIsProcessing(false);
       return;
    }

    const { v4: uuidv4 } = require('uuid');
    const ext = selectedFile.name.split('.').pop();
    const fileId = uuidv4();
    const filePath = `${userId}/syllabus/${fileId}/${fileId}.${ext}`;
    
    const { error: uploadError } = await supabase.storage.from('app-files').upload(filePath, selectedFile);
    if (uploadError) {
      alert('Failed to upload to storage: ' + uploadError.message);
      setIsProcessing(false);
      return;
    }

    const res = await fetch('/api/school/syllabus', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, filePath }) 
    });
    setIsProcessing(false);
    if (res.ok) {
      setIsUploading(false);
      onUpdate();
    } else {
      alert('Failed to upload syllabus');
    }
  };

  const handleView = async (filePath: string) => {
    if (!filePath) return;
    const { data, error } = await supabase.storage.from('app-files').createSignedUrl(filePath, 60 * 60);
    if (error || !data) {
      alert('Failed to get file URL');
    } else {
      window.open(data.signedUrl, '_blank');
    }
  };

  const handleDelete = async (id: string, filePath: string) => {
    if (!confirm('Are you sure you want to delete this syllabus?')) return;
    try {
      if (filePath) {
        const { error: storageError } = await supabase.storage.from('app-files').remove([filePath]);
        if (storageError) console.error("Storage delete error:", storageError);
      }
      const res = await fetch(`/api/school/syllabus?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Failed to delete from database');
      } else {
        onUpdate();
      }
    } catch (e: any) {
      console.error("Delete Error:", e);
      alert("Delete failed: " + e.message);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-display font-bold">Curriculum Library</h1>
        <button onClick={() => setIsUploading(true)} className="bg-indigo-600 text-white px-5 py-2.5 rounded-full font-medium flex items-center gap-2 italic">
          <Upload className="w-5 h-5" /> Upload Syllabus
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {syllabus.map((s: any) => (
          <div key={s.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm group hover:border-indigo-200 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gray-50 text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 rounded-lg transition-colors">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900">{s.title}</h3>
            </div>
            <p className="text-xs text-gray-400 line-clamp-3 mb-4">{s.content}</p>
            <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest text-gray-300 group-hover:text-indigo-300 mb-3">
              <span>{s.fileType || s.file_type} format</span>
              <span>{new Date(s.createdAt || s.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleView(s.fileData || s.file_data)} className="flex-1 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors">View File</button>
              <button onClick={() => handleDelete(s.id, s.fileData || s.file_data)} className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {isUploading && (
        <Modal title="Upload Course Content" onClose={() => setIsUploading(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Content Title</label>
              <input required className="input" placeholder="e.g. 10th Grade Physics - Optics" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            </div>
            <div className="border-2 border-dashed border-gray-100 rounded-2xl p-8 text-center bg-gray-50 hover:bg-indigo-50 transition-colors group cursor-pointer relative">
              <input type="file" required accept="image/*,.pdf" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
              <Upload className="w-10 h-10 text-gray-300 mx-auto mb-2 group-hover:text-indigo-600 transition-colors" />
              <p className="text-sm font-medium text-gray-600">{selectedFile ? selectedFile.name : 'Click or Drag Syllabus (PDF/JPG)'}</p>
            </div>
            <button disabled={isProcessing} className="button-primary w-full py-4 mt-6 flex items-center justify-center gap-2 text-white">
              {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing with AI...</> : 'Ingest to Library'}
            </button>
          </form>
        </Modal>
      )}
    </motion.div>
  );
}

function PaperPreview({ paper, onBack, autoPrint, onPrintComplete }: { paper: any, onBack: () => void, autoPrint?: boolean, onPrintComplete?: () => void }) {
  const paperRef = useRef<HTMLDivElement>(null);
  
  const displayPaper = useMemo(() => ({
    schoolName: paper.schoolName || paper.school_name || 'School Name',
    examTitle: paper.examTitle || paper.exam_title || 'Examination',
    subject: paper.subject || 'Subject',
    maxMarks: paper.maxMarks || paper.max_marks || 0,
    duration: paper.duration || '',
    sections: paper.sections || []
  }), [paper]);

  const handlePrint = useReactToPrint({
    contentRef: paperRef,
    documentTitle: displayPaper.examTitle || 'Question_Paper',
    onAfterPrint: onPrintComplete,
  });

  const onPrintClick = useCallback(() => {
    if (typeof handlePrint === 'function') {
      handlePrint();
    } else {
      window.print();
    }
  }, [handlePrint]);

  useEffect(() => {
    if (autoPrint && typeof handlePrint === 'function') {
      const timer = setTimeout(() => {
        handlePrint();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [autoPrint, handlePrint]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex justify-between items-center sticky top-0 bg-gray-50 py-4 z-20 print:hidden">
        <h1 className="text-3xl font-display font-bold">Paper Preview</h1>
        <div className="flex gap-3">
          <button onClick={onBack} className="px-6 py-2 bg-white border border-gray-200 rounded-full font-bold hover:bg-gray-50 transition-colors">Back</button>
          <button 
            onClick={onPrintClick} 
            className="bg-indigo-600 text-white px-6 py-2 rounded-full font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
          >
            <Printer className="w-4 h-4" /> Print / Download
          </button>
        </div>
      </div>
      
      <div className="bg-white p-1 shadow-xl rounded-sm max-w-[210mm] mx-auto overflow-hidden print:shadow-none print:p-0">
        <PrintPaper ref={paperRef} paper={displayPaper} />
      </div>
      
      <div className="bg-indigo-900 text-white p-12 rounded-[40px] mt-12 overflow-x-hidden print:hidden">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Sparkles className="w-6 h-6" /> AI Answer Key
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {displayPaper.sections?.map((s: any) => (
            <div key={s.id}>
              <h3 className="font-bold border-b border-white/20 pb-2 mb-4 uppercase tracking-widest text-xs opacity-60">{s.title}</h3>
              <div className="space-y-4">
                {s.questions?.map((q: any, i: number) => (
                  <div key={i} className="text-sm">
                    <span className="font-bold mr-2 text-indigo-300">Q{i+1}.</span>
                    <span className="opacity-80">Ans: {q.answer}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function GeneratorView({ syllabus, templates, onUpdateTemplates, initialTemplate, onClearTemplate }: any) {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [config, setConfig] = useState({
    schoolName: '',
    examTitle: 'Unit Test 1',
    subject: 'English',
    maxMarks: 50,
    duration: '',
    difficulty: 'Medium',
    sections: [
      { id: '1', title: 'Multiple Choice', count: 5, marks: 1 },
      { id: '2', title: 'Fill in the blanks', count: 5, marks: 1 },
      { id: '3', title: 'Short Answers', count: 5, marks: 2 },
      { id: '4', title: 'Long Answers', count: 2, marks: 5 },
    ]
  });

  const applyTemplate = (template: any) => {
    setConfig({
      ...config,
      examTitle: template.name || config.examTitle,
      subject: template.subject || config.subject,
      sections: template.sections || config.sections
    });
    alert(`Applied template: ${template.name}`);
  };

  useEffect(() => {
    if (initialTemplate) {
      applyTemplate(initialTemplate);
      onClearTemplate();
    }
  }, [initialTemplate, applyTemplate, onClearTemplate]);

  const [selectedSyllabus, setSelectedSyllabus] = useState('');
  const [generatedPaper, setGeneratedPaper] = useState<any>(null);

  const handleSaveTemplate = async () => {
    const name = prompt("Enter a name for this assessment template:");
    if (!name) return;
    
    setIsSavingTemplate(true);
    try {
      const res = await fetch('/api/school/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          subject: config.subject,
          sections: config.sections,
          description: `Custom ${config.subject} template created by ${config.schoolName || 'user'}`
        })
      });
      if (res.ok) {
        alert("Template saved successfully! You can reuse this structure later.");
        onUpdateTemplates();
      } else {
        alert("Failed to save template");
      }
    } catch (e) {
      alert("Error saving template");
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const EXAM_TITLES = ['Lesson Test', 'Grand Test', 'Unit Test 1', 'Unit Test 2', 'Unit Test 3', 'Unit Test 4', 'Summative Assessment 1', 'Summative Assessment 2'];
  const SUBJECTS = ['Telugu', 'Hindi', 'English', 'Maths', 'Science', 'Physics', 'Biology', 'Social'];
  const MARKS = [20, 25, 40, 50, 80, 100];
  const DIFFICULTY = ['Easy', 'Medium', 'Hard', 'Mixed'];

  const handleGenerate = async () => {
    if (!selectedSyllabus) return alert('Select a syllabus first');
    setIsLoading(true);
    const res = await fetch('/api/school/generate-paper', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ syllabusId: selectedSyllabus, config })
    });
    if (res.ok) {
      const data = await res.json();
      setGeneratedPaper(data);
    } else {
      const data = await res.json();
      alert(data.error || 'Failed to generate paper');
    }
    setIsLoading(false);
  };

  if (generatedPaper) {
    return <PaperPreview paper={generatedPaper} onBack={() => setGeneratedPaper(null)} />;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <header className="mb-12">
        <h1 className="text-4xl font-display font-bold mb-2">Paper Generator</h1>
        <p className="text-gray-400">Design custom assessments in seconds using AI.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          {/* Step 1: Syllabus Selection */}
          <section className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm relative">
             <div className="w-12 h-12 bg-gray-900 text-white rounded-2xl flex items-center justify-center font-bold absolute -top-6 left-8 shadow-xl">1</div>
             <h2 className="text-xl font-bold mb-6 mt-2">Target Content</h2>
             <div className="grid grid-cols-1 gap-3">
               {syllabus.map((s: any) => (
                 <button 
                  key={s.id} 
                  onClick={() => setSelectedSyllabus(s.id)}
                  className={`p-4 rounded-2xl border text-left flex items-center justify-between group transition-all ${selectedSyllabus === s.id ? 'border-indigo-600 bg-indigo-50' : 'border-gray-100 bg-gray-50'}`}
                 >
                   <div>
                     <div className={`font-bold ${selectedSyllabus === s.id ? 'text-indigo-600' : 'text-gray-900'}`}>{s.title}</div>
                     <div className="text-xs text-gray-400">{String(s.content || "").slice(0, 100)}...</div>
                   </div>
                   <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${selectedSyllabus === s.id ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-200'}`}>
                     {selectedSyllabus === s.id && <CheckCircle2 className="w-4 h-4" />}
                   </div>
                 </button>
               ))}
               {syllabus.length === 0 && <div className="text-center py-8 text-gray-400 text-sm">No syllabus uploaded yet.</div>}
             </div>
          </section>

          {/* Step 2: Meta Config */}
          <section className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm relative">
             <div className="w-12 h-12 bg-gray-900 text-white rounded-2xl flex items-center justify-center font-bold absolute -top-6 left-8 shadow-xl">2</div>
             <h2 className="text-xl font-bold mb-6 mt-2">Exam Meta</h2>
             <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">School Name (Header)</label>
                  <input className="input" placeholder="Enter school name" value={config.schoolName} onChange={e => setConfig({...config, schoolName: e.target.value})} />
                </div>
                <div>
                  <label className="label">Exam Title</label>
                  <select className="input" value={config.examTitle} onChange={e => setConfig({...config, examTitle: e.target.value})}>
                    {EXAM_TITLES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Subject</label>
                  <select className="input" value={config.subject} onChange={e => setConfig({...config, subject: e.target.value})}>
                    {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Max Marks</label>
                  <select className="input" value={config.maxMarks} onChange={e => setConfig({...config, maxMarks: Number(e.target.value)})}>
                    {MARKS.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Duration</label>
                  <input className="input" placeholder="e.g. 1hr 30min" value={config.duration} onChange={e => setConfig({...config, duration: e.target.value})} />
                </div>
                <div>
                  <label className="label">Difficulty</label>
                  <select className="input" value={config.difficulty} onChange={e => setConfig({...config, difficulty: e.target.value})}>
                    {DIFFICULTY.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
             </div>
          </section>

          {/* Step 3: Sections */}
          <section className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm relative">
             <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-bold absolute -top-6 left-8 shadow-xl">3</div>
             <div className="flex justify-between items-center mb-6 mt-2">
                <div className="flex flex-col">
                  <h2 className="text-xl font-bold">Structure</h2>
                  <p className="text-[10px] text-gray-400">Define marks and question count</p>
                </div>
                <div className="flex gap-4">
                  {templates.length > 0 && (
                    <div className="relative group">
                       <button className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full uppercase tracking-widest">
                         <Layout className="w-3 h-3" /> Load Template
                       </button>
                       <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 p-2">
                          <div className="text-[9px] font-bold text-gray-400 mb-1 px-2">YOUR TEMPLATES</div>
                          {templates.slice(0, 5).map((t: any) => (
                            <button key={t.id} onClick={() => applyTemplate(t)} className="w-full text-left px-3 py-2 text-xs hover:bg-indigo-50 rounded-lg font-medium text-gray-700 truncate">
                              {t.name}
                            </button>
                          ))}
                          {templates.length > 5 && <div className="text-[8px] text-center text-gray-300 py-1">And {templates.length - 5} more...</div>}
                       </div>
                    </div>
                  )}
                  <button 
                    onClick={handleSaveTemplate}
                    disabled={isSavingTemplate}
                    className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest"
                  >
                    <Save className="w-3 h-3" /> Save Template
                  </button>
                  <button 
                    onClick={() => setConfig({...config, sections: [...config.sections, {id: Math.random().toString(), title: 'New Section', count: 1, marks: 1}]})}
                    className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest"
                  >
                    <Plus className="w-3 h-3" /> Add Section
                  </button>
                </div>
             </div>
             
             <div className="space-y-3">
               {config.sections.map((section, idx) => (
                 <div key={section.id} className="grid grid-cols-12 gap-3 items-end bg-gray-50 p-4 rounded-2xl">
                    <div className="col-span-5">
                      <label className="text-[10px] font-bold uppercase text-gray-400 mb-1 block">Title</label>
                      <input className="input-small" value={section.title} onChange={e => {
                        const newSections = [...config.sections];
                        newSections[idx].title = e.target.value;
                        setConfig({...config, sections: newSections});
                      }} />
                    </div>
                    <div className="col-span-3">
                      <label className="text-[10px] font-bold uppercase text-gray-400 mb-1 block">Count</label>
                      <input type="number" className="input-small" value={section.count} onChange={e => {
                        const newSections = [...config.sections];
                        newSections[idx].count = Number(e.target.value);
                        setConfig({...config, sections: newSections});
                      }} />
                    </div>
                    <div className="col-span-3">
                      <label className="text-[10px] font-bold uppercase text-gray-400 mb-1 block">Marks/Q</label>
                      <input type="number" className="input-small" value={section.marks} onChange={e => {
                        const newSections = [...config.sections];
                        newSections[idx].marks = Number(e.target.value);
                        setConfig({...config, sections: newSections});
                      }} />
                    </div>
                    <button className="col-span-1 p-2 text-gray-300 hover:text-red-500" onClick={() => {
                        const newSections = config.sections.filter((_, i) => i !== idx);
                        setConfig({...config, sections: newSections});
                    }}><X className="w-5 h-5"/></button>
                 </div>
               ))}
             </div>
          </section>
        </div>

        <div className="space-y-6">
           <div className="bg-gray-900 text-white p-8 rounded-[40px] sticky top-8 shadow-2xl">
              <h2 className="text-2xl font-bold mb-6">Build Paper</h2>
              <div className="space-y-4 mb-8">
                <SummaryItem label="Syllabus" value={selectedSyllabus ? syllabus.find((s:any) => s.id === selectedSyllabus)?.title : 'Not chosen'} active={!!selectedSyllabus} />
                <SummaryItem label="Level" value={config.difficulty} />
                <SummaryItem label="Sections" value={config.sections.length} />
                <SummaryItem label="Total Marks" value={config.sections.reduce((acc, s) => acc + (s.count * s.marks), 0)} />
              </div>
              <button 
                disabled={!selectedSyllabus || isLoading}
                onClick={handleGenerate}
                className="w-full bg-indigo-500 hover:bg-indigo-400 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                {isLoading ? <><Loader2 className="w-6 h-6 animate-spin" /> Cooking...</> : <><Sparkles className="w-6 h-6" /> Generate with AI</>}
              </button>
           </div>
        </div>
      </div>
    </motion.div>
  );
}

function SummaryItem({ label, value, active = true }: any) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="opacity-50 font-medium">{label}</span>
      <span className={`font-bold ${!active ? 'text-red-400' : 'text-indigo-400'}`}>{value}</span>
    </div>
  );
}


const PrintPaper = forwardRef<HTMLDivElement, { paper: any }>(({ paper }, ref) => {
  return (
    <div ref={ref} className="bg-white p-[5mm] text-gray-900 border print:border-0" style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', boxSizing: 'border-box' }}>
      <style>{`
        @page {
          size: A4;
          margin: 0.5cm;
        }
        @media print {
          body { -webkit-print-color-adjust: exact; }
          .print-container { margin: 0; border: none; }
        }
      `}</style>
      <header className="text-center border-b-2 border-gray-900 pb-4 mb-6">
        <h1 style={{ fontSize: '16px' }} className="font-bold uppercase tracking-tight mb-1">{paper.schoolName}</h1>
        <h2 style={{ fontSize: '14px' }} className="font-bold text-gray-700 mb-4">{paper.examTitle}</h2>
        
        <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-left" style={{ fontSize: '12px' }}>
          <div><span className="font-bold">Student Name:</span> ___________________________________</div>
          <div><span className="font-bold">Subject:</span> {paper.subject}</div>
          <div><span className="font-bold">Roll No:</span> ____________</div>
          <div className="flex justify-between">
            <span><span className="font-bold">Max Marks:</span> {paper.maxMarks}</span>
            <span><span className="font-bold">Duration:</span> {paper.duration}</span>
          </div>
        </div>
      </header>

      {paper.sections?.map((section: any) => (
        <div key={section.id} className="mb-8">
          <div className="flex justify-between items-center border-b border-gray-100 mb-4 pb-1">
             <h3 style={{ fontSize: '12px' }} className="font-bold uppercase tracking-widest">{section.title}</h3>
             <span style={{ fontSize: '10px' }} className="italic opacity-60 font-bold">({section.questions?.length || 0} Questions × {section.questions?.[0]?.marks || 0} Marks each)</span>
          </div>
          
          <div className="space-y-6">
            {section.questions?.map((q: any, i: number) => (
              <div key={i} className="break-inside-avoid" style={{ fontSize: '12px' }}>
                <div className="flex gap-2 font-medium mb-1">
                  <span className="shrink-0 font-bold">{i + 1}.</span>
                  <p className="flex-1">{q.text}</p>
                  <span className="shrink-0 font-bold" style={{ fontSize: '10px' }}>[{q.marks}M]</span>
                </div>
                
                {Array.isArray(q.options) && q.options.length > 0 && !section.title.toLowerCase().includes('fill in the blanks') && (
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2 ml-6 mb-2">
                    {q.options.map((opt: string, oi: number) => (
                      <div key={oi} className="flex gap-2 items-start">
                        <span className="font-bold">{String.fromCharCode(64 + oi + 1)})</span>
                        <span>{opt}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Space lines for answers */}
                <div className="ml-6 mt-3 space-y-3">
                  {Array.from({ 
                    length: q.type === 'long' ? 15 : 
                            q.type === 'short' ? 5 : 
                            (q.type === 'fill_blanks' || section.title.toLowerCase().includes('fill in the blanks')) ? 0 : 0 
                  }).map((_, li) => (
                    <div key={li} className="border-b border-gray-200 h-1 w-full opacity-50"></div>
                  ))}
                  {(q.type === 'mcq' || section.title.toLowerCase().includes('multiple choice')) && <div className="h-2"></div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
});

PrintPaper.displayName = 'PrintPaper';

// --- Assessments List View ---
function AssessmentsView({ onAction }: { onAction: (paper: any, mode: 'preview' | 'print') => void }) {
  const [papers, setPapers] = useState<any[]>([]);
  const [isEvaluating, setIsEvaluating] = useState<string | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [evalData, setEvalData] = useState({ studentId: '', fileType: 'pdf' as 'pdf' | 'jpg' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchAssessments = async () => {
    try {
      const r = await fetch('/api/school/assessments-list');
      if (r.ok) {
        const data = await r.json();
        setPapers(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("Failed to fetch assessments:", e);
    }
  };

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const r = await fetch('/api/school/students');
        if (r.ok) {
          const data = await r.json();
          setStudents(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        console.error("Failed to fetch students:", e);
      }
    };
    
    fetchStudents();
    fetchAssessments();
  }, []);

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    setIsProcessing(true);

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) {
       alert("Not logged in");
       setIsProcessing(false);
       return;
    }

    const { v4: uuidv4 } = require('uuid');
    const ext = selectedFile.name.split('.').pop();
    const fileId = uuidv4();
    const filePath = `${userId}/evaluations/${evalData.studentId}/${fileId}.${ext}`;
    
    const { error: uploadError } = await supabase.storage.from('app-files').upload(filePath, selectedFile);
    
    if (uploadError) {
       alert('Upload error: ' + uploadError.message);
       setIsProcessing(false);
       return;
    }

    const res = await fetch('/api/school/evaluate-paper', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...evalData, paperId: isEvaluating, filePath })
    });
    setIsProcessing(false);
    if (res.ok) {
      setIsEvaluating(null);
      alert('Paper evaluated successfully and stored in student database.');
    } else {
      const resp = await res.json();
      alert(resp.error || 'Failed to evaluate paper');
    }
  };

  const handleDeleteAssessment = async (id: string) => {
    if (!confirm('Delete this assessment paper?')) return;
    try {
      const res = await fetch(`/api/school/assessments-list?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchAssessments();
      else alert('Failed to delete assessment');
    } catch (e) { alert('Request failed'); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h1 className="text-3xl font-display font-bold mb-8">Assessment Library</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {papers.map((p: any) => (
          <div key={p.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all relative group">
             <button 
               onClick={() => handleDeleteAssessment(p.id)}
               className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
             >
               <Trash2 className="w-4 h-4" />
             </button>
             <div className="flex justify-between items-start mb-4 pr-8">
                <div>
                   <h2 className="font-bold text-gray-900">{p.examTitle || p.exam_title}</h2>
                   <p className="text-xs text-gray-400 capitalize">{p.subject} • {p.maxMarks || p.max_marks} Marks</p>
                </div>
                <button onClick={() => setIsEvaluating(p.id)} className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase italic">Evaluate Logic</button>
             </div>
             <div className="flex gap-2">
                <button onClick={() => onAction(p, 'preview')} className="flex-1 text-xs py-2 bg-gray-50 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 font-bold">Preview</button>
                <button onClick={() => onAction(p, 'print')} className="flex-1 text-xs py-2 bg-gray-900 text-white rounded-xl hover:opacity-90 font-bold">Print PDF</button>
             </div>
          </div>
        ))}
        {papers.length === 0 && <div className="col-span-full py-20 text-center text-gray-400">Genereate papers to see them here.</div>}
      </div>

      {isEvaluating && (
        <Modal title="Evaluate Student Submission" onClose={() => setIsEvaluating(null)}>
           <form onSubmit={handleEvaluate} className="space-y-4">
              <div>
                 <label className="label">Select Student</label>
                 <select className="input" required value={evalData.studentId} onChange={e => setEvalData({...evalData, studentId: e.target.value})}>
                    <option value="">Choose student...</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.class})</option>)}
                 </select>
              </div>
              <div className="border-2 border-dashed border-gray-100 rounded-2xl p-8 text-center bg-gray-50 hover:bg-indigo-50 transition-colors group cursor-pointer relative">
                <input type="file" required accept="image/*,.pdf" onChange={(e) => {
                   const file = e.target.files?.[0];
                   if (file) {
                     setSelectedFile(file);
                     setEvalData({...evalData, fileType: file.type.includes('pdf') ? 'pdf' : 'jpg'});
                   }
                }} className="absolute inset-0 opacity-0 cursor-pointer" />
                <Upload className="w-10 h-10 text-gray-300 mx-auto mb-2 group-hover:text-indigo-600 transition-colors" />
                <p className="text-sm font-medium text-gray-600">{selectedFile ? selectedFile.name : 'Upload Student Answer Script'}</p>
              </div>
              <button disabled={isProcessing} className="button-primary w-full py-4 mt-6 flex items-center justify-center gap-2 text-white">
                {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" /> Evaluating with AI...</> : 'Correct & Score'}
              </button>
           </form>
        </Modal>
      )}
    </motion.div>
  );
}

function PerformanceView({ students }: any) {
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);

  const fetchResults = async () => {
    if (selectedStudent) {
      try {
        const r = await fetch(`/api/school/results?studentId=${selectedStudent}`);
        if (r.ok) {
          const data = await r.json();
          setResults(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        console.error("Failed to fetch results:", e);
      }
    }
  };

  useEffect(() => {
    fetchResults();
  }, [selectedStudent]);

  const chartData = useMemo(() => {
    return results.map((r: any) => ({
      name: r.paper?.exam_title || 'Assmt',
      score: r.marks_secured,
      percentage: Math.round((r.marks_secured / r.total_marks) * 100),
      total: r.total_marks,
      grade: r.grade
    })).reverse(); // Oldest to newest
  }, [results]);

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+': case 'A': return '#22c55e';
      case 'B+': case 'B': return '#84cc16';
      case 'C+': case 'C': return '#eab308';
      case 'D': return '#f97316';
      case 'E': case 'F': return '#ef4444';
      default: return '#6366f1';
    }
  };

  const handleViewScript = async (filePath: string) => {
    if (!filePath) return;
    const { data, error } = await supabase.storage.from('app-files').createSignedUrl(filePath, 60 * 60);
    if (error || !data) {
      alert('Failed to get file URL');
    } else {
      window.open(data.signedUrl, '_blank');
    }
  };

  const handleDeleteResult = async (id: string, filePath?: string) => {
    if (!confirm('Are you sure you want to delete this result?')) return;
    try {
      if (filePath) {
        await supabase.storage.from('app-files').remove([filePath]);
      }
      const res = await fetch(`/api/school/results?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        throw new Error('Failed to delete result');
      }
      fetchResults();
    } catch (e: any) {
      alert("Delete failed: " + e.message);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h1 className="text-3xl font-display font-bold mb-8">Performance Analytics</h1>
      
      {!selectedStudent ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {students.map((s: any) => (
            <button key={s.id} onClick={() => setSelectedStudent(s.id)} className="bg-white p-6 rounded-3xl border border-gray-100 hover:border-indigo-600 text-left transition-all group shadow-sm">
               <h3 className="font-bold text-gray-900 group-hover:text-indigo-600">{s.name}</h3>
               <p className="text-xs text-gray-400">Class {s.class}</p>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
           <button onClick={() => setSelectedStudent(null)} className="text-xs font-bold text-indigo-600 mb-4">← Back to students</button>
           <h2 className="text-2xl font-bold mb-8">{students.find((s:any) => s.id === selectedStudent)?.name} - Profile</h2>
           
           {results.length > 0 && (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
               <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm h-[400px]">
                 <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                   <BarChart3 className="w-4 h-4" /> Performance Trend (%)
                 </h3>
                 <div className="h-[280px]">
                   <ResponsiveContainer width="100%" height="100%">
                     <LineChart data={chartData}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                       <XAxis 
                         dataKey="name" 
                         stroke="#94a3b8" 
                         fontSize={10} 
                         tickLine={false} 
                         axisLine={false}
                       />
                       <YAxis 
                         stroke="#94a3b8" 
                         fontSize={10} 
                         tickLine={false} 
                         axisLine={false}
                         domain={[0, 100]}
                         tickFormatter={(val) => `${val}%`}
                       />
                       <Tooltip 
                         contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                         formatter={(value) => [`${value}%`, 'Percentage']}
                       />
                       <Line 
                         type="monotone" 
                         dataKey="percentage" 
                         stroke="#6366f1" 
                         strokeWidth={3} 
                         dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                         activeDot={{ r: 6, strokeWidth: 0 }}
                         animationDuration={1000}
                       />
                     </LineChart>
                   </ResponsiveContainer>
                 </div>
               </div>

               <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm h-[400px]">
                 <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                   <Plus className="w-4 h-4" /> Marks Distribution
                 </h3>
                 <div className="h-[280px]">
                   <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={chartData}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                       <XAxis 
                         dataKey="name" 
                         stroke="#94a3b8" 
                         fontSize={10} 
                         tickLine={false} 
                         axisLine={false}
                       />
                       <YAxis 
                         stroke="#94a3b8" 
                         fontSize={10} 
                         tickLine={false} 
                         axisLine={false}
                       />
                       <Tooltip 
                         contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                         formatter={(value, name, props) => [`${value} / ${props.payload.total}`, 'Score']}
                       />
                       <Bar 
                         dataKey="score" 
                         radius={[6, 6, 0, 0]}
                         animationDuration={1500}
                       >
                         {chartData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={getGradeColor(entry.grade)} />
                         ))}
                       </Bar>
                     </BarChart>
                   </ResponsiveContainer>
                 </div>
               </div>
             </div>
           )}
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {results.map((r: any) => (
               <div key={r.id} className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-start mb-6">
                     <div>
                        <div className="text-xs font-bold uppercase tracking-widest text-gray-300">Assessment</div>
                        <h4 className="text-xl font-bold">Paper: {r.paper?.exam_title || r.paper_id?.slice(0,8)}</h4>
                        {r.analytics?.filePath && (
                          <div className="mt-2 flex gap-2">
                             <button onClick={() => handleViewScript(r.analytics.filePath)} className="text-xs text-indigo-600 hover:text-indigo-800 font-bold underline">View Script</button>
                             <button onClick={() => handleDeleteResult(r.id, r.analytics.filePath)} className="text-xs text-red-600 hover:text-red-800 font-bold underline">Delete</button>
                          </div>
                        )}
                        {!r.analytics?.filePath && (
                          <div className="mt-2 flex gap-2">
                             <button onClick={() => handleDeleteResult(r.id)} className="text-xs text-red-600 hover:text-red-800 font-bold underline">Delete</button>
                          </div>
                        )}
                     </div>
                     <div className="text-center">
                        <div className="text-4xl font-display font-bold text-indigo-600">{r.grade}</div>
                        <div className="text-[10px] font-bold text-gray-400">GRADE</div>
                     </div>
                  </div>
                  
                  <div className="space-y-4">
                     <div className="flex justify-between items-center py-3 border-b border-gray-50">
                        <span className="text-sm font-medium text-gray-500">Score</span>
                        <span className="font-bold">{r.marks_secured} / {r.total_marks}</span>
                     </div>
                     <div>
                        <div className="text-[10px] uppercase font-bold text-green-600 mb-2">Strengths</div>
                        <div className="flex flex-wrap gap-1">
                           {r.analytics?.areasGood?.map((a: string) => <span key={a} className="text-[10px] px-2 py-0.5 bg-green-50 text-green-700 rounded-md font-bold">{a}</span>)}
                        </div>
                     </div>
                     <div>
                        <div className="text-[10px] uppercase font-bold text-red-600 mb-2">Needs Improvement</div>
                        <div className="flex flex-wrap gap-1">
                           {r.analytics?.areasPoor?.map((a: string) => <span key={a} className="text-[10px] px-2 py-0.5 bg-red-50 text-red-700 rounded-md font-bold">{a}</span>)}
                        </div>
                     </div>
                  </div>
               </div>
             ))}
             {results.length === 0 && <div className="col-span-full py-20 text-center text-gray-400 italic">No assessment records found for this student.</div>}
           </div>
        </div>
      )}
    </motion.div>
  );
}

// --- Shared Components ---

function Modal({ title, children, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[40px] p-8 md:p-10 max-w-lg w-full shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-display font-bold text-gray-900 tracking-tight">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-6 h-6" /></button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

// --- Templates View ---
function TemplatesView({ templates, onUpdate, onUse }: any) {
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    try {
      const res = await fetch(`/api/school/templates?id=${id}`, { method: 'DELETE' });
      if (res.ok) onUpdate();
      else alert('Failed to delete');
    } catch (e) { alert('Error'); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-display font-bold mb-2">Assessment Templates</h1>
          <p className="text-gray-400">Save and load assessment structures for rapid paper generation.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((t: any) => (
          <div key={t.id} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-md transition-all group relative">
            <button 
              onClick={() => handleDelete(t.id)}
              className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4">
              <Layout className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-1">{t.name}</h3>
            <p className="text-xs text-indigo-600 font-bold uppercase tracking-widest mb-4">{t.subject}</p>
            
            <div className="space-y-2 mb-6">
              {t.sections?.map((s: any, i: number) => (
                <div key={i} className="flex justify-between items-center text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg">
                  <span className="truncate pr-2 font-medium">{s.title}</span>
                  <span className="font-bold opacity-60 shrink-0">{s.count} Qs</span>
                </div>
              ))}
            </div>

            <button 
              onClick={() => onUse(t)}
              className="w-full py-3 bg-gray-900 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
            >
              <Copy className="w-4 h-4" /> Use Template
            </button>

            <div className="text-[10px] text-gray-400 mt-4 flex items-center gap-1 opacity-60">
              <Sparkles className="w-3 h-3" />
              Created {new Date(t.created_at).toLocaleDateString()}
            </div>
          </div>
        ))}

        {templates.length === 0 && (
          <div className="col-span-full py-20 bg-white rounded-[40px] border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400">
             <Layout className="w-12 h-12 mb-4 opacity-20" />
             <p className="font-medium text-sm">No templates found. Go to &apos;AI Paper Generator&apos; to save one.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

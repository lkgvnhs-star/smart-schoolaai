import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const DB_PATH = path.join(process.cwd(), 'database.json');

export interface School {
  id: string;
  name: string;
  city: string;
  plan: string;
  status: 'active' | 'inactive';
  createdAt: number;
}

export interface User {
  id: string;
  email: string;
  password?: string;
  role: 'super_admin' | 'school_admin' | 'teacher';
  schoolId?: string;
}

export interface Teacher {
  id: string;
  schoolId: string;
  name: string;
  classes: string[];
  subjects: string[];
}

export interface Student {
  id: string;
  schoolId: string;
  name: string;
  class: string;
}

export interface Syllabus {
  id: string;
  schoolId: string;
  title: string;
  content: string; // Text content extracted or provided
  fileType: 'jpg' | 'pdf';
  fileData?: string; // Base64 for demo persistence
  createdAt: number;
}

export interface Question {
  type: 'mcq' | 'fill_blanks' | 'short' | 'long';
  text: string;
  options?: string[];
  answer: string;
  marks: number;
  section: string;
}

export interface QuestionPaper {
  id: string;
  schoolId: string;
  schoolName: string;
  examTitle: string;
  subject: string;
  maxMarks: number;
  duration: string;
  sections: {
    id: string;
    title: string;
    questions: Question[];
  }[];
  createdAt: number;
}

export interface AssessmentResult {
  id: string;
  studentId: string;
  paperId: string;
  marksSecured: number;
  totalMarks: number;
  grade: string;
  analytics: {
    areasGood: string[];
    areasPoor: string[];
    feedback: string;
  };
  createdAt: number;
}

interface DB {
  schools: School[];
  users: User[];
  teachers: Teacher[];
  students: Student[];
  syllabus: Syllabus[];
  papers: QuestionPaper[];
  results: AssessmentResult[];
}

const INITIAL_DB: DB = {
  schools: [],
  users: [
    {
      id: 'super-admin-id',
      email: 'superadmin@gmail.com',
      password: 'super123admin@',
      role: 'super_admin'
    }
  ],
  teachers: [],
  students: [],
  syllabus: [],
  papers: [],
  results: []
};

function readDB(): DB {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(INITIAL_DB, null, 2));
    return INITIAL_DB;
  }
  try {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    return INITIAL_DB;
  }
}

function writeDB(db: DB) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

export const dbAdmin = {
  getSchools: () => readDB().schools,
  addSchool: (school: Omit<School, 'id' | 'createdAt'>) => {
    const db = readDB();
    const newSchool = { ...school, id: uuidv4(), createdAt: Date.now() };
    db.schools.push(newSchool);
    writeDB(db);
    return newSchool;
  },
  updateSchool: (id: string, updates: Partial<School>) => {
    const db = readDB();
    const index = db.schools.findIndex(s => s.id === id);
    if (index !== -1) {
      db.schools[index] = { ...db.schools[index], ...updates };
      writeDB(db);
    }
  },
  deleteSchool: (id: string) => {
    const db = readDB();
    db.schools = db.schools.filter(s => s.id !== id);
    db.users = db.users.filter(u => u.schoolId !== id);
    writeDB(db);
  },
  
  getUsers: () => readDB().users,
  addUser: (user: Omit<User, 'id'>) => {
    const db = readDB();
    const newUser = { ...user, id: uuidv4() };
    db.users.push(newUser);
    writeDB(db);
    return newUser;
  },
  
  // School Admin methods
  getTeachers: (schoolId: string) => readDB().teachers.filter(t => t.schoolId === schoolId),
  addTeacher: (teacher: Omit<Teacher, 'id'>) => {
    const db = readDB();
    const newTeacher = { ...teacher, id: uuidv4() };
    db.teachers.push(newTeacher);
    writeDB(db);
    return newTeacher;
  },
  
  getStudents: (schoolId: string) => readDB().students.filter(s => s.schoolId === schoolId),
  addStudent: (student: Omit<Student, 'id'>) => {
    const db = readDB();
    const newStudent = { ...student, id: uuidv4() };
    db.students.push(newStudent);
    writeDB(db);
    return newStudent;
  },
  
  getSyllabus: (schoolId: string) => readDB().syllabus.filter(s => s.schoolId === schoolId),
  addSyllabus: (syllabus: Omit<Syllabus, 'id' | 'createdAt'>) => {
    const db = readDB();
    const newSyllabus = { ...syllabus, id: uuidv4(), createdAt: Date.now() };
    db.syllabus.push(newSyllabus);
    writeDB(db);
    return newSyllabus;
  },
  
  getPapers: (schoolId: string) => readDB().papers.filter(p => p.schoolId === schoolId),
  addPaper: (paper: Omit<QuestionPaper, 'id' | 'createdAt'>) => {
    const db = readDB();
    const newPaper = { ...paper, id: uuidv4(), createdAt: Date.now() };
    db.papers.push(newPaper);
    writeDB(db);
    return newPaper;
  },

  getResults: (schoolId: string) => {
    const db = readDB();
    // Filter results for students in this school
    const studentIds = db.students.filter(s => s.schoolId === schoolId).map(s => s.id);
    return db.results.filter(r => studentIds.includes(r.studentId));
  },
  addResult: (result: Omit<AssessmentResult, 'id' | 'createdAt'>) => {
    const db = readDB();
    const newResult = { ...result, id: uuidv4(), createdAt: Date.now() };
    db.results.push(newResult);
    writeDB(db);
    return newResult;
  }
};

-- 1. Profiles Table (Extends Supabase Auth)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  role TEXT CHECK (role IN ('super_admin', 'school_admin', 'teacher')),
  school_id UUID,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Schools Table
CREATE TABLE schools (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  plan TEXT DEFAULT 'Basic',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Teachers Table
CREATE TABLE teachers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  classes TEXT[] DEFAULT '{}',
  subjects TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Students Table
CREATE TABLE students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  class TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Syllabus Table
CREATE TABLE syllabus (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  file_type TEXT,
  file_data TEXT, -- Base64 storage
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Question Papers Table
CREATE TABLE papers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  school_name TEXT,
  exam_title TEXT,
  subject TEXT,
  max_marks INTEGER,
  duration TEXT,
  sections JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Assessment Results Table
CREATE TABLE results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  paper_id UUID REFERENCES papers(id) ON DELETE CASCADE,
  marks_secured INTEGER,
  total_marks INTEGER,
  grade TEXT,
  analytics JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- --- RLS POLICIES ---

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE syllabus ENABLE ROW LEVEL SECURITY;
ALTER TABLE papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;

-- Super Admin Policy (Can do anything)
CREATE POLICY "Super Admins can manage everything" ON schools FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
);

-- School Admin Policies
CREATE POLICY "School Admins can view their school" ON schools FOR SELECT USING (
  id IN (SELECT school_id FROM profiles WHERE profiles.id = auth.uid())
);

CREATE POLICY "School Admins manage their teachers" ON teachers FOR ALL USING (
  school_id IN (SELECT school_id FROM profiles WHERE profiles.id = auth.uid())
);

CREATE POLICY "School Admins manage their students" ON students FOR ALL USING (
  school_id IN (SELECT school_id FROM profiles WHERE profiles.id = auth.uid())
);

CREATE POLICY "School Admins manage their syllabus" ON syllabus FOR ALL USING (
  school_id IN (SELECT school_id FROM profiles WHERE profiles.id = auth.uid())
);

CREATE POLICY "School Admins manage their papers" ON papers FOR ALL USING (
  school_id IN (SELECT school_id FROM profiles WHERE profiles.id = auth.uid())
);

CREATE POLICY "School Admins manage results" ON results FOR ALL USING (
  paper_id IN (SELECT id FROM papers WHERE school_id IN (SELECT school_id FROM profiles WHERE profiles.id = auth.uid()))
);

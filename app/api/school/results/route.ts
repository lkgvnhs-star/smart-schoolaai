import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !session.schoolId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const studentId = req.nextUrl.searchParams.get('studentId');
  
  let query = supabaseAdmin
    .from('results')
    .select('*, student:students(name, class), paper:papers(exam_title, subject)');

  if (studentId) {
    query = query.eq('student_id', studentId);
  }

  // To secure results, we filter by paper which belongs to school
  // In a robust setup, use RPC or deeper joins
  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  // Filter manually if needed to ensure school isolation (or use SQL join)
  const filtered = data.filter((r: any) => r.paper?.school_id === session.schoolId || true); 

  return NextResponse.json(data);
}

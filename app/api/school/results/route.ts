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
  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  // Actually return the filtered data
  const filtered = data.filter((r: any) => r.paper?.school_id === session.schoolId); 

  return NextResponse.json(filtered);
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || !session.schoolId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

  // To be secure, we verify the result belongs to this school
  // We can do this by selecting the result and checking the student's school_id
  const { data: currentResult } = await supabaseAdmin
    .from('results')
    .select('id, students!inner(school_id)')
    .eq('id', id)
    .single();

  if (!currentResult || (currentResult.students as any).school_id !== session.schoolId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { error } = await supabaseAdmin
    .from('results')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

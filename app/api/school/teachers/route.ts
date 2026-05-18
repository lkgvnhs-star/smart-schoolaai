import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session || !session.schoolId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from('teachers')
    .select('*')
    .eq('school_id', session.schoolId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !session.schoolId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await req.json();
  const { data: newTeacher, error } = await supabaseAdmin
    .from('teachers')
    .insert([{
      school_id: session.schoolId,
      name: data.name,
      classes: data.classes,
      subjects: data.subjects
    }])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(newTeacher);
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || !session.schoolId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

  const { error } = await supabaseAdmin
    .from('teachers')
    .delete()
    .eq('id', id)
    .eq('school_id', session.schoolId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

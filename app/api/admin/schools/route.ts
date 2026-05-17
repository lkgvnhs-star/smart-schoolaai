import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

// Simple check for role from session - in production you'd verify JWT properly
async function getRole(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  // For this demo, we assume Super Admin if no header or specific header provided
  // In a real app, use supabase.auth.getUser()
  return 'super_admin'; 
}

export async function GET() {
  const { data, error } = await supabaseAdmin.from('schools').select('*').order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const { data: newSchool, error } = await supabaseAdmin.from('schools').insert([{
    name: data.name,
    city: data.city,
    plan: data.plan,
    status: 'active'
  }]).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(newSchool);
}

export async function PUT(req: NextRequest) {
  const data = await req.json();
  const { error } = await supabaseAdmin.from('schools').update({ status: data.status }).eq('id', data.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  const { error } = await supabaseAdmin.from('schools').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

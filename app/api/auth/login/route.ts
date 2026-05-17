import { NextRequest, NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/db';
import { createSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  const users = dbAdmin.getUsers();
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  await createSession(user.id, user.role, user.schoolId);

  return NextResponse.json({ role: user.role, schoolId: user.schoolId });
}

import { NextRequest, NextResponse } from 'next/server';
import { createSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { userId, role, schoolId } = await req.json();
  await createSession(userId, role, schoolId);
  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
  try {
    const { email, password, schoolId } = await req.json();
    
    // We should use supabaseAdmin to create the user
    const supabase = supabaseAdmin;
    if (!supabase) {
        return NextResponse.json({ error: 'Supabase Admin not configured. Cannot create users.' }, { status: 500 });
    }

    // 1. Create the user using Supabase Admin API
    // We use admin.createUser to bypass email confirmation and auto-confirm
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        schoolId: schoolId,
        role: 'school_admin'
      }
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // Wait a brief moment for the handle_new_user trigger to create the profile
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 2. Update their profile with the schoolId and role explicitly
    if (authData.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          school_id: schoolId,
          role: 'school_admin'
        })
        .eq('id', authData.user.id);
        
      if (profileError) {
         console.error("Failed to update profile:", profileError);
      }
    }

    return NextResponse.json({ email: email, schoolId: schoolId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

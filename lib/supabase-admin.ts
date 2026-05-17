import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eqgkacvblyppubyoyscv.supabase.co';

let supabaseAdminClient: any = null;

export function getSupabaseAdmin() {
  if (supabaseAdminClient) return supabaseAdminClient;
  
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseServiceKey) {
    console.warn("SUPABASE_SERVICE_ROLE_KEY is missing. RLS-bypassing server operations will fail.");
    return null;
  }

  supabaseAdminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  return supabaseAdminClient;
}

// For compatibility during transition
export const supabaseAdmin = {
  from: (table: string) => {
    const client = getSupabaseAdmin();
    if (!client) throw new Error("Supabase Admin client not initialized");
    return client.from(table);
  },
  get auth() {
    const client = getSupabaseAdmin();
    if (!client) throw new Error("Supabase Admin client not initialized");
    return client.auth;
  },
  get storage() {
    const client = getSupabaseAdmin();
    if (!client) throw new Error("Supabase Admin client not initialized");
    return client.storage;
  }
};

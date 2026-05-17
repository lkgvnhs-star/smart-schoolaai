import { supabaseAdmin } from './lib/supabase-admin';

async function test() {
  const { data, error } = await supabaseAdmin.from('syllabus').select('file_path').limit(1);
  console.log("syllabus file_path:", error ? error.message : "Exists");
  
  const { data: d2, error: e2 } = await supabaseAdmin.from('results').select('file_path').limit(1);
  console.log("results file_path:", e2 ? e2.message : "Exists");
}

test();

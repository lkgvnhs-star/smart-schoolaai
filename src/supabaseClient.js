import { createClient } from "@supabase/supabase-js";

// REPLACE THESE WITH YOUR ACTUAL VALUES
const SUPABASE_URL = "https://eqgkacvblyppubyoyscv.supabase.co"; 
const SUPABASE_PUBLIC_KEY = "sb_publishable_w9SbRQe5lnQA9Mcw1E29Eg_XR1xdYXf"; 

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);

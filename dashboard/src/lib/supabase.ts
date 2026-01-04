
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ztwcpkaunjtaftvdirqd.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || "sb_publishable_ku_dam8A40EUXl5ss8SQww_EX_MCmWB";

export const supabase = createClient(supabaseUrl, supabaseKey);

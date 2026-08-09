import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL ?? 'https://jaucqsyvqiwmxmdqfeet.supabase.co';
const anon =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  'sb_publishable_e_eKzfJtJrdSgPEQV2hLrA_DLagBtt0';

export const supabase = createClient(url, anon);

import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_ANON_KEY as string,
);

export const STORED_TABLES_TABLE = process.env.SUPABASE_TABLE as string;

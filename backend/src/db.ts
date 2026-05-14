import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
);

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  created_at: number;
  subscription_status: 'active' | 'trial' | 'inactive';
  trial_started_at: number | null;
  stripe_customer_id: string | null;
}

export interface ProjectRow {
  id: string;
  user_id: string;
  api_key: string;
  site_name: string;
  color: string;
  context: string | null;
  context_url: string | null;
  allowed_domain: string | null;
  allowed_paths: string | null;
  created_at: number;
  updated_at: number;
}

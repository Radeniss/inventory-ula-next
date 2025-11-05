import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type User = {
  id: string;
  username: string;
  password: string;
  created_at: string;
  updated_at: string;
};

export type Item = {
  id: number;
  name: string;
  sku: string;
  quantity: number;
  price: number;
  description: string | null;
  category: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
};

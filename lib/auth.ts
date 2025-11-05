import bcrypt from 'bcryptjs';
import { SupabaseClient } from '@supabase/supabase-js';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createUser(supabase: SupabaseClient, username: string, email: string, password: string) {
  // Step 1: Sign up the user with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: email, 
    password: password,
  });

  if (authError) {
    // Handle specific auth errors, e.g., user already exists
    throw authError;
  }

  const user = authData.user;
  if (!user) {
    // This can happen if email confirmation is required.
    // We can proceed to create the profile, but the user won't be able to log in until confirmed.
    // Or, we can throw a specific error to inform the user.
    // For now, let's assume we can still create the profile.
    // A better approach might be to return a specific message to the user.
    throw new Error('Pengguna terdaftar, tetapi perlu konfirmasi email.');
  }

  // Step 2: Create a corresponding user profile in the public 'users' table
  const hashedPassword = await hashPassword(password);
  const { data: profileData, error: profileError } = await supabase
    .from('users')
    .insert([{
      id: user.id, // Use the ID from Supabase Auth
      username,
      password: hashedPassword, // You might still want to store this for other purposes
    }])
    .select()
    .single();

  if (profileError) {
    // If profile creation fails, you might want to delete the auth user
    // to keep things clean. This is an advanced step (atomicity).
    // For now, we'll just throw the error.
    throw profileError;
  }

  return profileData;
}

export async function getUserByUsername(username: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export function setAuthCookie(userId: string) {
  if (typeof document !== 'undefined') {
    document.cookie = `auth_user_id=${userId}; path=/; max-age=86400; SameSite=Strict`;
  }
}

export function getAuthCookie(): string | null {
  if (typeof document === 'undefined') return null;

  const cookie = document.cookie
    .split('; ')
    .find(row => row.startsWith('auth_user_id='));

  return cookie ? cookie.split('=')[1] : null;
}

export function clearAuthCookie() {
  if (typeof document !== 'undefined') {
    document.cookie = 'auth_user_id=; path=/; max-age=0';
  }
}

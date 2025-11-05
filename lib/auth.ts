import { supabase } from './supabase';
import bcrypt from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createUser(username: string, password: string) {
  const hashedPassword = await hashPassword(password);

  const { data, error } = await supabase
    .from('users')
    .insert([{ username, password: hashedPassword }])
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
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

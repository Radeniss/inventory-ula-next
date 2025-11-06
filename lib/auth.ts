import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createUser(username: string, email: string, password: string) {
  const hashedPassword = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      username,
      email,
      password: hashedPassword,
    },
  });
  return user;
}

export async function getUserByUsername(username: string) {
  const user = await prisma.user.findUnique({
    where: {
      username,
    },
  });
  return user;
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
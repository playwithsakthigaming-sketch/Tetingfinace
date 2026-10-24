/**
 * Sri Sennamal Finance — Supabase Integration & Authentication Service
 * Single owner authorization, token passbook verification, and database sync.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
export const DESIGNATED_OWNER_EMAIL = 'playwithsakthigaming@gmail.com';

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && 
  SUPABASE_ANON_KEY && 
  SUPABASE_URL !== 'https://your-project.supabase.co'
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

/**
 * Verify whether an email belongs to the authorized owner.
 * Strictly prevents non-owner accounts from accessing internal management.
 */
export function isAuthorizedOwner(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === DESIGNATED_OWNER_EMAIL.toLowerCase();
}

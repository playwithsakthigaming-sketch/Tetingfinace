/**
 * Sri Sennamal Finance — Supabase Integration & Authentication Service
 * Single owner authorization, token passbook verification, and database sync.
 * Supports environment variables and UI-configured Supabase project credentials.
 */

import { createClient, SupabaseClient, Session, User } from '@supabase/supabase-js';

export const DESIGNATED_OWNER_EMAIL = 'playwithsakthigaming@gmail.com';

const STORAGE_URL_KEY = 'sri_sennamal_supabase_url';
const STORAGE_ANON_KEY = 'sri_sennamal_supabase_anon_key';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConfigured: boolean;
  source: 'env' | 'custom' | 'none';
}

/**
 * Retrieve active Supabase credentials from localStorage or environment variables
 */
export function getActiveSupabaseConfig(): SupabaseConfig {
  const customUrl = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_URL_KEY)?.trim() : null;
  const customKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_ANON_KEY)?.trim() : null;

  if (customUrl && customKey && customUrl.startsWith('https://')) {
    return {
      url: customUrl,
      anonKey: customKey,
      isConfigured: true,
      source: 'custom',
    };
  }

  const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  if (envUrl && envKey && envUrl !== 'https://your-project.supabase.co' && envUrl.startsWith('https://')) {
    return {
      url: envUrl,
      anonKey: envKey,
      isConfigured: true,
      source: 'env',
    };
  }

  return {
    url: envUrl || '',
    anonKey: envKey || '',
    isConfigured: false,
    source: 'none',
  };
}

let activeClient: SupabaseClient | null = null;
let currentConfig = getActiveSupabaseConfig();

function initializeClient(): SupabaseClient | null {
  currentConfig = getActiveSupabaseConfig();
  if (currentConfig.isConfigured && currentConfig.url && currentConfig.anonKey) {
    try {
      activeClient = createClient(currentConfig.url, currentConfig.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
      return activeClient;
    } catch (err) {
      console.warn('Failed to initialize Supabase client:', err);
      activeClient = null;
      return null;
    }
  }
  activeClient = null;
  return null;
}

// Initial initialization
initializeClient();

export function getSupabaseClient(): SupabaseClient | null {
  if (!activeClient) {
    return initializeClient();
  }
  return activeClient;
}

export const supabase: SupabaseClient | null = activeClient;

/**
 * Configure Supabase dynamically from the UI and initialize the client
 */
export function saveCustomSupabaseConfig(url: string, anonKey: string): { success: boolean; error?: string } {
  try {
    const cleanUrl = url.trim();
    const cleanKey = anonKey.trim();

    if (!cleanUrl || !cleanKey) {
      return { success: false, error: 'Supabase URL and Anon Key cannot be empty.' };
    }

    if (!cleanUrl.startsWith('https://') || !cleanUrl.includes('supabase.co')) {
      return { success: false, error: 'Supabase URL must start with https:// and belong to your supabase.co project.' };
    }

    localStorage.setItem(STORAGE_URL_KEY, cleanUrl);
    localStorage.setItem(STORAGE_ANON_KEY, cleanKey);
    initializeClient();

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || 'Failed to save configuration' };
  }
}

/**
 * Clear custom Supabase config
 */
export function clearCustomSupabaseConfig(): void {
  localStorage.removeItem(STORAGE_URL_KEY);
  localStorage.removeItem(STORAGE_ANON_KEY);
  initializeClient();
}

/**
 * Test connectivity with current or provided Supabase project
 */
export async function testSupabaseConnection(testUrl?: string, testKey?: string): Promise<{ ok: boolean; message: string }> {
  try {
    let clientToTest: SupabaseClient | null = null;
    if (testUrl && testKey) {
      clientToTest = createClient(testUrl.trim(), testKey.trim());
    } else {
      clientToTest = getSupabaseClient();
    }

    if (!clientToTest) {
      return { ok: false, message: 'Supabase is not configured yet. Please enter your project URL and anon public key.' };
    }

    // Ping health or auth endpoint
    const { error } = await clientToTest.auth.getSession();
    if (error) {
      return { ok: false, message: `Connection error: ${error.message}` };
    }

    return { ok: true, message: 'Successfully connected to Supabase project!' };
  } catch (err: any) {
    return { ok: false, message: err?.message || 'Network error reaching Supabase.' };
  }
}

/**
 * Verify whether an email belongs to the authorized owner.
 * Strictly prevents unauthorized access to internal Sri Sennamal Finance operations.
 */
export function isAuthorizedOwner(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  const configuredOwner = (import.meta.env.VITE_OWNER_EMAIL || DESIGNATED_OWNER_EMAIL).trim().toLowerCase();
  return normalized === configuredOwner || normalized === DESIGNATED_OWNER_EMAIL.toLowerCase();
}

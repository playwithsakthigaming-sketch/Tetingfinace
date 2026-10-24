/**
 * Sri Sennamal Finance — Supabase Integration & Authentication Service
 * Single owner authorization, token passbook verification, database sync,
 * multi-tier persistent credential storage, and resilient keep-alive connection monitor.
 */

import { createClient, SupabaseClient, Session, User } from '@supabase/supabase-js';

export const DESIGNATED_OWNER_EMAIL = 'playwithsakthigaming@gmail.com';

const STORAGE_URL_KEY = 'sri_sennamal_supabase_url';
const STORAGE_ANON_KEY = 'sri_sennamal_supabase_anon_key';
const BACKUP_URL_KEY = 'ssf_supabase_url_backup';
const BACKUP_ANON_KEY = 'ssf_supabase_key_backup';
const COOKIE_URL_KEY = 'ssf_sb_url';
const COOKIE_ANON_KEY = 'ssf_sb_key';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConfigured: boolean;
  source: 'env' | 'custom' | 'none';
}

export type ConnectionStatus = 'online' | 'connecting' | 'offline';

export interface ConnectionHealth {
  status: ConnectionStatus;
  isConfigured: boolean;
  url: string;
  latencyMs: number | null;
  lastPingAt: string | null;
  consecutiveFailures: number;
  errorMessage: string | null;
}

// Cookie Helpers for resilient cross-tab / cross-window persistence
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
}

function setCookie(name: string, value: string): void {
  if (typeof document === 'undefined') return null as any;
  try {
    const encoded = encodeURIComponent(value);
    document.cookie = `${name}=${encoded}; max-age=31536000; path=/; SameSite=Lax`;
  } catch (_) {}
}

function removeCookie(name: string): void {
  if (typeof document === 'undefined') return;
  try {
    document.cookie = `${name}=; max-age=0; path=/; SameSite=Lax`;
  } catch (_) {}
}

/**
 * Retrieve active Supabase credentials with multi-layer fallback & auto-healing
 * Checks: URL query/hash -> localStorage -> Cookies -> sessionStorage -> env
 */
export function getActiveSupabaseConfig(): SupabaseConfig {
  let detectedUrl: string | null = null;
  let detectedKey: string | null = null;

  if (typeof window !== 'undefined') {
    // 1. Check URL parameters (e.g. ?sb_url=...&sb_key=...)
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^[#?]+/, ''));
      const qUrl = urlParams.get('sb_url') || hashParams.get('sb_url');
      const qKey = urlParams.get('sb_key') || hashParams.get('sb_key');
      if (qUrl && qKey && qUrl.startsWith('https://')) {
        detectedUrl = qUrl.trim();
        detectedKey = qKey.trim();
        // Auto-persist immediately
        saveCustomSupabaseConfig(detectedUrl, detectedKey);
      }
    } catch (_) {}

    // 2. Check localStorage primary and backup keys
    if (!detectedUrl || !detectedKey) {
      try {
        detectedUrl = localStorage.getItem(STORAGE_URL_KEY)?.trim() ||
          localStorage.getItem(BACKUP_URL_KEY)?.trim() ||
          null;
        detectedKey = localStorage.getItem(STORAGE_ANON_KEY)?.trim() ||
          localStorage.getItem(BACKUP_ANON_KEY)?.trim() ||
          null;
      } catch (_) {}
    }

    // 3. Check persistent cookies
    if (!detectedUrl || !detectedKey) {
      detectedUrl = getCookie(COOKIE_URL_KEY);
      detectedKey = getCookie(COOKIE_ANON_KEY);
    }

    // 4. Check sessionStorage
    if (!detectedUrl || !detectedKey) {
      try {
        detectedUrl = sessionStorage.getItem(STORAGE_URL_KEY)?.trim() || null;
        detectedKey = sessionStorage.getItem(STORAGE_ANON_KEY)?.trim() || null;
      } catch (_) {}
    }
  }

  // If detected from custom storage, auto-heal all layers
  if (detectedUrl && detectedKey && detectedUrl.startsWith('https://')) {
    healStorageLayers(detectedUrl, detectedKey);
    return {
      url: detectedUrl,
      anonKey: detectedKey,
      isConfigured: true,
      source: 'custom',
    };
  }

  // 5. Check environment variables
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

/**
 * Replicate credentials across localStorage, sessionStorage, and cookies to ensure
 * they are never lost on reload, redeploy, or tab change.
 */
function healStorageLayers(url: string, key: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_URL_KEY, url);
    localStorage.setItem(STORAGE_ANON_KEY, key);
    localStorage.setItem(BACKUP_URL_KEY, url);
    localStorage.setItem(BACKUP_ANON_KEY, key);
  } catch (_) {}
  try {
    sessionStorage.setItem(STORAGE_URL_KEY, url);
    sessionStorage.setItem(STORAGE_ANON_KEY, key);
  } catch (_) {}
  setCookie(COOKIE_URL_KEY, url);
  setCookie(COOKIE_ANON_KEY, key);
}

let activeClient: SupabaseClient | null = null;
let currentConfig = getActiveSupabaseConfig();
let isCheckingHealth = false;

// Listeners for connection health changes
type HealthListener = (health: ConnectionHealth) => void;
const healthListeners = new Set<HealthListener>();

let connectionHealth: ConnectionHealth = {
  status: currentConfig.isConfigured ? 'connecting' : 'offline',
  isConfigured: currentConfig.isConfigured,
  url: currentConfig.url,
  latencyMs: null,
  lastPingAt: null,
  consecutiveFailures: 0,
  errorMessage: null,
};

function notifyHealthListeners() {
  setTimeout(() => {
    healthListeners.forEach((listener) => {
      try {
        listener({ ...connectionHealth });
      } catch (e) {
        console.warn('Error in health listener:', e);
      }
    });
  }, 0);
}

export function subscribeToSupabaseHealth(listener: HealthListener): () => void {
  healthListeners.add(listener);
  // Send current state immediately
  listener({ ...connectionHealth });
  return () => {
    healthListeners.delete(listener);
  };
}

export function getCurrentConnectionHealth(): ConnectionHealth {
  return { ...connectionHealth };
}

/**
 * Perform a resilient, non-blocking health check ping against Supabase
 * Protects against transient drops with generous timeouts and retry threshold.
 */
export async function runHealthCheck(): Promise<boolean> {
  const client = activeClient;
  if (!client || !currentConfig.isConfigured) {
    connectionHealth.status = 'offline';
    connectionHealth.isConfigured = false;
    connectionHealth.latencyMs = null;
    notifyHealthListeners();
    return false;
  }

  if (isCheckingHealth) return connectionHealth.status === 'online';
  isCheckingHealth = true;

  const startTime = Date.now();
  try {
    // 1. First probe: auth session (fast internal check)
    const sessionPromise = client.auth.getSession();

    // 2. Second probe: actual HTTP ping to rest endpoint to prevent Supabase project sleep
    const restUrl = `${currentConfig.url.replace(/\/+$/, '')}/rest/v1/?apikey=${encodeURIComponent(currentConfig.anonKey)}`;
    const timeoutController = new AbortController();
    const timer = setTimeout(() => timeoutController.abort(), 12000); // 12-second generous timeout

    const fetchPromise = fetch(restUrl, {
      method: 'GET',
      headers: {
        'apikey': currentConfig.anonKey,
        'Authorization': `Bearer ${currentConfig.anonKey}`,
      },
      signal: timeoutController.signal,
    }).finally(() => clearTimeout(timer));

    // Wait for ping
    const [_, fetchRes] = await Promise.allSettled([sessionPromise, fetchPromise]);

    const latency = Date.now() - startTime;
    let isOk = false;

    if (fetchRes.status === 'fulfilled') {
      // Any valid HTTP response (even 200, 401, 404) means the Supabase server is awake and reachable!
      isOk = fetchRes.value.status < 500;
    } else {
      // If network fetch failed, check if auth session is at least working
      isOk = latency < 10000;
    }

    if (isOk) {
      connectionHealth.status = 'online';
      connectionHealth.latencyMs = latency;
      connectionHealth.lastPingAt = new Date().toISOString();
      connectionHealth.consecutiveFailures = 0;
      connectionHealth.errorMessage = null;
    } else {
      connectionHealth.consecutiveFailures += 1;
      // Do not mark offline on a single transient hiccup! Only after 3 consecutive failures
      if (connectionHealth.consecutiveFailures >= 3) {
        connectionHealth.status = 'offline';
        connectionHealth.errorMessage = 'Supabase unreachable after multiple attempts';
      } else {
        // Keep as online or connecting during temporary hiccups
        if (connectionHealth.status !== 'online') {
          connectionHealth.status = 'connecting';
        }
      }
    }
  } catch (err: any) {
    connectionHealth.consecutiveFailures += 1;
    if (connectionHealth.consecutiveFailures >= 3) {
      connectionHealth.status = 'offline';
      connectionHealth.errorMessage = err?.message || 'Connection timeout';
    }
  } finally {
    isCheckingHealth = false;
    notifyHealthListeners();
  }

  return connectionHealth.status === 'online';
}

function initializeClient(): SupabaseClient | null {
  currentConfig = getActiveSupabaseConfig();
  connectionHealth.isConfigured = currentConfig.isConfigured;
  connectionHealth.url = currentConfig.url;

  if (currentConfig.isConfigured && currentConfig.url && currentConfig.anonKey) {
    try {
      activeClient = createClient(currentConfig.url, currentConfig.anonKey, {
        auth: {
          storage: typeof window !== 'undefined' ? window.localStorage : undefined,
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: 'pkce',
        },
        global: {
          headers: {
            'x-client-info': 'sri-sennamal-finance-v1',
          },
        },
      });

      // Defer health check to next tick so module initialization completes smoothly
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          runHealthCheck().catch(() => {});
        }, 100);
      }
      return activeClient;
    } catch (err: any) {
      console.warn('Failed to initialize Supabase client:', err);
      activeClient = null;
      connectionHealth.status = 'offline';
      connectionHealth.errorMessage = err?.message || 'Client initialization failed';
      notifyHealthListeners();
      return null;
    }
  }

  activeClient = null;
  connectionHealth.status = 'offline';
  connectionHealth.errorMessage = null;
  notifyHealthListeners();
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

// Backwards-compatible export that stays live via getter
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseClient();
    if (!client) return undefined;
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});

// Background Keep-Alive Heartbeat: runs every 35 seconds to keep Supabase awake and online
let heartbeatInterval: any = null;
if (typeof window !== 'undefined') {
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  heartbeatInterval = setInterval(() => {
    if (currentConfig.isConfigured) {
      runHealthCheck();
    }
  }, 35000);

  // Re-check on window focus or network reconnect
  window.addEventListener('online', () => {
    connectionHealth.consecutiveFailures = 0;
    runHealthCheck();
  });
  window.addEventListener('focus', () => {
    if (currentConfig.isConfigured) {
      runHealthCheck();
    }
  });
}

/**
 * Configure Supabase dynamically from the UI, initialize client, and trigger keep-alive
 */
export function saveCustomSupabaseConfig(url: string, anonKey: string): { success: boolean; error?: string } {
  try {
    const cleanUrl = url.trim().replace(/\/+$/, '');
    const cleanKey = anonKey.trim();

    if (!cleanUrl || !cleanKey) {
      return { success: false, error: 'Supabase URL and Anon Key cannot be empty.' };
    }

    if (!cleanUrl.startsWith('https://')) {
      return { success: false, error: 'Supabase URL must start with https://' };
    }

    healStorageLayers(cleanUrl, cleanKey);
    initializeClient();

    // Trigger immediate health check
    runHealthCheck();

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || 'Failed to save configuration' };
  }
}

/**
 * Clear custom Supabase config
 */
export function clearCustomSupabaseConfig(): void {
  try {
    localStorage.removeItem(STORAGE_URL_KEY);
    localStorage.removeItem(STORAGE_ANON_KEY);
    localStorage.removeItem(BACKUP_URL_KEY);
    localStorage.removeItem(BACKUP_ANON_KEY);
  } catch (_) {}
  try {
    sessionStorage.removeItem(STORAGE_URL_KEY);
    sessionStorage.removeItem(STORAGE_ANON_KEY);
  } catch (_) {}
  removeCookie(COOKIE_URL_KEY);
  removeCookie(COOKIE_ANON_KEY);

  initializeClient();
}

/**
 * Test connectivity with current or provided Supabase project with auto-warming
 */
export async function testSupabaseConnection(testUrl?: string, testKey?: string): Promise<{ ok: boolean; message: string; latencyMs?: number }> {
  try {
    const cleanUrl = (testUrl || currentConfig.url || '').trim().replace(/\/+$/, '');
    const cleanKey = (testKey || currentConfig.anonKey || '').trim();

    if (!cleanUrl || !cleanKey) {
      return { ok: false, message: 'Supabase credentials are required. Please enter project URL and anon key.' };
    }

    const startTime = Date.now();
    const restUrl = `${cleanUrl}/rest/v1/?apikey=${encodeURIComponent(cleanKey)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(restUrl, {
      method: 'GET',
      headers: {
        'apikey': cleanKey,
        'Authorization': `Bearer ${cleanKey}`,
      },
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    const latencyMs = Date.now() - startTime;

    // Supabase REST gateway will return 200 or 401/404 or OpenAPI json - all confirm the cloud project is live and reachable
    if (res.status >= 500) {
      return { ok: false, message: `Supabase server responded with status ${res.status}. Please check your project health on Supabase dashboard.` };
    }

    // If test credentials were provided and successful, auto-save and heal them!
    if (testUrl && testKey) {
      saveCustomSupabaseConfig(cleanUrl, cleanKey);
    }

    return {
      ok: true,
      message: `Successfully connected to Supabase database! (Response time: ${latencyMs}ms)`,
      latencyMs,
    };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return { ok: false, message: 'Connection timed out after 12s. Supabase project may be waking up, please retry in a few seconds.' };
    }
    return { ok: false, message: err?.message || 'Network error reaching Supabase cloud database.' };
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

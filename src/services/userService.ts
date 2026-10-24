/**
 * Sri Sennamal Finance — User Management, Profiles & Role-Based Access Control (RBAC)
 * Supports Admin, Manager, and Collection Team roles with Supabase cloud synchronization.
 * Handles profile avatar updates (GIF, PNG, JPG up to 10MB), phone numbers, and password updates.
 */

import { UserProfile, UserRole, ROLE_PERMISSIONS, RolePermissions } from '../types/finance';
import { getSupabaseClient, DESIGNATED_OWNER_EMAIL } from './supabase';

const STORAGE_KEY = 'ssf_user_profiles_v1';

// Initial Seeds
const DEFAULT_PROFILES: UserProfile[] = [
  {
    id: 'user-admin-01',
    email: DESIGNATED_OWNER_EMAIL,
    displayName: 'Sakthi (Owner)',
    phone: '7812834522',
    role: 'admin',
    isActive: true,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-10-24T00:00:00.000Z',
  },
  {
    id: 'user-mgr-01',
    email: 'manager@srisennamal.com',
    displayName: 'M. Anand (Branch Manager)',
    phone: '9842100099',
    role: 'manager',
    isActive: true,
    createdAt: '2026-09-10T00:00:00.000Z',
    updatedAt: '2026-10-24T00:00:00.000Z',
  },
  {
    id: 'user-coll-01',
    email: 'collection1@srisennamal.com',
    displayName: 'K. Vignesh (Collection Agent)',
    phone: '9842100088',
    role: 'collection_team',
    isActive: true,
    createdAt: '2026-09-15T00:00:00.000Z',
    updatedAt: '2026-10-24T00:00:00.000Z',
  },
];

type ProfileListener = () => void;
const profileListeners = new Set<ProfileListener>();

function notifyListeners() {
  // Asynchronously dispatch to avoid calling setState on mounted components
  // during another component's render phase
  setTimeout(() => {
    profileListeners.forEach((fn) => {
      try {
        fn();
      } catch (e) {
        console.warn('Error in profile listener:', e);
      }
    });
  }, 0);
}

export class UserService {
  private profiles: UserProfile[] = [];

  constructor() {
    this.profiles = this.loadProfiles();
  }

  private loadProfiles(): UserProfile[] {
    if (typeof window === 'undefined') return DEFAULT_PROFILES;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: UserProfile[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Ensure designated owner is always present as admin
          const hasOwner = parsed.some(
            (p) => p.email.toLowerCase() === DESIGNATED_OWNER_EMAIL.toLowerCase()
          );
          if (!hasOwner) {
            parsed.unshift(DEFAULT_PROFILES[0]);
          }
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read user profiles from localStorage:', e);
    }
    return [...DEFAULT_PROFILES];
  }

  private persistProfiles(notify = true): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.profiles));
      if (notify) {
        notifyListeners();
      }
    } catch (e) {
      console.warn('Failed to persist user profiles:', e);
    }
  }

  public getAllProfiles(): UserProfile[] {
    return [...this.profiles];
  }

  /**
   * Find profile by email, or auto-create a default profile if user was added directly in Supabase
   */
  public getProfileByEmail(email: string | null | undefined): UserProfile {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
      return this.profiles[0] || DEFAULT_PROFILES[0];
    }

    const found = this.profiles.find((p) => p.email.toLowerCase() === cleanEmail);
    if (found) {
      return found;
    }

    // Auto-register new Supabase user
    const isOwner = cleanEmail === DESIGNATED_OWNER_EMAIL.toLowerCase();
    const newProfile: UserProfile = {
      id: `user-${Date.now()}`,
      email: cleanEmail,
      displayName: cleanEmail.split('@')[0].toUpperCase(),
      phone: '',
      role: isOwner ? 'admin' : 'collection_team',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.profiles.push(newProfile);
    this.persistProfiles(false);
    return newProfile;
  }

  /**
   * Get permissions for a specific role
   */
  public getRolePermissions(role: UserRole): RolePermissions {
    return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.collection_team;
  }

  /**
   * Check if an email has a specific permission
   */
  public hasPermission(email: string | null | undefined, permission: keyof RolePermissions): boolean {
    const profile = this.getProfileByEmail(email);
    const permissions = this.getRolePermissions(profile.role);
    return !!permissions[permission];
  }

  /**
   * Save updates to a user profile
   */
  public async saveProfile(
    email: string,
    updates: Partial<Omit<UserProfile, 'id' | 'email' | 'createdAt'>>
  ): Promise<{ success: boolean; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    let index = this.profiles.findIndex((p) => p.email.toLowerCase() === cleanEmail);

    if (index === -1) {
      this.getProfileByEmail(cleanEmail);
      index = this.profiles.findIndex((p) => p.email.toLowerCase() === cleanEmail);
    }

    if (index === -1) {
      return { success: false, error: 'User profile not found.' };
    }

    this.profiles[index] = {
      ...this.profiles[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.persistProfiles();

    // Sync to Supabase auth metadata and public.user_profiles if connected
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data: { session } } = await client.auth.getSession();
        // If updating currently logged in user, update Supabase user metadata
        if (session?.user?.email?.toLowerCase() === cleanEmail) {
          await client.auth.updateUser({
            data: {
              display_name: updates.displayName || this.profiles[index].displayName,
              phone: updates.phone || this.profiles[index].phone,
              avatar_url: updates.avatarUrl !== undefined ? updates.avatarUrl : this.profiles[index].avatarUrl,
              role: updates.role || this.profiles[index].role,
            },
          });
        }

        // Also upsert to public.user_profiles table in Supabase
        await client.from('user_profiles').upsert(
          {
            email: cleanEmail,
            display_name: this.profiles[index].displayName,
            phone: this.profiles[index].phone,
            avatar_url: this.profiles[index].avatarUrl || null,
            role: this.profiles[index].role,
            is_active: this.profiles[index].isActive,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'email' }
        );
      } catch (err) {
        console.warn('Note: Could not upsert to Supabase user_profiles table (table may not exist yet):', err);
      }
    }

    return { success: true };
  }

  /**
   * Sync user profiles with Supabase cloud database
   */
  public async syncWithSupabase(): Promise<{
    success: boolean;
    syncedCount: number;
    message: string;
    details?: string;
  }> {
    const client = getSupabaseClient();
    if (!client) {
      return {
        success: false,
        syncedCount: 0,
        message: 'Supabase is not configured or offline. Operating in local storage mode.',
      };
    }

    try {
      // 1. Fetch from public.user_profiles in Supabase
      const { data, error } = await client
        .from('user_profiles')
        .select('*');

      if (error) {
        // Table might not exist yet; try creating initial profile from current session
        const { data: { session } } = await client.auth.getSession();
        if (session?.user?.email) {
          const userMeta = session.user.user_metadata || {};
          const currentProfile = this.getProfileByEmail(session.user.email);
          if (userMeta.role) currentProfile.role = userMeta.role;
          if (userMeta.display_name) currentProfile.displayName = userMeta.display_name;
          if (userMeta.phone) currentProfile.phone = userMeta.phone;
          if (userMeta.avatar_url) currentProfile.avatarUrl = userMeta.avatar_url;
          this.persistProfiles();
        }

        return {
          success: true,
          syncedCount: this.profiles.length,
          message: `Local users verified (${this.profiles.length} active). Note: Run the SQL migration in Supabase to enable cloud team sync.`,
          details: error.message,
        };
      }

      if (Array.isArray(data) && data.length > 0) {
        let newCount = 0;
        data.forEach((remoteUser: any) => {
          const rEmail = (remoteUser.email || '').trim().toLowerCase();
          if (!rEmail) return;

          const existingIndex = this.profiles.findIndex(
            (p) => p.email.toLowerCase() === rEmail
          );

          const mapped: UserProfile = {
            id: remoteUser.id || `user-sb-${rEmail}`,
            email: rEmail,
            displayName: remoteUser.display_name || remoteUser.full_name || rEmail.split('@')[0],
            phone: remoteUser.phone || '',
            avatarUrl: remoteUser.avatar_url || undefined,
            role: (remoteUser.role as UserRole) || 'collection_team',
            isActive: remoteUser.is_active !== false,
            createdAt: remoteUser.created_at || new Date().toISOString(),
            updatedAt: remoteUser.updated_at || new Date().toISOString(),
          };

          if (existingIndex >= 0) {
            this.profiles[existingIndex] = {
              ...this.profiles[existingIndex],
              ...mapped,
            };
          } else {
            this.profiles.push(mapped);
            newCount++;
          }
        });

        this.persistProfiles();

        return {
          success: true,
          syncedCount: data.length,
          message: `Successfully synced ${data.length} users from Supabase cloud database! (${newCount} new added)`,
        };
      }

      // If remote table is empty, upload current local profiles to Supabase
      const rowsToInsert = this.profiles.map((p) => ({
        email: p.email,
        display_name: p.displayName,
        phone: p.phone,
        avatar_url: p.avatarUrl || null,
        role: p.role,
        is_active: p.isActive,
      }));

      await client.from('user_profiles').upsert(rowsToInsert, { onConflict: 'email' });

      return {
        success: true,
        syncedCount: this.profiles.length,
        message: `Synced and initialized ${this.profiles.length} user roles in Supabase cloud database!`,
      };
    } catch (err: any) {
      return {
        success: false,
        syncedCount: 0,
        message: err?.message || 'Error connecting to Supabase user directory.',
      };
    }
  }

  /**
   * Change password directly through Supabase Auth
   */
  public async changePassword(newPassword: string): Promise<{ success: boolean; message: string }> {
    if (!newPassword || newPassword.length < 6) {
      return {
        success: false,
        message: 'Password must be at least 6 characters long.',
      };
    }

    const client = getSupabaseClient();
    if (!client) {
      return {
        success: false,
        message: 'Supabase cloud client is not active. Connect Supabase in Settings first.',
      };
    }

    try {
      const { data, error } = await client.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return {
          success: false,
          message: error.message || 'Failed to update password in Supabase.',
        };
      }

      return {
        success: true,
        message: 'Password successfully changed! Your new credentials are active.',
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'Unexpected network error updating password.',
      };
    }
  }

  /**
   * Add a new team member
   */
  public async addNewMember(
    email: string,
    displayName: string,
    role: UserRole,
    phone: string
  ): Promise<{ success: boolean; message: string; profile?: UserProfile }> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, message: 'Valid email address is required.' };
    }

    const exists = this.profiles.some((p) => p.email.toLowerCase() === cleanEmail);
    if (exists) {
      return { success: false, message: 'A team member with this email already exists.' };
    }

    const newProfile: UserProfile = {
      id: `user-${Date.now()}`,
      email: cleanEmail,
      displayName: displayName.trim() || cleanEmail.split('@')[0],
      phone: phone.trim(),
      role,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.profiles.push(newProfile);
    this.persistProfiles();

    // Push to Supabase if reachable
    const client = getSupabaseClient();
    if (client) {
      try {
        await client.from('user_profiles').upsert({
          email: newProfile.email,
          display_name: newProfile.displayName,
          phone: newProfile.phone,
          role: newProfile.role,
          is_active: newProfile.isActive,
        });
      } catch (_) {}
    }

    return {
      success: true,
      message: `User ${cleanEmail} added with role [${role}]!`,
      profile: newProfile,
    };
  }

  /**
   * Delete a team member
   */
  public deleteMember(email: string): { success: boolean; message: string } {
    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail === DESIGNATED_OWNER_EMAIL.toLowerCase()) {
      return { success: false, message: 'Cannot delete the designated business owner account.' };
    }

    this.profiles = this.profiles.filter((p) => p.email.toLowerCase() !== cleanEmail);
    this.persistProfiles();

    const client = getSupabaseClient();
    if (client) {
      try {
        client.from('user_profiles').delete().eq('email', cleanEmail).then(() => {});
      } catch (_) {}
    }

    return { success: true, message: `Removed member ${cleanEmail}.` };
  }
}

// Global Singleton
export const userService = new UserService();

export function subscribeToUserProfiles(listener: ProfileListener): () => void {
  profileListeners.add(listener);
  return () => profileListeners.delete(listener);
}

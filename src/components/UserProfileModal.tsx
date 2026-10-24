/**
 * Sri Sennamal Finance — User Profile Modal
 * Profile photo change (supports GIF, PNG, JPG up to 10MB maximum),
 * change password, update phone number, display name, and inspect active role permissions.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  User,
  Camera,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Shield,
  Save,
  Trash2,
  Upload,
  Sparkles,
} from 'lucide-react';
import { UserProfile, UserRole, ROLE_LABELS, ROLE_PERMISSIONS } from '../types/finance';
import { userService } from '../services/userService';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail: string | null;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUserEmail,
}) => {
  const [profile, setProfile] = useState<UserProfile>(() =>
    userService.getProfileByEmail(currentUserEmail)
  );

  // Form states
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [phone, setPhone] = useState(profile.phone);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(profile.avatarUrl);
  
  // Password change states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  // Profile save feedback
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  // Active Tab: 'details' or 'security'
  const [activeTab, setActiveTab] = useState<'details' | 'security'>('details');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Re-sync when modal opens or email changes
  useEffect(() => {
    if (isOpen) {
      const p = userService.getProfileByEmail(currentUserEmail);
      setProfile(p);
      setDisplayName(p.displayName);
      setPhone(p.phone);
      setAvatarUrl(p.avatarUrl);
      setPasswordFeedback(null);
      setProfileFeedback(null);
      setNewPassword('');
      setConfirmPassword('');
    }
  }, [isOpen, currentUserEmail]);

  if (!isOpen) return null;

  // Maximum file size: 10 MB = 10 * 1024 * 1024 bytes
  const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate mime type: gif, png, jpg, jpeg, webp
    const validTypes = ['image/gif', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase()) && !file.name.match(/\.(gif|png|jpe?g|webp)$/i)) {
      setProfileFeedback({
        ok: false,
        message: 'Unsupported format. Please upload a GIF, PNG, or JPG file.',
      });
      return;
    }

    // Validate file size up to 10MB maximum
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      setProfileFeedback({
        ok: false,
        message: `File size exceeds 10MB limit (Selected file: ${sizeMb} MB). Please choose an image or GIF under 10MB.`,
      });
      return;
    }

    // Read and encode as Data URL
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setAvatarUrl(result);
        setProfileFeedback({
          ok: true,
          message: `Photo loaded (${(file.size / (1024 * 1024)).toFixed(2)} MB). Click "Save Profile Changes" to confirm.`,
        });
      }
    };
    reader.onerror = () => {
      setProfileFeedback({
        ok: false,
        message: 'Could not read image file. Please try another image.',
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileFeedback(null);

    try {
      const res = await userService.saveProfile(profile.email, {
        displayName: displayName.trim(),
        phone: phone.trim(),
        avatarUrl: avatarUrl,
      });

      if (res.success) {
        setProfileFeedback({
          ok: true,
          message: 'Profile information updated and synced successfully!',
        });
        setTimeout(() => setProfileFeedback(null), 4000);
      } else {
        setProfileFeedback({
          ok: false,
          message: res.error || 'Failed to update profile.',
        });
      }
    } catch (err: any) {
      setProfileFeedback({
        ok: false,
        message: err?.message || 'Error saving profile.',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);

    if (newPassword.length < 6) {
      setPasswordFeedback({
        ok: false,
        message: 'New password must be at least 6 characters.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordFeedback({
        ok: false,
        message: 'Passwords do not match. Please re-enter identical passwords.',
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await userService.changePassword(newPassword);
      setPasswordFeedback({
        ok: res.success,
        message: res.message,
      });
      if (res.success) {
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setPasswordFeedback({
        ok: false,
        message: err?.message || 'Error changing password.',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const roleInfo = ROLE_LABELS[profile.role] || ROLE_LABELS.collection_team;
  const permissions = ROLE_PERMISSIONS[profile.role] || ROLE_PERMISSIONS.collection_team;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
      <div
        className="w-full max-w-xl bg-[#090e1a] border border-cyan-500/40 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#070b14]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/70 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">
                User Profile & Account
              </h3>
              <p className="text-[11px] text-slate-400">
                Manage personal profile, avatar, credentials, and permissions
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 text-xs px-5">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-3 px-4 font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'details'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Profile & Avatar
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`py-3 px-4 font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'security'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Security & Password
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          
          {/* TAB 1: PROFILE & AVATAR */}
          {activeTab === 'details' && (
            <form onSubmit={handleSaveProfile} className="space-y-5 text-xs">
              
              {/* Profile Avatar Banner */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-center gap-4">
                {/* Circular Avatar Preview */}
                <div className="relative group shrink-0">
                  <div className="w-20 h-20 rounded-full border-2 border-cyan-400/60 overflow-hidden bg-slate-950 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.25)]">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Profile Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900 to-indigo-950 text-cyan-300 font-bold text-2xl uppercase">
                        {(displayName || profile.email).charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* Camera overlay button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                    title="Change Profile Photo"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                </div>

                {/* Avatar Info & Controls */}
                <div className="flex-1 text-center sm:text-left space-y-1.5">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <span className="font-bold text-sm text-white">{displayName || profile.email}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${roleInfo.badgeColor}`}>
                      {roleInfo.en} · {roleInfo.ta}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Supports <strong>GIF, PNG, JPG</strong> up to <strong>10MB maximum</strong>. Animated GIFs are fully supported!
                  </p>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleAvatarFileChange}
                      accept="image/gif,image/png,image/jpeg,image/jpg,image/webp"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/60 transition-colors flex items-center gap-1.5 font-medium cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload New Image / GIF</span>
                    </button>

                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setAvatarUrl(undefined);
                          setProfileFeedback({
                            ok: true,
                            message: 'Photo removed. Click "Save Profile Changes" to confirm.',
                          });
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-rose-300 hover:border-rose-500/40 transition-colors flex items-center gap-1 cursor-pointer"
                        title="Remove custom avatar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Feedback Alert */}
              {profileFeedback && (
                <div
                  className={`p-3 rounded-xl border flex items-start gap-2 ${
                    profileFeedback.ok
                      ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                  }`}
                >
                  {profileFeedback.ok ? (
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <span>{profileFeedback.message}</span>
                </div>
              )}

              {/* Editable Fields */}
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Display Name (முழு பெயர்)
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Sakthi or Anand M"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Phone Number (தொலைபேசி எண்)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 7812834522 or 9842100001"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-cyan-400 focus:outline-none font-mono"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Used for staff identification and SMS collection reports.
                  </span>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Email Address (மின்னஞ்சல் முகவரி)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      disabled
                      value={profile.email}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 cursor-not-allowed font-mono"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Primary Supabase authentication ID. Cannot be modified directly.
                  </span>
                </div>
              </div>

              {/* Role & Permissions Breakdown Card */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-cyan-400" />
                    Assigned Role & Access Level
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${roleInfo.badgeColor}`}>
                    {roleInfo.en}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5 pt-2 text-[11px]">
                  <div className={`flex items-center gap-1.5 ${permissions.canCollectDues ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {permissions.canCollectDues ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    <span>Collect Dues & Receipts</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${permissions.canManageCustomers ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {permissions.canManageCustomers ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    <span>Customer Registry</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${permissions.canCreateLoan ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {permissions.canCreateLoan ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    <span>Create & Disburse Loans</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${permissions.canIssueRefunds ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {permissions.canIssueRefunds ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    <span>Issue Refunds</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${permissions.canViewFinancialReports ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {permissions.canViewFinancialReports ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    <span>Financial Reports</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${permissions.canManageSettings ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {permissions.canManageSettings ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    <span>Settings & Cloud Sync</span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingProfile ? 'Saving...' : 'Save Profile Changes'}</span>
                </button>
              </div>

            </form>
          )}

          {/* TAB 2: SECURITY & PASSWORD */}
          {activeTab === 'security' && (
            <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="font-semibold text-slate-200 block mb-1">
                  Change Account Password (கடவுச்சொல் மாற்றம்)
                </span>
                <p className="text-[11px] text-slate-400">
                  Update your Supabase authentication password directly. You will remain logged in on this browser.
                </p>
              </div>

              {passwordFeedback && (
                <div
                  className={`p-3 rounded-xl border flex items-start gap-2 ${
                    passwordFeedback.ok
                      ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                  }`}
                >
                  {passwordFeedback.ok ? (
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <span>{passwordFeedback.message}</span>
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  New Password (புதிய கடவுச்சொல்) *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter at least 6 characters"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-cyan-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Confirm New Password (கடவுச்சொல்லை மீண்டும் உள்ளிடவும்) *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter identical password"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/20 text-[11px] text-amber-300/90 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Tip: Choose a strong password. This password will be immediately effective for all future logins on any device.
                </span>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isChangingPassword || !newPassword || !confirmPassword}
                  className="px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all cursor-pointer disabled:opacity-50"
                >
                  <Lock className="w-4 h-4" />
                  <span>{isChangingPassword ? 'Updating Password...' : 'Update Password'}</span>
                </button>
              </div>

            </form>
          )}

        </div>

      </div>
    </div>
  );
};

import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Phone, Globe, Clock, Palette, Camera, Trash2, Eye, EyeOff, Lock, CheckCircle2, Settings } from 'lucide-react';
import { useMe, useUpdateProfile, useChangePassword, useUploadAvatar, useDeleteAvatar, getErrorMessage, } from '@/hooks/useAuth';
import { LoadingButton } from '@/components/common/LoadingButton';
import { Spinner } from '@/components/common/LoadingButton';
// ─── Profile Schema ───────────────────────────────────────────────────────────
const profileSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional(),
    currency: z.string().optional(),
    timezone: z.string().optional(),
    theme: z.enum(['light', 'dark', 'system']).optional(),
});
// ─── Password Schema ──────────────────────────────────────────────────────────
const passwordSchema = z
    .object({
    current_password: z.string().min(1, 'Current password is required'),
    password: z.string().min(8, 'New password must be at least 8 characters'),
    password_confirmation: z.string().min(1, 'Please confirm your password'),
})
    .refine((d) => d.password === d.password_confirmation, {
    message: 'Passwords do not match',
    path: ['password_confirmation'],
});
// ─── Common currencies ───────────────────────────────────────────────────────
const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'IDR', 'SGD', 'AUD', 'CAD', 'INR', 'CNY'];
const timezones = ['UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London',
    'Europe/Paris', 'Asia/Tokyo', 'Asia/Singapore', 'Asia/Jakarta',
    'Australia/Sydney', 'Pacific/Auckland'];
// ─── Avatar Section ───────────────────────────────────────────────────────────
function AvatarSection() {
    const { data: user } = useMe();
    const uploadAvatar = useUploadAvatar();
    const deleteAvatar = useDeleteAvatar();
    const fileInputRef = useRef(null);
    const [avatarError, setAvatarError] = useState(null);
    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        setAvatarError(null);
        const maxSize = 2 * 1024 * 1024; // 2MB
        if (file.size > maxSize) {
            setAvatarError('File size must not exceed 2MB.');
            return;
        }
        if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
            setAvatarError('Only JPG, PNG, and WebP images are allowed.');
            return;
        }
        try {
            await uploadAvatar.mutateAsync(file);
        }
        catch (err) {
            setAvatarError(getErrorMessage(err));
        }
    };
    const initials = user?.name
        ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
        : 'U';
    return (<div className="flex flex-col sm:flex-row items-center gap-6">
      {/* Avatar display */}
      <div className="relative group flex-shrink-0">
        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary-500/30 bg-brand-dark flex items-center justify-center">
          {user?.avatar_url ? (<img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover"/>) : (<span className="text-2xl font-bold text-white">{initials}</span>)}
        </div>
        {/* Upload overlay */}
        <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" disabled={uploadAvatar.isPending} aria-label="Upload avatar">
          {uploadAvatar.isPending ? (<Spinner size={20} className="text-white"/>) : (<Camera size={22} className="text-white"/>)}
        </button>
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden" onChange={handleFileChange}/>
      </div>

      {/* Avatar info & actions */}
      <div className="text-center sm:text-left">
        <h3 className="font-semibold text-foreground">{user?.name ?? 'Your Name'}</h3>
        <p className="text-muted-foreground text-sm mb-3">{user?.email}</p>
        <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
          <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-secondary text-sm px-4 py-1.5 flex items-center gap-1.5" disabled={uploadAvatar.isPending}>
            <Camera size={14}/>
            Change Photo
          </button>
          {user?.avatar_url && (<button type="button" onClick={() => deleteAvatar.mutate()} className="btn-danger text-sm px-4 py-1.5 flex items-center gap-1.5" disabled={deleteAvatar.isPending}>
              <Trash2 size={14}/>
              Remove
            </button>)}
        </div>
        {avatarError && <p className="text-destructive text-xs mt-2">{avatarError}</p>}
        <p className="text-muted-foreground text-xs mt-2">JPG, PNG, WebP — max 2MB</p>
      </div>
    </div>);
}
// ─── Profile Form ─────────────────────────────────────────────────────────────
function ProfileForm() {
    const { data: user } = useMe();
    const updateProfile = useUpdateProfile();
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);
    const { register, handleSubmit, formState: { errors }, } = useForm({
        resolver: zodResolver(profileSchema),
        values: {
            name: user?.name ?? '',
            email: user?.email ?? '',
            phone: user?.phone ?? '',
            currency: user?.currency ?? 'USD',
            timezone: user?.timezone ?? 'UTC',
            theme: user?.theme ?? 'system',
        },
    });
    const onSubmit = async (data) => {
        setError(null);
        setSuccess(false);
        try {
            await updateProfile.mutateAsync(data);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 4000);
        }
        catch (err) {
            setError(getErrorMessage(err));
        }
    };
    return (<form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {success && (<div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle2 size={16}/>
          Profile updated successfully!
        </div>)}
      {error && (<div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>)}

      <div className="grid sm:grid-cols-2 gap-5">
        {/* Name */}
        <div>
          <label htmlFor="profile-name" className="finova-label">Full name</label>
          <div className="relative">
            <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
            <input id="profile-name" type="text" placeholder="John Doe" className={`finova-input pl-10 ${errors.name ? 'border-destructive' : ''}`} {...register('name')}/>
          </div>
          {errors.name && <p className="text-destructive text-xs mt-1">{errors.name.message}</p>}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="profile-email" className="finova-label">Email address</label>
          <div className="relative">
            <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
            <input id="profile-email" type="email" placeholder="you@example.com" className={`finova-input pl-10 ${errors.email ? 'border-destructive' : ''}`} {...register('email')}/>
          </div>
          {errors.email && <p className="text-destructive text-xs mt-1">{errors.email.message}</p>}
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="profile-phone" className="finova-label">Phone <span className="text-muted-foreground font-normal">(optional)</span></label>
          <div className="relative">
            <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
            <input id="profile-phone" type="tel" placeholder="+1 555 000 0000" className="finova-input pl-10" {...register('phone')}/>
          </div>
        </div>

        {/* Currency */}
        <div>
          <label htmlFor="profile-currency" className="finova-label">Currency</label>
          <div className="relative">
            <Globe size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
            <select id="profile-currency" className="finova-input pl-10 appearance-none cursor-pointer" {...register('currency')}>
              {currencies.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Timezone */}
        <div>
          <label htmlFor="profile-timezone" className="finova-label">Timezone</label>
          <div className="relative">
            <Clock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
            <select id="profile-timezone" className="finova-input pl-10 appearance-none cursor-pointer" {...register('timezone')}>
              {timezones.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
            </select>
          </div>
        </div>

        {/* Theme */}
        <div>
          <label htmlFor="profile-theme" className="finova-label">Theme preference</label>
          <div className="relative">
            <Palette size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
            <select id="profile-theme" className="finova-input pl-10 appearance-none cursor-pointer" {...register('theme')}>
              <option value="system">System Default</option>
              <option value="light">Light Mode</option>
              <option value="dark">Dark Mode</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <LoadingButton type="submit" loading={updateProfile.isPending} className="px-8">
          Save Changes
        </LoadingButton>
      </div>
    </form>);
}
// ─── Change Password Form ─────────────────────────────────────────────────────
function ChangePasswordForm() {
    const changePassword = useChangePassword();
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);
    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: zodResolver(passwordSchema),
    });
    const onSubmit = async (data) => {
        setError(null);
        setSuccess(false);
        try {
            await changePassword.mutateAsync(data);
            setSuccess(true);
            reset();
            setTimeout(() => setSuccess(false), 4000);
        }
        catch (err) {
            setError(getErrorMessage(err));
        }
    };
    return (<form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {success && (<div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle2 size={16}/>
          Password changed successfully!
        </div>)}
      {error && (<div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>)}

      {/* Current Password */}
      <div>
        <label htmlFor="cp-current" className="finova-label">Current password</label>
        <div className="relative">
          <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
          <input id="cp-current" type={showCurrent ? 'text' : 'password'} placeholder="Your current password" className={`finova-input pl-10 pr-10 ${errors.current_password ? 'border-destructive' : ''}`} {...register('current_password')}/>
          <button type="button" onClick={() => setShowCurrent(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" aria-label="Toggle">
            {showCurrent ? <EyeOff size={18}/> : <Eye size={18}/>}
          </button>
        </div>
        {errors.current_password && <p className="text-destructive text-xs mt-1">{errors.current_password.message}</p>}
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        {/* New Password */}
        <div>
          <label htmlFor="cp-new" className="finova-label">New password</label>
          <div className="relative">
            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
            <input id="cp-new" type={showNew ? 'text' : 'password'} placeholder="Min. 8 characters" className={`finova-input pl-10 pr-10 ${errors.password ? 'border-destructive' : ''}`} {...register('password')}/>
            <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" aria-label="Toggle">
              {showNew ? <EyeOff size={18}/> : <Eye size={18}/>}
            </button>
          </div>
          {errors.password && <p className="text-destructive text-xs mt-1">{errors.password.message}</p>}
        </div>

        {/* Confirm New Password */}
        <div>
          <label htmlFor="cp-confirm" className="finova-label">Confirm new password</label>
          <div className="relative">
            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
            <input id="cp-confirm" type={showConfirm ? 'text' : 'password'} placeholder="Repeat new password" className={`finova-input pl-10 pr-10 ${errors.password_confirmation ? 'border-destructive' : ''}`} {...register('password_confirmation')}/>
            <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" aria-label="Toggle">
              {showConfirm ? <EyeOff size={18}/> : <Eye size={18}/>}
            </button>
          </div>
          {errors.password_confirmation && <p className="text-destructive text-xs mt-1">{errors.password_confirmation.message}</p>}
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <LoadingButton type="submit" loading={changePassword.isPending} className="px-8">
          Change Password
        </LoadingButton>
      </div>
    </form>);
}
// ─── Main Profile Page ────────────────────────────────────────────────────────
export function ProfilePage() {
    const { isLoading } = useMe();
    if (isLoading) {
        return (<div className="flex items-center justify-center h-64">
        <Spinner size={32}/>
      </div>);
    }
    return (<div className="max-w-3xl mx-auto space-y-6 px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
          <Settings size={20} className="text-white"/>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Profile & Settings</h1>
          <p className="text-muted-foreground text-sm">Manage your personal information and preferences</p>
        </div>
      </div>

      {/* Avatar Card */}
      <div className="finova-card">
        <h2 className="text-base font-semibold text-foreground mb-5 flex items-center gap-2">
          <Camera size={18} className="text-primary-500"/>
          Profile Photo
        </h2>
        <AvatarSection />
      </div>

      {/* Profile Info Card */}
      <div className="finova-card">
        <h2 className="text-base font-semibold text-foreground mb-5 flex items-center gap-2">
          <User size={18} className="text-primary-500"/>
          Personal Information
        </h2>
        <ProfileForm />
      </div>

      {/* Change Password Card */}
      <div className="finova-card">
        <h2 className="text-base font-semibold text-foreground mb-5 flex items-center gap-2">
          <Lock size={18} className="text-primary-500"/>
          Change Password
        </h2>
        <ChangePasswordForm />
      </div>
    </div>);
}

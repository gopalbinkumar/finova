import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, User, Sparkles } from 'lucide-react';
import { getErrorMessage, useRegister } from '@/hooks/useAuth';
import { LoadingButton } from '@/components/common/LoadingButton';
const schema = z
    .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    password_confirmation: z.string().min(1, 'Please confirm your password'),
})
    .refine((d) => d.password === d.password_confirmation, {
    message: 'Passwords do not match',
    path: ['password_confirmation'],
});
export function RegisterPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [serverError, setServerError] = useState(null);
    const register_mutation = useRegister();
    const { register, handleSubmit, formState: { errors }, } = useForm({ resolver: zodResolver(schema) });
    const onSubmit = async (data) => {
        setServerError(null);
        try {
            await register_mutation.mutateAsync(data);
        }
        catch (err) {
            setServerError(getErrorMessage(err));
        }
    };
    return (<div className="finova-card auth-glow animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-primary mb-4 shadow-lg">
          <Sparkles size={28} className="text-white"/>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Join Finova and take control of your finances
        </p>
      </div>

      {/* Server error */}
      {serverError && (<div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm mb-6">
          {serverError}
        </div>)}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {/* Name */}
        <div>
          <label htmlFor="reg-name" className="finova-label">Full name</label>
          <div className="relative">
            <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
            <input id="reg-name" type="text" autoComplete="name" placeholder="John Doe" className={`finova-input pl-10 ${errors.name ? 'border-destructive' : ''}`} {...register('name')}/>
          </div>
          {errors.name && <p className="text-destructive text-xs mt-1">{errors.name.message}</p>}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="reg-email" className="finova-label">Email address</label>
          <div className="relative">
            <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
            <input id="reg-email" type="email" autoComplete="email" placeholder="you@example.com" className={`finova-input pl-10 ${errors.email ? 'border-destructive' : ''}`} {...register('email')}/>
          </div>
          {errors.email && <p className="text-destructive text-xs mt-1">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="reg-password" className="finova-label">Password</label>
          <div className="relative">
            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
            <input id="reg-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="Min. 8 characters" className={`finova-input pl-10 pr-10 ${errors.password ? 'border-destructive' : ''}`} {...register('password')}/>
            <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" aria-label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
            </button>
          </div>
          {errors.password && <p className="text-destructive text-xs mt-1">{errors.password.message}</p>}
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="reg-confirm" className="finova-label">Confirm password</label>
          <div className="relative">
            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
            <input id="reg-confirm" type={showConfirm ? 'text' : 'password'} autoComplete="new-password" placeholder="Repeat your password" className={`finova-input pl-10 pr-10 ${errors.password_confirmation ? 'border-destructive' : ''}`} {...register('password_confirmation')}/>
            <button type="button" onClick={() => setShowConfirm((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" aria-label={showConfirm ? 'Hide password' : 'Show password'}>
              {showConfirm ? <EyeOff size={18}/> : <Eye size={18}/>}
            </button>
          </div>
          {errors.password_confirmation && (<p className="text-destructive text-xs mt-1">{errors.password_confirmation.message}</p>)}
        </div>

        {/* Submit */}
        <LoadingButton type="submit" loading={register_mutation.isPending} fullWidth className="h-11 text-base">
          Create Account
        </LoadingButton>
      </form>

      <p className="text-center text-xs text-muted-foreground mt-4">
        By registering, you agree to our{' '}
        <a href="#" className="text-primary-500 hover:underline">Terms of Service</a>{' '}
        and{' '}
        <a href="#" className="text-primary-500 hover:underline">Privacy Policy</a>.
      </p>

      <p className="text-center text-sm text-muted-foreground mt-4">
        Already have an account?{' '}
        <Link to="/login" className="text-primary-500 hover:text-primary-600 font-semibold transition-colors">
          Sign in
        </Link>
      </p>
    </div>);
}

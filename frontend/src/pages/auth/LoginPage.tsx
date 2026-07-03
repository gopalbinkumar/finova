import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Mail, Lock, TrendingUp } from 'lucide-react'
import { useLogin } from '@/hooks/useAuth'
import { getErrorMessage } from '@/utils/api'
import { LoadingButton } from '@/components/common/LoadingButton'

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type FormData = z.infer<typeof schema>

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const login = useLogin()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setServerError(null)
    try {
      await login.mutateAsync(data)
    } catch (err) {
      setServerError(getErrorMessage(err))
    }
  }

  return (
    <div className="finova-card auth-glow animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-primary mb-4 shadow-lg">
          <TrendingUp size={28} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Sign in to your Finova account
        </p>
      </div>

      {/* Server error */}
      {serverError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm mb-6">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {/* Email */}
        <div>
          <label htmlFor="login-email" className="finova-label">
            Email address
          </label>
          <div className="relative">
            <Mail
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className={`finova-input pl-10 ${errors.email ? 'border-destructive focus:ring-destructive' : ''}`}
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p className="text-destructive text-xs mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="login-password" className="finova-label mb-0">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-xs text-primary-500 hover:text-primary-600 font-medium transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Enter your password"
              className={`finova-input pl-10 pr-10 ${errors.password ? 'border-destructive focus:ring-destructive' : ''}`}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-destructive text-xs mt-1">{errors.password.message}</p>
          )}
        </div>

        {/* Submit */}
        <LoadingButton
          type="submit"
          loading={login.isPending}
          fullWidth
          className="h-11 text-base"
        >
          Sign In
        </LoadingButton>
      </form>

      {/* Register link */}
      <p className="text-center text-sm text-muted-foreground mt-6">
        Don't have an account?{' '}
        <Link
          to="/register"
          className="text-primary-500 hover:text-primary-600 font-semibold transition-colors"
        >
          Create one free
        </Link>
      </p>
    </div>
  )
}

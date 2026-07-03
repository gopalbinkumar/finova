import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, KeyRound, CheckCircle2 } from 'lucide-react'
import { useForgotPassword } from '@/hooks/useAuth'
import { getErrorMessage } from '@/utils/api'
import { LoadingButton } from '@/components/common/LoadingButton'

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
})
type FormData = z.infer<typeof schema>

export function ForgotPasswordPage() {
  const [serverError, setServerError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [sentEmail, setSentEmail] = useState('')
  const forgotPassword = useForgotPassword()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setServerError(null)
    try {
      await forgotPassword.mutateAsync(data)
      setSentEmail(data.email)
      setSent(true)
    } catch (err) {
      setServerError(getErrorMessage(err))
    }
  }

  if (sent) {
    return (
      <div className="finova-card auth-glow text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-50 dark:bg-primary-900/20 mb-4">
          <CheckCircle2 size={36} className="text-primary-500" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Check your email</h1>
        <p className="text-muted-foreground text-sm mb-2">
          We've sent a password reset link to:
        </p>
        <p className="font-semibold text-foreground mb-6">{sentEmail}</p>
        <p className="text-muted-foreground text-sm mb-6">
          Didn't receive it? Check your spam folder or{' '}
          <button
            type="button"
            onClick={() => setSent(false)}
            className="text-primary-500 hover:underline font-medium"
          >
            try again
          </button>.
        </p>
        <Link to="/login" className="btn-secondary inline-flex items-center gap-2">
          Back to Login
        </Link>
      </div>
    )
  }

  return (
    <div className="finova-card auth-glow animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-primary mb-4 shadow-lg">
          <KeyRound size={28} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Forgot password?</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Enter your email and we'll send you a reset link.
        </p>
      </div>

      {serverError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm mb-6">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div>
          <label htmlFor="forgot-email" className="finova-label">Email address</label>
          <div className="relative">
            <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              id="forgot-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className={`finova-input pl-10 ${errors.email ? 'border-destructive' : ''}`}
              {...register('email')}
            />
          </div>
          {errors.email && <p className="text-destructive text-xs mt-1">{errors.email.message}</p>}
        </div>

        <LoadingButton type="submit" loading={forgotPassword.isPending} fullWidth className="h-11 text-base">
          Send Reset Link
        </LoadingButton>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        <Link to="/login" className="text-primary-500 hover:text-primary-600 font-semibold transition-colors">
          ← Back to Login
        </Link>
      </p>
    </div>
  )
}

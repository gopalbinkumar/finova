import { Loader2 } from 'lucide-react'

interface SpinnerProps {
  size?: number
  className?: string
}

export function Spinner({ size = 20, className = '' }: SpinnerProps) {
  return (
    <Loader2
      size={size}
      className={`animate-spin text-primary-500 ${className}`}
    />
  )
}

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  variant?: 'primary' | 'secondary' | 'danger'
  fullWidth?: boolean
  children: React.ReactNode
}

export function LoadingButton({
  loading = false,
  variant = 'primary',
  fullWidth = false,
  children,
  disabled,
  className = '',
  ...props
}: LoadingButtonProps) {
  const variantClass =
    variant === 'primary'
      ? 'btn-primary'
      : variant === 'danger'
      ? 'btn-danger'
      : 'btn-secondary'

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`
        ${variantClass}
        ${fullWidth ? 'w-full' : ''}
        flex items-center justify-center gap-2
        ${className}
      `}
    >
      {loading && <Spinner size={18} className="text-white" />}
      {children}
    </button>
  )
}

import { Loader2 } from 'lucide-react';
export function Spinner({ size = 20, className = '' }) {
    return (<Loader2 size={size} className={`animate-spin text-primary-500 ${className}`}/>);
}
export function LoadingButton({ loading = false, variant = 'primary', fullWidth = false, children, disabled, className = '', ...props }) {
    const variantClass = variant === 'primary'
        ? 'btn-primary'
        : variant === 'danger'
            ? 'btn-danger'
            : 'btn-secondary';
    return (<button {...props} disabled={disabled || loading} className={`
        ${variantClass}
        ${fullWidth ? 'w-full' : ''}
        flex items-center justify-center gap-2
        ${className}
      `}>
      {loading && <Spinner size={18} className="text-white"/>}
      {children}
    </button>);
}

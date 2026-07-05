const sizes = {
    sm: { icon: 28, text: 'text-lg' },
    md: { icon: 36, text: 'text-xl' },
    lg: { icon: 44, text: 'text-2xl' },
};
export function Logo({ size = 'md', variant = 'full', className = '' }) {
    const s = sizes[size];
    return (<div className={`flex items-center gap-2.5 ${className}`}>
      {/* Icon */}
      <div className="flex items-center justify-center rounded-xl gradient-primary flex-shrink-0" style={{ width: s.icon, height: s.icon }}>
        <svg width={s.icon * 0.6} height={s.icon * 0.6} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 7l10 5 10-5-10-5z" fill="white" fillOpacity="0.9"/>
          <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* Text */}
      {variant === 'full' && (<span className={`font-bold tracking-tight text-gradient ${s.text}`}>
          Finova
        </span>)}
    </div>);
}

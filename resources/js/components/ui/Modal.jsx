import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
};
export function Modal({ open, onClose, title, subtitle, icon, iconColor = '#2563EB', children, maxWidth = 'md', footer, }) {
    const panelRef = useRef(null);
    // Close on Escape
    useEffect(() => {
        if (!open)
            return;
        const handler = (e) => { if (e.key === 'Escape')
            onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [open, onClose]);
    // Lock body scroll
    useEffect(() => {
        document.body.style.overflow = open ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [open]);
    if (!open)
        return null;
    return (<div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden/>

      {/* Panel */}
      <div ref={panelRef} className={`
          relative w-full ${maxWidthClasses[maxWidth]} bg-card border border-border
          rounded-t-2xl sm:rounded-2xl shadow-2xl
          animate-in slide-in-from-bottom-4 duration-300
          flex flex-col max-h-[90vh] overflow-hidden
        `}>
        {/* Header */}
        <div className="flex items-start gap-4 px-6 pt-6 pb-4 border-b border-border flex-shrink-0">
          {icon && (<div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${iconColor}20`, color: iconColor }}>
              {icon}
            </div>)}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-foreground leading-tight">{title}</h2>
            {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 -mt-1 -mr-1" aria-label="Close">
            <X size={20}/>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>

        {/* Footer */}
        {footer && (<div className="flex-shrink-0 px-6 py-4 border-t border-border bg-muted/30">
            {footer}
          </div>)}
      </div>
    </div>);
}
export function FormField({ label, required, error, children, hint }) {
    return (<div className="space-y-1.5">
      <label className="block text-sm font-semibold text-foreground">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>);
}
export function Input({ error, leftDecor, rightDecor, className = '', ...props }) {
    return (<div className="relative flex items-center">
      {leftDecor && (<span className="absolute left-3 text-muted-foreground text-sm pointer-events-none select-none">
          {leftDecor}
        </span>)}
      <input className={`
          finova-input w-full text-sm
          ${leftDecor ? 'pl-8' : ''}
          ${rightDecor ? 'pr-10' : ''}
          ${error ? 'border-red-500 focus:ring-red-500' : ''}
          ${className}
        `} {...props}/>
      {rightDecor && (<span className="absolute right-3 text-muted-foreground text-sm pointer-events-none select-none">
          {rightDecor}
        </span>)}
    </div>);
}
export function Select({ error, options, placeholder, className = '', ...props }) {
    return (<select className={`finova-input w-full text-sm appearance-none cursor-pointer ${error ? 'border-red-500' : ''} ${className}`} {...props}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => (<option key={o.value} value={o.value}>{o.label}</option>))}
    </select>);
}
export function Textarea({ error, className = '', ...props }) {
    return (<textarea className={`finova-input w-full text-sm resize-none ${error ? 'border-red-500' : ''} ${className}`} rows={3} {...props}/>);
}
export function ModalFooter({ onCancel, onSubmit, submitLabel = 'Save', cancelLabel = 'Cancel', loading = false, danger = false }) {
    return (<div className="flex items-center justify-end gap-3">
      <button type="button" onClick={onCancel} className="btn-secondary px-5 py-2 text-sm" disabled={loading}>
        {cancelLabel}
      </button>
      <button type={onSubmit ? 'button' : 'submit'} onClick={onSubmit} disabled={loading} className={`${danger ? 'btn-danger' : 'btn-primary'} px-5 py-2 text-sm flex items-center gap-2`}>
        {loading && (<span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>)}
        {submitLabel}
      </button>
    </div>);
}

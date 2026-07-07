import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { FormField, Input, Modal, ModalFooter, Select, Textarea } from '@/components/ui/Modal'

export function EditRecordModal({
  open,
  onClose,
  title,
  subtitle,
  icon,
  iconColor = '#2563EB',
  record,
  fields,
  onSave,
}) {
  const [form, setForm] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && record) setForm({ ...record })
  }, [open, record])

  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  const handleSave = () => {
    setLoading(true)
    window.setTimeout(() => {
      const next = { ...form }
      fields.forEach((field) => {
        if (field.type === 'number') next[field.key] = Number(next[field.key] || 0)
      })
      onSave(next)
      setLoading(false)
      onClose()
    }, 350)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      icon={icon ?? <Pencil size={20} />}
      iconColor={iconColor}
      maxWidth="lg"
      footer={(
        <ModalFooter
          onCancel={onClose}
          onSubmit={handleSave}
          submitLabel="Save Changes"
          loading={loading}
        />
      )}
    >
      <div className="grid sm:grid-cols-2 gap-4">
        {fields.map((field) => {
          const value = form[field.key] ?? ''
          const span = field.fullWidth ? 'sm:col-span-2' : ''

          return (
            <div key={field.key} className={span}>
              <FormField label={field.label} required={field.required} hint={field.hint}>
                {field.type === 'select' ? (
                  <Select
                    value={value}
                    onChange={(event) => set(field.key, event.target.value)}
                    options={field.options}
                  />
                ) : field.type === 'textarea' ? (
                  <Textarea
                    value={value}
                    onChange={(event) => set(field.key, event.target.value)}
                    placeholder={field.placeholder}
                  />
                ) : field.type === 'color' ? (
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={value || '#2563EB'}
                      onChange={(event) => set(field.key, event.target.value)}
                      className="w-11 h-11 rounded-lg border border-border bg-card cursor-pointer"
                    />
                    <Input
                      value={value}
                      onChange={(event) => set(field.key, event.target.value)}
                      placeholder="#2563EB"
                    />
                  </div>
                ) : (
                  <Input
                    type={field.type ?? 'text'}
                    value={value}
                    onChange={(event) => set(field.key, event.target.value)}
                    placeholder={field.placeholder}
                    leftDecor={field.leftDecor}
                    min={field.min}
                    step={field.step}
                  />
                )}
              </FormField>
            </div>
          )
        })}
      </div>
    </Modal>
  )
}

export function ConfirmDeleteModal({ open, onClose, itemName, itemType = 'item', onConfirm }) {
  const [loading, setLoading] = useState(false)

  const handleDelete = () => {
    setLoading(true)
    window.setTimeout(() => {
      onConfirm()
      setLoading(false)
      onClose()
    }, 350)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Delete ${itemType}?`}
      subtitle="This only updates the dummy data shown in this session."
      icon={<AlertTriangle size={20} />}
      iconColor="#EF4444"
      maxWidth="sm"
      footer={(
        <ModalFooter
          onCancel={onClose}
          onSubmit={handleDelete}
          submitLabel="Delete"
          loading={loading}
          danger
        />
      )}
    >
      <p className="text-sm text-muted-foreground leading-relaxed">
        Are you sure you want to delete{' '}
        <span className="font-semibold text-foreground">{itemName}</span>? This action can’t be undone.
      </p>
    </Modal>
  )
}

export function ActionMenu({ onEdit, onDelete, label = 'Open actions' }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const close = (event) => {
      if (!menuRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          setOpen((current) => !current)
        }}
        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        aria-label={label}
        aria-expanded={open}
      >
        <MoreVertical size={16} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-36 rounded-lg border border-border bg-card shadow-xl p-1 z-30 animate-in">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              setOpen(false)
              onEdit()
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-foreground hover:bg-muted transition-colors"
          >
            <Pencil size={14} />
            Edit
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              setOpen(false)
              onDelete()
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      )}
    </div>
  )
}

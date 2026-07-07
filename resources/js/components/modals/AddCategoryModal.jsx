import { useEffect, useState } from 'react'
import { Tag } from 'lucide-react'
import { FormField, Input, Modal, ModalFooter } from '@/components/ui/Modal'

const ICON_OPTIONS = ['🍔', '🚗', '🛍️', '⚡', '🏥', '🎬', '📚', '🏠', '✈️', '💼', '💻', '📈', '🎮', '🎵', '🏋️', '🐾', '🌿', '☕', '🎁', '🔧', '💊', '🍕', '🏖️', '🚀']
const COLOR_PRESETS = ['#2563EB', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#EF4444', '#F97316', '#14B8A6', '#06B6D4', '#6366F1', '#64748B']
const INITIAL = { name: '', type: 'expense', icon: '🍔', color: '#F59E0B' }

export function AddCategoryModal({ open, onClose, defaultType = 'expense', onCreate }) {
  const [form, setForm] = useState({ ...INITIAL, type: defaultType })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm({ ...INITIAL, type: defaultType })
    setErrors({})
    setDone(false)
  }, [open, defaultType])

  const setField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: '' }))
  }

  const handleClose = () => {
    if (!loading) onClose()
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setErrors({ name: 'Category name is required' })
      return
    }

    try {
      setLoading(true)
      setErrors({})
      await onCreate({ ...form, name: form.name.trim() })
      setDone(true)
      window.setTimeout(() => {
        setDone(false)
        onClose()
      }, 600)
    } catch (error) {
      const validation = error?.response?.data?.errors ?? {}
      setErrors({
        name: validation.name?.[0] || error?.response?.data?.message || 'Failed to create category',
        type: validation.type?.[0],
        icon: validation.icon?.[0],
        color: validation.color?.[0],
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="New Category"
      subtitle="Organize your transactions with categories"
      icon={<Tag size={20} />}
      iconColor="#8B5CF6"
      footer={done
        ? <p className="text-center text-sm font-semibold text-primary-500">✅ Category created!</p>
        : <ModalFooter onCancel={handleClose} onSubmit={handleSubmit} submitLabel="Create Category" loading={loading} />}
    >
      <div className="space-y-5">
        <FormField label="Category Type" required error={errors.type}>
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-muted">
            {['expense', 'income'].map((type) => (
              <button
                key={type}
                type="button"
                disabled={loading}
                onClick={() => setField('type', type)}
                className={`py-2.5 rounded-lg text-sm font-semibold capitalize transition-all ${form.type === type
                  ? type === 'expense' ? 'bg-red-500 text-white shadow' : 'bg-primary-500 text-white shadow'
                  : 'text-muted-foreground hover:text-foreground'}`}
              >
                {type === 'income' ? '💚 Income' : '💸 Expense'}
              </button>
            ))}
          </div>
        </FormField>

        <FormField label="Category Name" required error={errors.name}>
          <Input
            placeholder="e.g. Coffee & Drinks"
            value={form.name}
            onChange={(event) => setField('name', event.target.value)}
            error={!!errors.name}
            disabled={loading}
            autoFocus
          />
        </FormField>

        <FormField label="Icon" error={errors.icon}>
          <div className="grid grid-cols-8 gap-2 p-3 rounded-xl border border-border bg-muted/30 max-h-32 overflow-y-auto">
            {ICON_OPTIONS.map((icon) => (
              <button
                key={icon}
                type="button"
                disabled={loading}
                onClick={() => setField('icon', icon)}
                className={`w-9 h-9 rounded-lg text-xl flex items-center justify-center transition-all hover:scale-110 ${form.icon === icon ? 'bg-card shadow ring-2 ring-primary-500' : 'hover:bg-card'}`}
              >
                {icon}
              </button>
            ))}
          </div>
        </FormField>

        <FormField label="Color" error={errors.color}>
          <div className="flex items-center gap-2 flex-wrap">
            {COLOR_PRESETS.map((color) => (
              <button
                key={color}
                type="button"
                disabled={loading}
                onClick={() => setField('color', color)}
                className="w-8 h-8 rounded-lg transition-all hover:scale-110"
                style={{ background: color, outline: form.color === color ? `3px solid ${color}` : 'none', outlineOffset: '2px' }}
                aria-label={`Select color ${color}`}
              />
            ))}
            <input type="color" value={form.color} disabled={loading} onChange={(event) => setField('color', event.target.value)} className="w-8 h-8 rounded-lg cursor-pointer border border-border" />
          </div>
        </FormField>

        <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-muted/20">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: `${form.color}20` }}>{form.icon}</div>
          <div>
            <p className="font-bold text-foreground">{form.name || 'Category Name'}</p>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize" style={{ background: `${form.color}20`, color: form.color }}>{form.type}</span>
          </div>
        </div>
      </div>
    </Modal>
  )
}

import { useState } from 'react'
import { Tag } from 'lucide-react'
import { Modal, FormField, Input, ModalFooter } from '@/components/ui/Modal'

interface Props { open: boolean; onClose: () => void; defaultType?: 'income' | 'expense' }

const ICON_OPTIONS = ['🍔','🚗','🛍️','⚡','🏥','🎬','📚','🏠','✈️','💼','💻','📈','🎮','🎵','🏋️','🐾','🌿','☕','🎁','🔧','💊','🍕','🏖️','🚀']
const COLOR_PRESETS = ['#08CB00','#10B981','#3B82F6','#8B5CF6','#EC4899','#F59E0B','#EF4444','#F97316','#14B8A6','#06B6D4','#6366F1','#64748B']

const INITIAL = { name: '', type: 'expense' as 'income' | 'expense', icon: '🍔', color: '#F59E0B' }

export function AddCategoryModal({ open, onClose, defaultType = 'expense' }: Props) {
  const [form, setForm] = useState({ ...INITIAL, type: defaultType })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const set = (k: string, v: string) => {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => ({ ...e, [k]: '' }))
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Category name is required'
    return e
  }

  const handleSubmit = async () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setLoading(true)
    await new Promise(r => setTimeout(r, 800))
    setLoading(false)
    setDone(true)
    setTimeout(() => { setDone(false); setForm({ ...INITIAL, type: defaultType }); onClose() }, 1200)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Category"
      subtitle="Organize your transactions with categories"
      icon={<Tag size={20} />}
      iconColor="#8B5CF6"
      footer={
        done
          ? <p className="text-center text-sm font-semibold text-primary-500">✅ Category created!</p>
          : <ModalFooter onCancel={onClose} onSubmit={handleSubmit} submitLabel="Create Category" loading={loading} />
      }
    >
      <div className="space-y-5">
        {/* Type toggle */}
        <FormField label="Category Type" required>
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-muted">
            {(['expense', 'income'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => set('type', t)}
                className={`py-2.5 rounded-lg text-sm font-semibold capitalize transition-all ${
                  form.type === t
                    ? t === 'expense'
                      ? 'bg-red-500 text-white shadow'
                      : 'bg-primary-500 text-white shadow'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t === 'income' ? '💚 Income' : '💸 Expense'}
              </button>
            ))}
          </div>
        </FormField>

        {/* Name */}
        <FormField label="Category Name" required error={errors.name}>
          <Input
            placeholder="e.g. Coffee & Drinks"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            error={!!errors.name}
            autoFocus
          />
        </FormField>

        {/* Icon grid */}
        <FormField label="Icon">
          <div className="grid grid-cols-8 gap-2 p-3 rounded-xl border border-border bg-muted/30 max-h-32 overflow-y-auto">
            {ICON_OPTIONS.map(icon => (
              <button
                key={icon}
                type="button"
                onClick={() => set('icon', icon)}
                className={`w-9 h-9 rounded-lg text-xl flex items-center justify-center transition-all hover:scale-110 ${
                  form.icon === icon ? 'bg-card shadow ring-2 ring-primary-500' : 'hover:bg-card'
                }`}
              >
                {icon}
              </button>
            ))}
          </div>
        </FormField>

        {/* Color */}
        <FormField label="Color">
          <div className="flex items-center gap-2 flex-wrap">
            {COLOR_PRESETS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => set('color', c)}
                className="w-8 h-8 rounded-lg transition-all hover:scale-110 flex-shrink-0"
                style={{
                  background: c,
                  outline: form.color === c ? `3px solid ${c}` : 'none',
                  outlineOffset: '2px',
                  boxShadow: form.color === c ? '0 0 0 2px white' : 'none',
                }}
              />
            ))}
            <input
              type="color"
              value={form.color}
              onChange={e => set('color', e.target.value)}
              className="w-8 h-8 rounded-lg cursor-pointer border border-border"
            />
          </div>
        </FormField>

        {/* Preview */}
        <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-muted/20">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
            style={{ background: `${form.color}20` }}
          >
            {form.icon}
          </div>
          <div>
            <p className="font-bold text-foreground">{form.name || 'Category Name'}</p>
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize"
              style={{ background: `${form.color}20`, color: form.color }}
            >
              {form.type}
            </span>
          </div>
        </div>
      </div>
    </Modal>
  )
}

import { useState } from 'react'
import { Target } from 'lucide-react'
import { Modal, FormField, Input, ModalFooter } from '@/components/ui/Modal'

interface Props { open: boolean; onClose: () => void }

const ICON_OPTIONS = ['🛡️','💻','🌴','🏠','🚗','💍','✈️','🎓','🏖️','🎸','🎥','⛵','🏔️','🐶','💊','📱','🏋️','🌏']
const COLOR_PRESETS = ['#2563EB','#3B82F6','#F59E0B','#8B5CF6','#EC4899','#EF4444','#14B8A6','#F97316']

const INITIAL = {
  name: '', icon: '🎯', color: '#2563EB',
  target: '', initial: '0', deadline: '',
  notes: '',
}

export function AddGoalModal({ open, onClose }: Props) {
  const [form, setForm] = useState(INITIAL)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const set = (k: string, v: string) => {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => ({ ...e, [k]: '' }))
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim())                             e.name     = 'Goal name is required'
    if (!form.target || Number(form.target) <= 0)      e.target   = 'Enter a target amount'
    if (!form.deadline)                                e.deadline = 'Please set a deadline'
    if (Number(form.initial) > Number(form.target))    e.initial  = 'Initial amount exceeds target'
    return e
  }

  const handleSubmit = async () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setLoading(true)
    await new Promise(r => setTimeout(r, 900))
    setLoading(false)
    setDone(true)
    setTimeout(() => { setDone(false); setForm(INITIAL); onClose() }, 1200)
  }

  const target = Number(form.target) || 0
  const initial = Number(form.initial) || 0
  const pct = target > 0 ? Math.min((initial / target) * 100, 100) : 0
  const daysToDeadline = form.deadline
    ? Math.ceil((new Date(form.deadline).getTime() - Date.now()) / 86_400_000)
    : null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Financial Goal"
      subtitle="Set a target and track your progress"
      icon={<Target size={20} />}
      iconColor={form.color}
      footer={
        done
          ? <p className="text-center text-sm font-semibold text-primary-500">🎯 Goal created!</p>
          : <ModalFooter onCancel={onClose} onSubmit={handleSubmit} submitLabel="Create Goal" loading={loading} />
      }
    >
      <div className="space-y-4">
        {/* Icon + Color row */}
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Goal Icon">
            <div className="grid grid-cols-6 gap-1.5 p-2 rounded-xl border border-border bg-muted/30 max-h-28 overflow-y-auto">
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

          <FormField label="Color Theme">
            <div className="grid grid-cols-4 gap-2">
              {COLOR_PRESETS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set('color', c)}
                  className="w-9 h-9 rounded-lg transition-all hover:scale-110"
                  style={{
                    background: c,
                    outline: form.color === c ? `3px solid ${c}` : 'none',
                    outlineOffset: '2px',
                    boxShadow: form.color === c ? '0 0 0 2px white' : 'none',
                  }}
                />
              ))}
            </div>
            <input
              type="color"
              value={form.color}
              onChange={e => set('color', e.target.value)}
              className="w-9 h-9 rounded-lg cursor-pointer border border-border mt-2"
            />
          </FormField>
        </div>

        {/* Name */}
        <FormField label="Goal Name" required error={errors.name}>
          <Input
            placeholder="e.g. Emergency Fund"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            error={!!errors.name}
            autoFocus
          />
        </FormField>

        {/* Target + Initial amount */}
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Target Amount" required error={errors.target}>
            <Input
              type="number"
              step="100"
              min="1"
              placeholder="10,000"
              value={form.target}
              onChange={e => set('target', e.target.value)}
              error={!!errors.target}
              leftDecor="$"
            />
          </FormField>
          <FormField label="Already Saved" error={errors.initial}>
            <Input
              type="number"
              step="100"
              min="0"
              placeholder="0"
              value={form.initial}
              onChange={e => set('initial', e.target.value)}
              error={!!errors.initial}
              leftDecor="$"
            />
          </FormField>
        </div>

        {/* Deadline */}
        <FormField label="Target Date" required error={errors.deadline}>
          <Input
            type="date"
            value={form.deadline}
            onChange={e => set('deadline', e.target.value)}
            error={!!errors.deadline}
            min={new Date().toISOString().slice(0, 10)}
          />
        </FormField>

        {/* Notes */}
        <FormField label="Notes" hint="Optional">
          <textarea
            className="finova-input w-full text-sm resize-none"
            rows={2}
            placeholder="e.g. 6 months of living expenses"
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
          />
        </FormField>

        {/* Live preview */}
        {(form.name || form.target) && (
          <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: `${form.color}30`, background: `${form.color}08` }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: `${form.color}20` }}>
                {form.icon}
              </div>
              <div>
                <p className="font-bold text-foreground">{form.name || 'Your Goal'}</p>
                {daysToDeadline !== null && (
                  <p className="text-xs text-muted-foreground">
                    {daysToDeadline > 0 ? `${daysToDeadline} days to go` : 'Deadline passed'}
                  </p>
                )}
              </div>
            </div>

            {target > 0 && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="font-semibold" style={{ color: form.color }}>
                    ${initial.toLocaleString()} saved
                  </span>
                  <span className="text-muted-foreground">of ${target.toLocaleString()}</span>
                </div>
                <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: form.color }}
                  />
                </div>
                <p className="text-xs text-right font-semibold" style={{ color: form.color }}>
                  {pct.toFixed(0)}% complete
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}

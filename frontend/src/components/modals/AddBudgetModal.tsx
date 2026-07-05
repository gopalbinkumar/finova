import { useState } from 'react'
import { PieChart } from 'lucide-react'
import { Modal, FormField, Input, Select, ModalFooter } from '@/components/ui/Modal'
import { mockCategories } from '@/data/mockData'

interface Props { open: boolean; onClose: () => void }

const PERIOD_OPTIONS = [
  { value: 'June 2024',   label: 'June 2024'   },
  { value: 'July 2024',   label: 'July 2024'   },
  { value: 'August 2024', label: 'August 2024' },
]

const INITIAL = { category: '', limit: '', period: 'July 2024', alertAt: '80', notes: '' }

export function AddBudgetModal({ open, onClose }: Props) {
  const [form, setForm] = useState(INITIAL)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const set = (k: string, v: string) => {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => ({ ...e, [k]: '' }))
  }

  const expenseCategories = mockCategories
    .filter(c => c.type === 'expense')
    .map(c => ({ value: c.name, label: `${c.icon} ${c.name}` }))

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.category)                            e.category = 'Please select a category'
    if (!form.limit || Number(form.limit) <= 0)   e.limit    = 'Enter a valid budget limit'
    return e
  }

  const handleSubmit = async () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setLoading(true)
    await new Promise(r => setTimeout(r, 800))
    setLoading(false)
    setDone(true)
    setTimeout(() => { setDone(false); setForm(INITIAL); onClose() }, 1200)
  }

  const limit = Number(form.limit) || 0
  const alertAmount = (limit * Number(form.alertAt)) / 100

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create Budget"
      subtitle="Set a spending limit for a category"
      icon={<PieChart size={20} />}
      iconColor="#8B5CF6"
      footer={
        done
          ? <p className="text-center text-sm font-semibold text-primary-500">✅ Budget created!</p>
          : <ModalFooter onCancel={onClose} onSubmit={handleSubmit} submitLabel="Create Budget" loading={loading} />
      }
    >
      <div className="space-y-4">
        {/* Category */}
        <FormField label="Category" required error={errors.category}>
          <Select
            value={form.category}
            onChange={e => set('category', e.target.value)}
            options={expenseCategories}
            placeholder="Select a category..."
            error={!!errors.category}
          />
        </FormField>

        {/* Period */}
        <FormField label="Budget Period" required>
          <Select
            value={form.period}
            onChange={e => set('period', e.target.value)}
            options={PERIOD_OPTIONS}
          />
        </FormField>

        {/* Budget Limit */}
        <FormField label="Monthly Limit" required error={errors.limit}>
          <Input
            type="number"
            step="1"
            min="1"
            placeholder="500"
            value={form.limit}
            onChange={e => set('limit', e.target.value)}
            error={!!errors.limit}
            leftDecor="$"
          />
        </FormField>

        {/* Alert threshold slider */}
        <FormField label={`Alert me at ${form.alertAt}% — ${alertAmount > 0 ? `$${alertAmount.toFixed(0)}` : '--'}`} hint="Get notified before you hit the limit">
          <div className="space-y-2">
            <input
              type="range"
              min="50"
              max="100"
              step="5"
              value={form.alertAt}
              onChange={e => set('alertAt', e.target.value)}
              className="w-full accent-primary-500"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>
        </FormField>

        {/* Notes */}
        <FormField label="Notes" hint="Optional">
          <textarea
            className="finova-input w-full text-sm resize-none"
            rows={2}
            placeholder="e.g. Cut back on dining out"
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
          />
        </FormField>

        {/* Summary card */}
        {form.category && limit > 0 && (
          <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">{form.category}</span>
              <span className="text-sm font-bold text-foreground">${limit.toLocaleString()}</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full w-0 rounded-full bg-primary-500 transition-all" />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>$0 spent</span>
              <span>Period: {form.period}</span>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

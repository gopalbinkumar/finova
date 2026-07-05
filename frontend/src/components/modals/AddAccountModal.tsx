import { useState } from 'react'
import { Wallet } from 'lucide-react'
import { Modal, FormField, Input, Select, ModalFooter } from '@/components/ui/Modal'

interface Props { open: boolean; onClose: () => void }

const TYPE_OPTIONS = [
  { value: 'bank',        label: '🏦 Bank Account' },
  { value: 'cash',        label: '💵 Cash' },
  { value: 'credit_card', label: '💳 Credit Card' },
  { value: 'e_wallet',    label: '📱 E-Wallet' },
  { value: 'investment',  label: '📈 Investment Account' },
]

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'GBP', label: 'GBP — British Pound' },
  { value: 'IDR', label: 'IDR — Indonesian Rupiah' },
  { value: 'JPY', label: 'JPY — Japanese Yen' },
  { value: 'SGD', label: 'SGD — Singapore Dollar' },
]

const COLOR_PRESETS = ['#08CB00','#3B82F6','#EF4444','#F59E0B','#8B5CF6','#EC4899','#14B8A6','#F97316','#64748B','#253900']

const INITIAL = { name: '', type: 'bank', currency: 'USD', balance: '', color: '#08CB00', notes: '' }

export function AddAccountModal({ open, onClose }: Props) {
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
    if (!form.name.trim()) e.name = 'Account name is required'
    if (form.balance === '') e.balance = 'Opening balance is required'
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

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add New Account"
      subtitle="Connect a bank, cash, or e-wallet account"
      icon={<Wallet size={20} />}
      iconColor="#08CB00"
      footer={
        done
          ? <p className="text-center text-sm font-semibold text-primary-500">✅ Account added successfully!</p>
          : <ModalFooter onCancel={onClose} onSubmit={handleSubmit} submitLabel="Add Account" loading={loading} />
      }
    >
      <div className="space-y-4">
        {/* Name */}
        <FormField label="Account Name" required error={errors.name}>
          <Input
            placeholder="e.g. Chase Checking"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            error={!!errors.name}
            autoFocus
          />
        </FormField>

        {/* Type + Currency row */}
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Account Type" required>
            <Select
              value={form.type}
              onChange={e => set('type', e.target.value)}
              options={TYPE_OPTIONS}
            />
          </FormField>
          <FormField label="Currency" required>
            <Select
              value={form.currency}
              onChange={e => set('currency', e.target.value)}
              options={CURRENCY_OPTIONS}
            />
          </FormField>
        </div>

        {/* Opening Balance */}
        <FormField label="Opening Balance" required error={errors.balance} hint="Use negative value for credit card debt">
          <Input
            type="number"
            step="0.01"
            placeholder="0.00"
            value={form.balance}
            onChange={e => set('balance', e.target.value)}
            error={!!errors.balance}
            leftDecor="$"
          />
        </FormField>

        {/* Color picker */}
        <FormField label="Account Color">
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
                title={c}
              />
            ))}
            <input
              type="color"
              value={form.color}
              onChange={e => set('color', e.target.value)}
              className="w-8 h-8 rounded-lg cursor-pointer border border-border"
              title="Custom color"
            />
          </div>
        </FormField>

        {/* Notes */}
        <FormField label="Notes" hint="Optional description">
          <textarea
            className="finova-input w-full text-sm resize-none"
            rows={2}
            placeholder="e.g. Main spending account"
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
          />
        </FormField>

        {/* Preview card */}
        <div className="rounded-xl border border-border p-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl" style={{ background: form.color }} />
          <p className="text-xs text-muted-foreground mb-1">Preview</p>
          <p className="font-bold text-foreground">{form.name || 'Account Name'}</p>
          <p className="text-xs text-muted-foreground capitalize">{form.type.replace('_', ' ')}</p>
          <p className="text-lg font-bold mt-2 text-foreground">
            {form.balance ? new Intl.NumberFormat('en-US', { style: 'currency', currency: form.currency }).format(Number(form.balance)) : '$0.00'}
          </p>
        </div>
      </div>
    </Modal>
  )
}

import { useEffect, useState } from 'react'
import { Wallet } from 'lucide-react'
import { FormField, Input, Modal, ModalFooter, Select } from '@/components/ui/Modal'
import { CURRENCIES, useCurrencyFormatter } from '@/utils/currency'

const TYPE_OPTIONS = [
  { value: 'bank', label: '🏦 Bank Account' },
  { value: 'cash', label: '💵 Cash' },
  { value: 'credit_card', label: '💳 Credit Card' },
  { value: 'e_wallet', label: '📱 E-Wallet' },
  { value: 'investment', label: '📈 Investment Account' },
]
const CURRENCY_OPTIONS = CURRENCIES.map((value) => ({ value, label: value }))
const COLOR_PRESETS = ['#2563EB', '#3B82F6', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#64748B', '#0F172A']

export function AddAccountModal({ open, onClose, onCreate }) {
  const { currency, formatCurrency } = useCurrencyFormatter()
  const initial = { name: '', type: 'bank', currency, balance: '', color: '#2563EB', notes: '' }
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(initial)
    setErrors({})
    setDone(false)
  }, [open, currency])

  const setField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: '' }))
  }

  const handleClose = () => {
    if (!loading) onClose()
  }

  const handleSubmit = async () => {
    const nextErrors = {}
    if (!form.name.trim()) nextErrors.name = 'Account name is required'
    if (form.balance === '' || Number.isNaN(Number(form.balance))) nextErrors.balance = 'Opening balance must be a number'
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }

    try {
      setLoading(true)
      setErrors({})
      await onCreate({ ...form, name: form.name.trim(), balance: Number(form.balance), notes: form.notes.trim() || null })
      setDone(true)
      window.setTimeout(() => {
        setDone(false)
        onClose()
      }, 600)
    } catch (error) {
      const validation = error?.response?.data?.errors ?? {}
      setErrors({
        name: validation.name?.[0] || error?.response?.data?.message || 'Failed to create account',
        type: validation.type?.[0],
        currency: validation.currency?.[0],
        balance: validation.balance?.[0],
        color: validation.color?.[0],
        notes: validation.notes?.[0],
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Add New Account"
      subtitle="Connect a bank, cash, or e-wallet account"
      icon={<Wallet size={20} />}
      iconColor="#2563EB"
      footer={done
        ? <p className="text-center text-sm font-semibold text-primary-500">✅ Account added successfully!</p>
        : <ModalFooter onCancel={handleClose} onSubmit={handleSubmit} submitLabel="Add Account" loading={loading} />}
    >
      <div className="space-y-4">
        <FormField label="Account Name" required error={errors.name}>
          <Input placeholder="e.g. BCA Savings" value={form.name} onChange={(event) => setField('name', event.target.value)} error={!!errors.name} disabled={loading} autoFocus />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Account Type" required error={errors.type}>
            <Select value={form.type} onChange={(event) => setField('type', event.target.value)} options={TYPE_OPTIONS} disabled={loading} />
          </FormField>
          <FormField label="Currency" required error={errors.currency}>
            <Select value={form.currency} onChange={(event) => setField('currency', event.target.value)} options={CURRENCY_OPTIONS} disabled={loading} />
          </FormField>
        </div>

        <FormField label="Opening Balance" required error={errors.balance} hint="Use negative value for credit card debt">
          <Input type="number" step="0.01" placeholder="0.00" value={form.balance} onChange={(event) => setField('balance', event.target.value)} error={!!errors.balance} disabled={loading} />
        </FormField>

        <FormField label="Account Color" error={errors.color}>
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

        <FormField label="Notes" hint="Optional description" error={errors.notes}>
          <textarea className="finova-input w-full text-sm resize-none" rows={2} value={form.notes} onChange={(event) => setField('notes', event.target.value)} disabled={loading} />
        </FormField>

        <div className="rounded-xl border border-border p-4" style={{ borderTopColor: form.color }}>
          <p className="text-xs text-muted-foreground mb-1">Preview</p>
          <p className="font-bold text-foreground">{form.name || 'Account Name'}</p>
          <p className="text-xs text-muted-foreground capitalize">{form.type.replace('_', ' ')}</p>
          <p className={`text-lg font-bold mt-2 ${Number(form.balance) < 0 ? 'text-red-500' : 'text-foreground'}`}>
            {formatCurrency(Number(form.balance || 0), { currency: form.currency })}
          </p>
        </div>
      </div>
    </Modal>
  )
}

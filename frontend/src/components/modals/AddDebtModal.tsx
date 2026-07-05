import { useState } from 'react'
import { CreditCard } from 'lucide-react'
import { Modal, FormField, Input, Select, ModalFooter } from '@/components/ui/Modal'

interface Props { open: boolean; onClose: () => void; defaultType?: 'debt' | 'receivable' }

const INITIAL = {
  type: 'debt' as 'debt' | 'receivable',
  borrower: '', amount: '', remaining: '',
  dueDate: '', notes: '',
}

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

export function AddDebtModal({ open, onClose, defaultType = 'debt' }: Props) {
  const [form, setForm] = useState({ ...INITIAL, type: defaultType })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const set = (k: string, v: string) => {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => ({ ...e, [k]: '' }))
  }

  const isDebt = form.type === 'debt'

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.borrower.trim())                     e.borrower  = isDebt ? 'Lender name required' : 'Borrower name required'
    if (!form.amount || Number(form.amount) <= 0)  e.amount    = 'Enter a valid amount'
    if (!form.dueDate)                             e.dueDate   = 'Due date is required'
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

  const amount    = Number(form.amount) || 0
  const remaining = form.remaining !== '' ? Number(form.remaining) : amount
  const paidPct   = amount > 0 ? Math.min(((amount - remaining) / amount) * 100, 100) : 0

  const daysLeft = form.dueDate
    ? Math.ceil((new Date(form.dueDate).getTime() - Date.now()) / 86_400_000)
    : null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isDebt ? 'Record a Debt' : 'Record Receivable'}
      subtitle={isDebt ? 'Money you owe to someone' : 'Money owed to you'}
      icon={<CreditCard size={20} />}
      iconColor={isDebt ? '#EF4444' : '#2563EB'}
      footer={
        done
          ? <p className="text-center text-sm font-semibold text-primary-500">✅ Record saved!</p>
          : <ModalFooter onCancel={onClose} onSubmit={handleSubmit} submitLabel="Save Record" loading={loading} />
      }
    >
      <div className="space-y-4">
        {/* Type toggle */}
        <FormField label="Record Type" required>
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-muted">
            {(['debt', 'receivable'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => set('type', t)}
                className={`py-2.5 rounded-lg text-sm font-semibold capitalize transition-all ${
                  form.type === t
                    ? t === 'debt'
                      ? 'bg-red-500 text-white shadow'
                      : 'bg-primary-500 text-white shadow'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t === 'debt' ? '💸 I Owe' : '💰 Owed to Me'}
              </button>
            ))}
          </div>
        </FormField>

        {/* Borrower/Lender */}
        <FormField
          label={isDebt ? 'Lender / Creditor' : 'Borrower Name'}
          required
          error={errors.borrower}
        >
          <Input
            placeholder={isDebt ? 'e.g. Student Loan, Bank' : 'e.g. Marcus Chen'}
            value={form.borrower}
            onChange={e => set('borrower', e.target.value)}
            error={!!errors.borrower}
            autoFocus
          />
        </FormField>

        {/* Total amount + Remaining */}
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Total Amount" required error={errors.amount}>
            <Input
              type="number"
              step="0.01"
              min="1"
              placeholder="1,000"
              value={form.amount}
              onChange={e => set('amount', e.target.value)}
              error={!!errors.amount}
              leftDecor="$"
            />
          </FormField>
          <FormField label="Remaining Balance" hint="Leave blank if none paid">
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="Same as total"
              value={form.remaining}
              onChange={e => set('remaining', e.target.value)}
              leftDecor="$"
            />
          </FormField>
        </div>

        {/* Due date */}
        <FormField label="Due Date" required error={errors.dueDate}>
          <Input
            type="date"
            value={form.dueDate}
            onChange={e => set('dueDate', e.target.value)}
            error={!!errors.dueDate}
          />
        </FormField>

        {/* Notes */}
        <FormField label="Notes" hint="Purpose of the debt">
          <textarea
            className="finova-input w-full text-sm resize-none"
            rows={2}
            placeholder={isDebt ? 'e.g. Car loan from bank' : 'e.g. Trip expense loan'}
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
          />
        </FormField>

        {/* Preview */}
        {amount > 0 && (
          <div
            className="p-4 rounded-xl border space-y-3"
            style={{
              borderColor: isDebt ? 'rgba(239,68,68,0.3)' : 'rgba(8,203,0,0.3)',
              background:  isDebt ? 'rgba(239,68,68,0.05)' : 'rgba(8,203,0,0.05)',
            }}
          >
            <div className="flex justify-between items-baseline">
              <span className="font-bold text-foreground">{form.borrower || (isDebt ? 'Lender' : 'Borrower')}</span>
              <span className={`font-bold text-lg ${isDebt ? 'text-red-500' : 'text-primary-500'}`}>
                ${remaining.toLocaleString()}
              </span>
            </div>
            {/* Progress */}
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${paidPct}%`,
                  background: isDebt ? '#EF4444' : '#2563EB',
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{paidPct.toFixed(0)}% paid</span>
              {daysLeft !== null && (
                <span className={daysLeft < 14 ? 'text-red-500 font-semibold' : ''}>
                  {daysLeft > 0 ? `${daysLeft} days left` : 'Overdue'}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

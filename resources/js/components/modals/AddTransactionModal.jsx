import { useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { Modal, FormField, Input, Select, Textarea, ModalFooter } from '@/components/ui/Modal';
import { mockAccounts, mockCategories } from '@/data/mockData';
const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
const INITIAL = {
    type: 'expense',
    account: '',
    toAccount: '',
    category: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    description: '',
    notes: '',
};
export function AddTransactionModal({ open, onClose, defaultType = 'expense' }) {
    const [form, setForm] = useState({ ...INITIAL, type: defaultType });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const set = (k, v) => {
        setForm(f => ({ ...f, [k]: v }));
        setErrors(e => ({ ...e, [k]: '' }));
    };
    const typeColors = { income: '#2563EB', expense: '#EF4444', transfer: '#6366F1' };
    const typeColor = typeColors[form.type];
    const filteredCategories = mockCategories
        .filter(c => form.type === 'transfer' ? true : c.type === form.type)
        .map(c => ({ value: c.name, label: `${c.icon} ${c.name}` }));
    const accountOptions = mockAccounts.map(a => ({
        value: a.name,
        label: `${a.icon} ${a.name} (${fmt(a.balance)})`,
    }));
    const validate = () => {
        const e = {};
        if (!form.account)
            e.account = 'Please select an account';
        if (!form.amount || Number(form.amount) <= 0)
            e.amount = 'Enter a valid amount';
        if (!form.date)
            e.date = 'Date is required';
        if (!form.description.trim())
            e.description = 'Description is required';
        if (form.type !== 'transfer' && !form.category)
            e.category = 'Please select a category';
        if (form.type === 'transfer' && !form.toAccount)
            e.toAccount = 'Please select destination account';
        return e;
    };
    const handleSubmit = async () => {
        const e = validate();
        if (Object.keys(e).length) {
            setErrors(e);
            return;
        }
        setLoading(true);
        await new Promise(r => setTimeout(r, 900));
        setLoading(false);
        setDone(true);
        setTimeout(() => { setDone(false); setForm({ ...INITIAL, type: defaultType }); onClose(); }, 1200);
    };
    return (<Modal open={open} onClose={onClose} title="Add Transaction" subtitle="Record income, expense, or transfer" icon={<ArrowLeftRight size={20}/>} iconColor={typeColor} maxWidth="lg" footer={done
            ? <p className="text-center text-sm font-semibold text-primary-500">✅ Transaction recorded!</p>
            : <ModalFooter onCancel={onClose} onSubmit={handleSubmit} submitLabel="Add Transaction" loading={loading}/>}>
      <div className="space-y-4">
        {/* Transaction type tabs */}
        <FormField label="Transaction Type" required>
          <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-muted">
            {['expense', 'income', 'transfer'].map(t => (<button key={t} type="button" onClick={() => { set('type', t); setForm(f => ({ ...f, category: '', toAccount: '' })); }} className={`py-2.5 rounded-lg text-sm font-semibold capitalize transition-all ${form.type === t ? 'text-white shadow' : 'text-muted-foreground hover:text-foreground'}`} style={form.type === t ? { background: typeColors[t] } : {}}>
                {t === 'income' ? '💚' : t === 'expense' ? '💸' : '↔️'} {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>))}
          </div>
        </FormField>

        {/* Amount — big and prominent */}
        <FormField label="Amount" required error={errors.amount}>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground">$</span>
            <input type="number" step="0.01" min="0" placeholder="0.00" value={form.amount} onChange={e => set('amount', e.target.value)} className={`finova-input w-full pl-10 text-2xl font-bold py-4 ${errors.amount ? 'border-red-500' : ''}`} style={{ color: typeColor }} autoFocus/>
          </div>
        </FormField>

        {/* Account row */}
        <div className={`grid gap-4 ${form.type === 'transfer' ? 'grid-cols-2' : 'grid-cols-1'}`}>
          <FormField label={form.type === 'transfer' ? 'From Account' : 'Account'} required error={errors.account}>
            <Select value={form.account} onChange={e => set('account', e.target.value)} options={accountOptions} placeholder="Select account..." error={!!errors.account}/>
          </FormField>
          {form.type === 'transfer' && (<FormField label="To Account" required error={errors.toAccount}>
              <Select value={form.toAccount} onChange={e => set('toAccount', e.target.value)} options={accountOptions.filter(a => a.value !== form.account)} placeholder="Select destination..." error={!!errors.toAccount}/>
            </FormField>)}
        </div>

        {/* Category (hidden for transfer) */}
        {form.type !== 'transfer' && (<FormField label="Category" required error={errors.category}>
            <Select value={form.category} onChange={e => set('category', e.target.value)} options={filteredCategories} placeholder="Select category..." error={!!errors.category}/>
          </FormField>)}

        {/* Date + Description row */}
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Date" required error={errors.date}>
            <Input type="date" value={form.date} onChange={e => set('date', e.target.value)} error={!!errors.date}/>
          </FormField>
          <FormField label="Description" required error={errors.description}>
            <Input placeholder="e.g. Monthly rent" value={form.description} onChange={e => set('description', e.target.value)} error={!!errors.description}/>
          </FormField>
        </div>

        {/* Notes */}
        <FormField label="Notes" hint="Optional additional details">
          <Textarea placeholder="Add any notes..." value={form.notes} onChange={e => set('notes', e.target.value)}/>
        </FormField>

        {/* Summary preview */}
        {form.amount && Number(form.amount) > 0 && (<div className="flex items-center gap-4 p-4 rounded-xl border" style={{ borderColor: `${typeColor}30`, background: `${typeColor}08` }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: `${typeColor}20` }}>
              {form.type === 'income' ? '💚' : form.type === 'transfer' ? '↔️' : '💸'}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">{form.description || 'Transaction'}</p>
              <p className="text-xs text-muted-foreground">{form.account || 'Account'} · {form.date}</p>
            </div>
            <p className="font-bold text-lg" style={{ color: typeColor }}>
              {form.type === 'income' ? '+' : form.type === 'transfer' ? '±' : '-'}
              ${Number(form.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>)}
      </div>
    </Modal>);
}

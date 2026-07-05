import { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { Modal, FormField, Input, Select, ModalFooter } from '@/components/ui/Modal';
const TYPE_OPTIONS = [
    { value: 'stock', label: '📈 Stock' },
    { value: 'crypto', label: '₿ Crypto' },
    { value: 'gold', label: '🥇 Gold' },
    { value: 'mutual_fund', label: '📊 Mutual Fund' },
    { value: 'bonds', label: '📜 Bonds' },
    { value: 'etf', label: '🏦 ETF' },
    { value: 'property', label: '🏠 Property' },
];
const INITIAL = {
    symbol: '', name: '', type: 'stock',
    qty: '', buyPrice: '', currentPrice: '',
    date: new Date().toISOString().slice(0, 10),
    notes: '',
};
export function AddInvestmentModal({ open, onClose }) {
    const [form, setForm] = useState(INITIAL);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const set = (k, v) => {
        setForm(f => ({ ...f, [k]: v }));
        setErrors(e => ({ ...e, [k]: '' }));
    };
    const validate = () => {
        const e = {};
        if (!form.symbol.trim())
            e.symbol = 'Symbol is required';
        if (!form.name.trim())
            e.name = 'Name is required';
        if (!form.qty || Number(form.qty) <= 0)
            e.qty = 'Enter quantity';
        if (!form.buyPrice || Number(form.buyPrice) <= 0)
            e.buyPrice = 'Enter buy price';
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
        setTimeout(() => { setDone(false); setForm(INITIAL); onClose(); }, 1200);
    };
    const qty = Number(form.qty) || 0;
    const buyPrice = Number(form.buyPrice) || 0;
    const currPrice = Number(form.currentPrice) || buyPrice;
    const totalCost = qty * buyPrice;
    const totalValue = qty * currPrice;
    const gain = totalValue - totalCost;
    const gainPct = totalCost > 0 ? (gain / totalCost) * 100 : 0;
    const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
    return (<Modal open={open} onClose={onClose} title="Add Investment" subtitle="Track stocks, crypto, gold, or funds" icon={<TrendingUp size={20}/>} iconColor="#6366F1" maxWidth="lg" footer={done
            ? <p className="text-center text-sm font-semibold text-primary-500">📈 Investment added!</p>
            : <ModalFooter onCancel={onClose} onSubmit={handleSubmit} submitLabel="Add Investment" loading={loading}/>}>
      <div className="space-y-4">
        {/* Type */}
        <FormField label="Asset Type" required>
          <Select value={form.type} onChange={e => set('type', e.target.value)} options={TYPE_OPTIONS}/>
        </FormField>

        {/* Symbol + Name */}
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Ticker / Symbol" required error={errors.symbol}>
            <Input placeholder="e.g. AAPL" value={form.symbol} onChange={e => set('symbol', e.target.value.toUpperCase())} error={!!errors.symbol} className="uppercase font-mono font-bold" autoFocus/>
          </FormField>
          <FormField label="Asset Name" required error={errors.name}>
            <Input placeholder="e.g. Apple Inc." value={form.name} onChange={e => set('name', e.target.value)} error={!!errors.name}/>
          </FormField>
        </div>

        {/* Qty + Buy Price + Current Price */}
        <div className="grid grid-cols-3 gap-4">
          <FormField label="Quantity" required error={errors.qty}>
            <Input type="number" step="0.0001" min="0" placeholder="10" value={form.qty} onChange={e => set('qty', e.target.value)} error={!!errors.qty}/>
          </FormField>
          <FormField label="Buy Price" required error={errors.buyPrice}>
            <Input type="number" step="0.01" min="0" placeholder="150.00" value={form.buyPrice} onChange={e => set('buyPrice', e.target.value)} error={!!errors.buyPrice} leftDecor="$"/>
          </FormField>
          <FormField label="Current Price" hint="Leave blank = buy price">
            <Input type="number" step="0.01" min="0" placeholder="Same as buy" value={form.currentPrice} onChange={e => set('currentPrice', e.target.value)} leftDecor="$"/>
          </FormField>
        </div>

        {/* Purchase date */}
        <FormField label="Purchase Date">
          <Input type="date" value={form.date} onChange={e => set('date', e.target.value)}/>
        </FormField>

        {/* Notes */}
        <FormField label="Notes">
          <textarea className="finova-input w-full text-sm resize-none" rows={2} placeholder="Reason for investing..." value={form.notes} onChange={e => set('notes', e.target.value)}/>
        </FormField>

        {/* P&L Preview */}
        {qty > 0 && buyPrice > 0 && (<div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-muted/40 border border-border">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Total Cost</p>
              <p className="font-bold text-foreground">{fmt(totalCost)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Market Value</p>
              <p className="font-bold text-foreground">{fmt(totalValue)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">P&L</p>
              <p className={`font-bold ${gain >= 0 ? 'text-primary-500' : 'text-red-500'}`}>
                {gain >= 0 ? '+' : ''}{fmt(gain)}
              </p>
              <p className={`text-xs font-semibold ${gain >= 0 ? 'text-primary-500' : 'text-red-500'}`}>
                {gain >= 0 ? '+' : ''}{gainPct.toFixed(2)}%
              </p>
            </div>
          </div>)}
      </div>
    </Modal>);
}

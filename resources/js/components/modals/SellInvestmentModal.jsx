import { useEffect, useState } from 'react';
import { TrendingDown } from 'lucide-react';
import { FormField, Input, Modal, ModalFooter } from '@/components/ui/Modal';
import { useCurrencyFormatter } from '@/utils/currency';

const today = () => new Date().toISOString().slice(0, 10);
const initialForm = () => ({ qty: '', price: '', fee: '0', date: today(), notes: '' });
const requestHeaders = () => {
    const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    return {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(token ? { 'X-CSRF-TOKEN': token } : {}),
    };
};

export function SellInvestmentModal({ open, investment, onClose, onSaved }) {
    const { formatCurrency: fmt, symbol } = useCurrencyFormatter();
    const [form, setForm] = useState(initialForm);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open) return;
        setForm(initialForm());
        setErrors({});
        setLoading(false);
    }, [open, investment?.id]);

    const set = (key, value) => {
        setForm((current) => ({ ...current, [key]: value }));
        setErrors((current) => ({ ...current, [key]: '', general: '' }));
    };

    const close = () => {
        if (!loading) onClose?.();
    };

    const submit = async () => {
        const availableQty = Number(investment?.qty) || 0;
        const soldQty = Number(form.qty);
        const price = Number(form.price);
        const nextErrors = {};

        if (!form.qty || soldQty <= 0) nextErrors.qty = 'Enter a quantity greater than 0';
        else if (soldQty > availableQty) nextErrors.qty = `Only ${availableQty} units are available`;
        if (!form.price || price <= 0) nextErrors.price = 'Enter a price greater than 0';
        if (Number(form.fee) < 0) nextErrors.fee = 'Fee cannot be negative';
        else if (soldQty > 0 && price > 0 && Number(form.fee) > soldQty * price) nextErrors.fee = 'Fee cannot exceed gross sell amount';

        if (Object.keys(nextErrors).length) {
            setErrors(nextErrors);
            return;
        }

        setLoading(true);
        setErrors({});

        try {
            const response = await fetch(`/api/investments/${investment.id}/sell`, {
                method: 'POST',
                headers: requestHeaders(),
                credentials: 'same-origin',
                body: JSON.stringify({
                    qty: soldQty,
                    price,
                    fee: Number(form.fee) || 0,
                    date: form.date || null,
                    notes: form.notes.trim() || null,
                }),
            });
            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                setErrors({
                    qty: result.errors?.qty?.[0] || '',
                    price: result.errors?.price?.[0] || '',
                    fee: result.errors?.fee?.[0] || '',
                    date: result.errors?.purchase_date?.[0] || '',
                    notes: result.errors?.notes?.[0] || '',
                    general: result.message || 'Failed to sell investment.',
                });
                return;
            }

            onSaved?.(result);
            onClose?.();
        } catch {
            setErrors({ general: 'Network error. Please check your connection.' });
        } finally {
            setLoading(false);
        }
    };

    const availableQty = Number(investment?.qty) || 0;
    const soldQty = Number(form.qty) || 0;
    const price = Number(form.price) || 0;
    const fee = Number(form.fee) || 0;
    const averagePrice = Number(investment?.buyPrice ?? investment?.buy_price) || 0;
    const remainingQty = Math.max(availableQty - soldQty, 0);
    const grossSell = soldQty * price;
    const netReceived = grossSell - fee;
    const costBasis = soldQty * averagePrice;
    const realizedGain = netReceived - costBasis;
    const accountBalance = Number(investment?.accountBalance ?? investment?.account_balance) || 0;
    const balanceAfter = accountBalance + netReceived;

    return (
        <Modal
            open={open}
            onClose={close}
            title={`Sell ${investment?.symbol || 'Investment'}`}
            subtitle="Sell part or all of this holding"
            icon={<TrendingDown size={20} />}
            iconColor="#EF4444"
            maxWidth="lg"
            footer={<ModalFooter onCancel={close} onSubmit={submit} submitLabel="Sell Investment" loading={loading} danger />}
        >
            <div className="space-y-4">
                {errors.general && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{errors.general}</div>
                )}

                <div className="rounded-xl border border-border bg-muted/40 px-4 py-3">
                    <p className="text-xs text-muted-foreground">Investment Account</p>
                    <div className="mt-1 flex items-center justify-between gap-3">
                        <p className="font-bold text-foreground">{investment?.accountName || 'No investment account'}</p>
                        <p className="text-sm font-semibold text-foreground">Balance: {fmt(accountBalance)}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField label="Quantity to Sell" required error={errors.qty}>
                        <Input type="number" min="0" max={availableQty} step="0.00000001" value={form.qty} onChange={(event) => set('qty', event.target.value)} error={!!errors.qty} autoFocus />
                    </FormField>
                    <FormField label="Sell Price" required error={errors.price}>
                        <Input type="number" min="0" step="0.00000001" value={form.price} onChange={(event) => set('price', event.target.value)} error={!!errors.price} leftDecor={symbol} />
                    </FormField>
                    <FormField label="Fee" error={errors.fee}>
                        <Input type="number" min="0" step="0.01" value={form.fee} onChange={(event) => set('fee', event.target.value)} error={!!errors.fee} leftDecor={symbol} />
                    </FormField>
                </div>

                <FormField label="Date" error={errors.date}>
                    <Input type="date" value={form.date} onChange={(event) => set('date', event.target.value)} error={!!errors.date} />
                </FormField>

                <FormField label="Notes" error={errors.notes}>
                    <textarea className="finova-input w-full resize-none text-sm" rows={2} value={form.notes} onChange={(event) => set('notes', event.target.value)} placeholder="Optional sale note..." />
                </FormField>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 rounded-xl border border-border bg-muted/40 p-4">
                    {[
                        ['Available Quantity', availableQty],
                        ['Quantity to Sell', soldQty],
                        ['Remaining Quantity', remainingQty],
                        ['Average Buy Price', fmt(averagePrice)],
                        ['Gross Sell', fmt(grossSell)],
                        ['Fee', fmt(fee)],
                        ['Net Received', fmt(netReceived)],
                        ['Cost Basis', fmt(costBasis)],
                        ['Estimated Realized Gain/Loss', fmt(realizedGain)],
                        ['Account Balance Before', fmt(accountBalance)],
                        ['Account Balance After', fmt(balanceAfter)],
                    ].map(([label, value]) => (
                        <div key={label} className="min-w-0 text-center">
                            <p className="text-xs text-muted-foreground">{label}</p>
                            <p className={`mt-1 break-words font-bold ${label.includes('Gain') ? (realizedGain >= 0 ? 'text-primary-500' : 'text-red-500') : 'text-foreground'}`}>{value}</p>
                        </div>
                    ))}
                </div>
                {soldQty > 0 && price > 0 && (
                    <p className={`text-center text-sm font-semibold ${realizedGain >= 0 ? 'text-primary-500' : 'text-red-500'}`}>
                        {realizedGain >= 0 ? 'Investment Gain' : 'Investment Loss'}: {fmt(realizedGain)}
                    </p>
                )}
            </div>
        </Modal>
    );
}

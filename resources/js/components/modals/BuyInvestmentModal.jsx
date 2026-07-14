import { useEffect, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { FormField, Input, Modal, ModalFooter } from '@/components/ui/Modal';
import { useCurrencyFormatter } from '@/utils/currency';

const today = () => new Date().toISOString().slice(0, 10);

const initialForm = () => ({
    qty: '',
    price: '',
    fee: '0',
    currentPrice: '',
    date: today(),
    notes: '',
});

const requestHeaders = () => {
    const token = document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute('content');

    return {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(token ? { 'X-CSRF-TOKEN': token } : {}),
    };
};

export function BuyInvestmentModal({ open, investment, onClose, onSaved }) {
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
        const nextErrors = {};
        const addedQty = Number(form.qty);
        const price = Number(form.price);

        if (!form.qty || addedQty <= 0) nextErrors.qty = 'Enter a quantity greater than 0';
        if (!form.price || price <= 0) nextErrors.price = 'Enter a price greater than 0';
        if (Number(form.fee) < 0) nextErrors.fee = 'Fee cannot be negative';

        if (Object.keys(nextErrors).length) {
            setErrors(nextErrors);
            return;
        }

        setLoading(true);
        setErrors({});

        try {
            const response = await fetch(`/api/investments/${investment.id}/buy`, {
                method: 'POST',
                headers: requestHeaders(),
                credentials: 'same-origin',
                body: JSON.stringify({
                    qty: addedQty,
                    price,
                    fee: Number(form.fee) || 0,
                    currentPrice: form.currentPrice ? Number(form.currentPrice) : null,
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
                    currentPrice: result.errors?.current_price?.[0] || '',
                    date: result.errors?.purchase_date?.[0] || '',
                    notes: result.errors?.notes?.[0] || '',
                    general: result.message || 'Failed to buy investment.',
                });
                return;
            }

            onSaved?.(result.data);
            onClose?.();
        } catch {
            setErrors({ general: 'Network error. Please check your connection.' });
        } finally {
            setLoading(false);
        }
    };

    const oldQty = Number(investment?.qty) || 0;
    const oldBuyPrice = Number(investment?.buyPrice ?? investment?.buy_price) || 0;
    const addedQty = Number(form.qty) || 0;
    const price = Number(form.price) || 0;
    const fee = Number(form.fee) || 0;
    const newQty = oldQty + addedQty;
    const newAverage = newQty > 0
        ? ((oldQty * oldBuyPrice) + (addedQty * price)) / newQty
        : 0;
    const grossAmount = addedQty * price;
    const totalDeducted = grossAmount + fee;
    const accountBalance = Number(investment?.accountBalance ?? investment?.account_balance) || 0;
    const balanceAfter = accountBalance - totalDeducted;

    return (
        <Modal
            open={open}
            onClose={close}
            title={`Buy ${investment?.symbol || 'Investment'}`}
            subtitle="Add quantity to this existing asset"
            icon={<TrendingUp size={20} />}
            iconColor="#10B981"
            maxWidth="lg"
            footer={
                <ModalFooter
                    onCancel={close}
                    onSubmit={submit}
                    submitLabel="Buy Investment"
                    loading={loading}
                />
            }
        >
            <div className="space-y-4">
                {errors.general && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                        {errors.general}
                    </div>
                )}

                <div className="rounded-xl border border-border bg-muted/40 px-4 py-3">
                    <p className="text-xs text-muted-foreground">Investment Account</p>
                    <div className="mt-1 flex items-center justify-between gap-3">
                        <p className="font-bold text-foreground">{investment?.accountName || 'No investment account'}</p>
                        <p className="text-sm font-semibold text-foreground">Balance: {fmt(accountBalance)}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Quantity to Buy" required error={errors.qty}>
                        <Input type="number" min="0" step="0.00000001" value={form.qty} onChange={(event) => set('qty', event.target.value)} error={!!errors.qty} autoFocus />
                    </FormField>
                    <FormField label="Buy Price" required error={errors.price}>
                        <Input type="number" min="0" step="0.00000001" value={form.price} onChange={(event) => set('price', event.target.value)} error={!!errors.price} leftDecor={symbol} />
                    </FormField>
                    <FormField label="Fee" error={errors.fee}>
                        <Input type="number" min="0" step="0.01" value={form.fee} onChange={(event) => set('fee', event.target.value)} error={!!errors.fee} leftDecor={symbol} />
                    </FormField>
                    <FormField label="Current Price" hint="Optional; defaults to buy price" error={errors.currentPrice}>
                        <Input type="number" min="0" step="0.00000001" value={form.currentPrice} onChange={(event) => set('currentPrice', event.target.value)} error={!!errors.currentPrice} leftDecor={symbol} />
                    </FormField>
                </div>

                <FormField label="Date" error={errors.date}>
                    <Input type="date" value={form.date} onChange={(event) => set('date', event.target.value)} error={!!errors.date} />
                </FormField>

                <FormField label="Notes" error={errors.notes}>
                    <textarea className="finova-input w-full resize-none text-sm" rows={2} value={form.notes} onChange={(event) => set('notes', event.target.value)} placeholder="Optional purchase note..." />
                </FormField>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 rounded-xl border border-border bg-muted/40 p-4">
                    {[
                        ['Current Quantity', oldQty],
                        ['Added Quantity', addedQty],
                        ['New Quantity', newQty],
                        ['Old Average Buy Price', fmt(oldBuyPrice)],
                        ['New Average Buy Price', fmt(newAverage)],
                        ['Gross Amount', fmt(grossAmount)],
                        ['Fee', fmt(fee)],
                        ['Total Deducted', fmt(totalDeducted)],
                        ['Account Balance Before', fmt(accountBalance)],
                        ['Account Balance After', fmt(balanceAfter)],
                    ].map(([label, value]) => (
                        <div key={label} className="min-w-0 text-center">
                            <p className="text-xs text-muted-foreground">{label}</p>
                            <p className="mt-1 break-words font-bold text-foreground">{value}</p>
                        </div>
                    ))}
                </div>
            </div>
        </Modal>
    );
}

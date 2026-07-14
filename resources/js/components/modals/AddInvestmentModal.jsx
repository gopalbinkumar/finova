import { useEffect, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { Modal, FormField, Input, Select, ModalFooter } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCurrencyFormatter } from '@/utils/currency';

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
    accountId: '',
    symbol: '',
    name: '',
    type: 'stock',
    qty: '',
    buyPrice: '',
    currentPrice: '',
    date: new Date().toISOString().slice(0, 10),
    notes: '',
};

export function AddInvestmentModal({ open, onClose, onSaved }) {
    const { formatCurrency: fmt, symbol } = useCurrencyFormatter();
    const [form, setForm] = useState(INITIAL);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [accounts, setAccounts] = useState([]);
    const [accountsLoading, setAccountsLoading] = useState(false);

    useEffect(() => {
        if (!open) return;

        let active = true;
        setAccountsLoading(true);

        fetch('/api/accounts?type=investment', {
            headers: { Accept: 'application/json' },
            credentials: 'same-origin',
        })
            .then(async (response) => {
                const result = await response.json().catch(() => ({}));
                if (!response.ok) throw new Error(result.message || 'Failed to load investment accounts.');
                if (active) setAccounts(Array.isArray(result) ? result : result.data || []);
            })
            .catch((error) => {
                if (active) setErrors((current) => ({ ...current, general: error.message }));
            })
            .finally(() => {
                if (active) setAccountsLoading(false);
            });

        return () => {
            active = false;
        };
    }, [open]);

    const set = (key, value) => {
        setForm((prev) => ({
            ...prev,
            [key]: value,
        }));

        setErrors((prev) => ({
            ...prev,
            [key]: '',
            general: '',
        }));
    };

    const resetForm = () => {
        setForm({
            ...INITIAL,
            date: new Date().toISOString().slice(0, 10),
        });
        setErrors({});
        setLoading(false);
        setDone(false);
    };

    const handleClose = () => {
        if (loading) return;

        resetForm();
        onClose?.();
    };

    const validate = () => {
        const newErrors = {};

        if (!form.accountId) {
            newErrors.accountId = 'Select an investment account';
        }

        if (!form.symbol.trim()) {
            newErrors.symbol = 'Symbol is required';
        }

        if (!form.name.trim()) {
            newErrors.name = 'Name is required';
        }

        if (!form.qty || Number(form.qty) <= 0) {
            newErrors.qty = 'Enter quantity';
        }

        if (!form.buyPrice || Number(form.buyPrice) <= 0) {
            newErrors.buyPrice = 'Enter buy price';
        }

        if (form.currentPrice && Number(form.currentPrice) < 0) {
            newErrors.currentPrice = 'Current price cannot be negative';
        }

        return newErrors;
    };

    const getCsrfToken = () => {
        return document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content');
    };

    const handleSubmit = async () => {
        const validationErrors = validate();

        if (Object.keys(validationErrors).length) {
            setErrors(validationErrors);
            return;
        }

        setLoading(true);
        setErrors({});

        try {
            const payload = {
                accountId: Number(form.accountId),
                symbol: form.symbol.trim().toUpperCase(),
                name: form.name.trim(),
                type: form.type,
                qty: Number(form.qty),
                buyPrice: Number(form.buyPrice),
                currentPrice: form.currentPrice ? Number(form.currentPrice) : null,
                date: form.date || new Date().toISOString().slice(0, 10),
                notes: form.notes.trim() || null,
            };

            const response = await fetch('/api/investments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    ...(getCsrfToken() ? { 'X-CSRF-TOKEN': getCsrfToken() } : {}),
                },
                credentials: 'same-origin',
                body: JSON.stringify(payload),
            });

            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                if (result.errors) {
                    setErrors({
                        symbol: result.errors.symbol?.[0] || '',
                        accountId: result.errors.account_id?.[0] || '',
                        name: result.errors.name?.[0] || '',
                        type: result.errors.type?.[0] || '',
                        qty: result.errors.qty?.[0] || '',
                        buyPrice: result.errors.buy_price?.[0] || '',
                        currentPrice: result.errors.current_price?.[0] || '',
                        date: result.errors.purchase_date?.[0] || '',
                        notes: result.errors.notes?.[0] || '',
                        general: result.message || 'Failed to add investment',
                    });
                } else {
                    setErrors({
                        general: result.message || 'Failed to add investment',
                    });
                }

                return;
            }

            setDone(true);

            if (typeof onSaved === 'function') {
                onSaved(result.data);
            }

            setTimeout(() => {
                resetForm();
                onClose?.();
            }, 1000);
        } catch {
            setErrors({
                general: 'Network error. Please check your connection.',
            });
        } finally {
            setLoading(false);
        }
    };

    const qty = Number(form.qty) || 0;
    const buyPrice = Number(form.buyPrice) || 0;
    const currPrice = Number(form.currentPrice) || buyPrice;

    const totalCost = qty * buyPrice;
    const totalValue = qty * currPrice;
    const gain = totalValue - totalCost;
    const gainPct = totalCost > 0 ? (gain / totalCost) * 100 : 0;

    return (
        <Modal
            open={open}
            onClose={handleClose}
            title="Add Investment"
            subtitle="Track stocks, crypto, gold, or funds"
            icon={<TrendingUp size={20} />}
            iconColor="#6366F1"
            maxWidth="lg"
            footer={
                done ? (
                    <p className="text-center text-sm font-semibold text-primary-500">
                        📈 Investment added!
                    </p>
                ) : (
                    <ModalFooter
                        onCancel={handleClose}
                        onSubmit={handleSubmit}
                        submitLabel="Add Investment"
                        loading={loading}
                    />
                )
            }
        >
            <div className="space-y-4">
                {errors.general && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                        {errors.general}
                    </div>
                )}

                <FormField label="Investment Account" required error={errors.accountId}>
                    {accountsLoading ? (
                        <Skeleton className="h-11 w-full" />
                    ) : (
                        <Select
                            value={form.accountId}
                            onChange={(event) => set('accountId', event.target.value)}
                            options={accounts.map((account) => ({
                                value: String(account.id),
                                label: `${account.name} (${fmt(account.balance)})`,
                            }))}
                            placeholder="Select investment account"
                            error={!!errors.accountId}
                        />
                    )}
                    {!accountsLoading && accounts.length === 0 && (
                        <p className="text-xs text-amber-600">Create an account with type Investment first.</p>
                    )}
                </FormField>

                {/* Type */}
                <FormField label="Asset Type" required error={errors.type}>
                    <Select
                        value={form.type}
                        onChange={(event) => set('type', event.target.value)}
                        options={TYPE_OPTIONS}
                    />
                </FormField>

                {/* Symbol + Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Ticker / Symbol" required error={errors.symbol}>
                        <Input
                            placeholder="e.g. AAPL"
                            value={form.symbol}
                            onChange={(event) =>
                                set('symbol', event.target.value.toUpperCase())
                            }
                            error={!!errors.symbol}
                            className="uppercase font-mono font-bold"
                            autoFocus
                        />
                    </FormField>

                    <FormField label="Asset Name" required error={errors.name}>
                        <Input
                            placeholder="e.g. Apple Inc."
                            value={form.name}
                            onChange={(event) => set('name', event.target.value)}
                            error={!!errors.name}
                        />
                    </FormField>
                </div>

                {/* Qty + Buy Price + Current Price */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField label="Quantity" required error={errors.qty}>
                        <Input
                            type="number"
                            step="0.0001"
                            min="0"
                            placeholder="10"
                            value={form.qty}
                            onChange={(event) => set('qty', event.target.value)}
                            error={!!errors.qty}
                        />
                    </FormField>

                    <FormField label="Buy Price" required error={errors.buyPrice}>
                        <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="150.00"
                            value={form.buyPrice}
                            onChange={(event) => set('buyPrice', event.target.value)}
                            error={!!errors.buyPrice}
                            leftDecor={symbol}
                        />
                    </FormField>

                    <FormField
                        label="Current Price"
                        hint="Leave blank = buy price"
                        error={errors.currentPrice}
                    >
                        <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Same as buy"
                            value={form.currentPrice}
                            onChange={(event) => set('currentPrice', event.target.value)}
                            error={!!errors.currentPrice}
                            leftDecor={symbol}
                        />
                    </FormField>
                </div>

                {/* Purchase Date */}
                <FormField label="Purchase Date" error={errors.date}>
                    <Input
                        type="date"
                        value={form.date}
                        onChange={(event) => set('date', event.target.value)}
                        error={!!errors.date}
                    />
                </FormField>

                {/* Notes */}
                <FormField label="Notes" error={errors.notes}>
                    <textarea
                        className="finova-input w-full text-sm resize-none"
                        rows={2}
                        placeholder="Reason for investing..."
                        value={form.notes}
                        onChange={(event) => set('notes', event.target.value)}
                    />
                </FormField>

                {/* P&L Preview */}
                {qty > 0 && buyPrice > 0 && (
                    <div className="grid grid-cols-1 min-[380px]:grid-cols-3 gap-3 p-4 rounded-xl bg-muted/40 border border-border">
                        <div className="text-center">
                            <p className="text-xs text-muted-foreground mb-1">
                                Total Cost
                            </p>
                            <p className="font-bold text-foreground">
                                {fmt(totalCost)}
                            </p>
                        </div>

                        <div className="text-center">
                            <p className="text-xs text-muted-foreground mb-1">
                                Market Value
                            </p>
                            <p className="font-bold text-foreground">
                                {fmt(totalValue)}
                            </p>
                        </div>

                        <div className="text-center">
                            <p className="text-xs text-muted-foreground mb-1">
                                P&amp;L
                            </p>
                            <p
                                className={`font-bold ${
                                    gain >= 0 ? 'text-primary-500' : 'text-red-500'
                                }`}
                            >
                                {gain >= 0 ? '+' : ''}
                                {fmt(gain)}
                            </p>
                            <p
                                className={`text-xs font-semibold ${
                                    gain >= 0 ? 'text-primary-500' : 'text-red-500'
                                }`}
                            >
                                {gain >= 0 ? '+' : ''}
                                {gainPct.toFixed(2)}%
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}

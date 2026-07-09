import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Plus,
    TrendingUp,
    TrendingDown,
    Pencil,
    Trash2,
    RefreshCw,
} from "lucide-react";
import { SectionHeader } from "@/components/ui/Cards";
import {
    Modal,
    FormField,
    Input,
    Select,
    ModalFooter,
} from "@/components/ui/Modal";
import { AddInvestmentModal } from "@/components/modals/AddInvestmentModal";
import { BuyInvestmentModal } from "@/components/modals/BuyInvestmentModal";
import { SellInvestmentModal } from "@/components/modals/SellInvestmentModal";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
} from "recharts";

const TYPE_OPTIONS = [
    { value: "stock", label: "📈 Stock" },
    { value: "crypto", label: "₿ Crypto" },
    { value: "gold", label: "🥇 Gold" },
    { value: "mutual_fund", label: "📊 Mutual Fund" },
    { value: "bonds", label: "📜 Bonds" },
    { value: "etf", label: "🏦 ETF" },
    { value: "property", label: "🏠 Property" },
];

const TYPE_COLORS = {
    stock: "#6366F1",
    crypto: "#F59E0B",
    gold: "#EAB308",
    mutual_fund: "#10B981",
    bonds: "#3B82F6",
    etf: "#8B5CF6",
    property: "#EC4899",
    other: "#94A3B8",
};

const INITIAL_FORM = {
    accountId: "",
    symbol: "",
    name: "",
    type: "stock",
    qty: "",
    buyPrice: "",
    currentPrice: "",
    date: new Date().toISOString().slice(0, 10),
    notes: "",
};

const fmt = (n) =>
    new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(Number(n) || 0);

const fmtPct = (n) => {
    const value = Number.isFinite(Number(n)) ? Number(n) : 0;
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
};

const pnlColor = (value) =>
    Number(value) >= 0 ? "text-primary-500" : "text-red-500";

const normalizePnl = (payload = {}) => ({
    realizedPnl: Number(payload.realizedPnl ?? payload.realized_pnl ?? 0),
    realizedGain: Number(payload.realizedGain ?? payload.realized_gain ?? 0),
    realizedLoss: Number(payload.realizedLoss ?? payload.realized_loss ?? 0),
    unrealizedPnl: Number(payload.unrealizedPnl ?? payload.unrealized_pnl ?? 0),
    totalPnl: Number(payload.totalPnl ?? payload.total_pnl ?? 0),
    realizedCount: Number(payload.realizedCount ?? payload.realized_count ?? 0),
    winningTrades: Number(payload.winningTrades ?? payload.winning_trades ?? 0),
    losingTrades: Number(payload.losingTrades ?? payload.losing_trades ?? 0),
    history: Array.isArray(payload.history)
        ? payload.history.map((item) => ({
              month: item.month || "",
              realizedPnl: Number(item.realizedPnl ?? item.realized_pnl ?? 0),
          }))
        : [],
});

const typeIcon = (type) => {
    if (type === "crypto") return "₿";
    if (type === "stock") return "📈";
    if (type === "gold") return "🥇";
    if (type === "mutual_fund") return "📊";
    if (type === "bonds") return "📜";
    if (type === "etf") return "🏦";
    if (type === "property") return "🏠";

    return "💼";
};

const typeLabel = (type) => {
    return String(type || "other").replace("_", " ");
};

const getCsrfToken = () => {
    return document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute("content");
};

const requestHeaders = () => ({
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(getCsrfToken() ? { "X-CSRF-TOKEN": getCsrfToken() } : {}),
});

const parseDate = (value) => {
    if (!value) return null;

    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date;
};

const normalizeInvestment = (item) => {
    const qty = Number(item.qty ?? item.quantity ?? 0);
    const buyPrice = Number(
        item.buyPrice ?? item.buy_price ?? item.avgCost ?? 0,
    );
    const currentPrice = Number(
        item.currentPrice ?? item.current_price ?? buyPrice ?? 0,
    );

    const totalCost = qty * buyPrice;
    const totalValue = qty * currentPrice;
    const gain = totalValue - totalCost;
    const gainPct = totalCost > 0 ? (gain / totalCost) * 100 : 0;

    return {
        id: item.id,
        accountId: item.accountId ?? item.account_id ?? null,
        accountName:
            item.accountName ?? item.account_name ?? item.account?.name ?? "",
        accountBalance: Number(
            item.accountBalance ??
                item.account_balance ??
                item.account?.balance ??
                0,
        ),
        accountCurrency:
            item.accountCurrency ??
            item.account_currency ??
            item.account?.currency ??
            "USD",
        symbol: item.symbol || "",
        name: item.name || "",
        type: item.type || "stock",
        qty,
        buyPrice,
        currentPrice,
        date: item.date ?? item.purchase_date ?? item.purchaseDate ?? "",
        notes: item.notes || "",
        totalCost: Number(item.totalCost ?? item.total_cost ?? totalCost),
        totalValue: Number(item.totalValue ?? item.total_value ?? totalValue),
        gain: Number(item.gain ?? gain),
        gainPct: Number(item.gainPct ?? item.gain_percentage ?? gainPct),
    };
};

const makePortfolioHistory = (investments) => {
    const today = new Date();
    const months = [];

    for (let i = 5; i >= 0; i -= 1) {
        const monthDate = new Date(
            today.getFullYear(),
            today.getMonth() - i,
            1,
        );
        const endOfMonth = new Date(
            monthDate.getFullYear(),
            monthDate.getMonth() + 1,
            0,
            23,
            59,
            59,
        );

        const value = investments.reduce((sum, investment) => {
            const purchaseDate = parseDate(investment.date);

            if (!purchaseDate || purchaseDate <= endOfMonth) {
                return sum + investment.totalValue;
            }

            return sum;
        }, 0);

        months.push({
            date: monthDate.toLocaleDateString("en-US", { month: "short" }),
            value,
        });
    }

    return months;
};

const makeAllocationData = (investments) => {
    const grouped = investments.reduce((acc, investment) => {
        const key = investment.type || "other";

        acc[key] = (acc[key] || 0) + investment.totalValue;

        return acc;
    }, {});

    return Object.entries(grouped)
        .map(([type, value]) => ({
            name: typeLabel(type),
            type,
            value,
            color: TYPE_COLORS[type] || TYPE_COLORS.other,
        }))
        .sort((a, b) => b.value - a.value);
};

function EditInvestmentModal({ open, investment, accounts, onClose, onSaved }) {
    const [form, setForm] = useState(INITIAL_FORM);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);

    useEffect(() => {
        if (!investment) return;

        setForm({
            accountId: investment.accountId ? String(investment.accountId) : "",
            symbol: investment.symbol || "",
            name: investment.name || "",
            type: investment.type || "stock",
            qty: investment.qty ? String(investment.qty) : "",
            buyPrice: investment.buyPrice ? String(investment.buyPrice) : "",
            currentPrice: investment.currentPrice
                ? String(investment.currentPrice)
                : "",
            date: investment.date || new Date().toISOString().slice(0, 10),
            notes: investment.notes || "",
        });

        setErrors({});
        setDone(false);
        setLoading(false);
    }, [investment]);

    const set = (key, value) => {
        setForm((prev) => ({
            ...prev,
            [key]: value,
        }));

        setErrors((prev) => ({
            ...prev,
            [key]: "",
            general: "",
        }));
    };

    const validate = () => {
        const newErrors = {};

        if (!form.accountId) {
            newErrors.accountId = "Select an investment account";
        }

        if (!form.symbol.trim()) {
            newErrors.symbol = "Symbol is required";
        }

        if (!form.name.trim()) {
            newErrors.name = "Name is required";
        }

        if (!form.qty || Number(form.qty) <= 0) {
            newErrors.qty = "Enter quantity";
        }

        if (!form.buyPrice || Number(form.buyPrice) <= 0) {
            newErrors.buyPrice = "Enter buy price";
        }

        if (form.currentPrice && Number(form.currentPrice) < 0) {
            newErrors.currentPrice = "Current price cannot be negative";
        }

        return newErrors;
    };

    const handleClose = () => {
        if (loading) return;

        setErrors({});
        setDone(false);
        onClose?.();
    };

    const handleSubmit = async () => {
        if (!investment?.id) return;

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
                currentPrice: form.currentPrice
                    ? Number(form.currentPrice)
                    : null,
                date: form.date || new Date().toISOString().slice(0, 10),
                notes: form.notes.trim() || null,
            };

            const response = await fetch(`/api/investments/${investment.id}`, {
                method: "PATCH",
                headers: requestHeaders(),
                credentials: "same-origin",
                body: JSON.stringify(payload),
            });

            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                if (result.errors) {
                    setErrors({
                        accountId: result.errors.account_id?.[0] || "",
                        symbol: result.errors.symbol?.[0] || "",
                        name: result.errors.name?.[0] || "",
                        type: result.errors.type?.[0] || "",
                        qty: result.errors.qty?.[0] || "",
                        buyPrice: result.errors.buy_price?.[0] || "",
                        currentPrice: result.errors.current_price?.[0] || "",
                        date: result.errors.purchase_date?.[0] || "",
                        notes: result.errors.notes?.[0] || "",
                        general:
                            result.message || "Failed to update investment",
                    });
                } else {
                    setErrors({
                        general:
                            result.message || "Failed to update investment",
                    });
                }

                return;
            }

            setDone(true);
            onSaved?.(result.data);

            setTimeout(() => {
                setDone(false);
                onClose?.();
            }, 800);
        } catch {
            setErrors({
                general: "Network error. Please check your connection.",
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
            title="Edit Investment"
            subtitle="Update your asset information"
            icon={<TrendingUp size={20} />}
            iconColor="#6366F1"
            maxWidth="lg"
            footer={
                done ? (
                    <p className="text-center text-sm font-semibold text-primary-500">
                        📈 Investment updated!
                    </p>
                ) : (
                    <ModalFooter
                        onCancel={handleClose}
                        onSubmit={handleSubmit}
                        submitLabel="Save Changes"
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

                <FormField
                    label="Investment Account"
                    required
                    error={errors.accountId}
                >
                    <Select
                        value={form.accountId}
                        onChange={(event) =>
                            set("accountId", event.target.value)
                        }
                        options={accounts.map((account) => ({
                            value: String(account.id),
                            label: account.name,
                        }))}
                        placeholder="Select investment account"
                        error={!!errors.accountId}
                    />
                </FormField>

                <FormField label="Asset Type" required error={errors.type}>
                    <Select
                        value={form.type}
                        onChange={(event) => set("type", event.target.value)}
                        options={TYPE_OPTIONS}
                    />
                </FormField>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                        label="Ticker / Symbol"
                        required
                        error={errors.symbol}
                    >
                        <Input
                            placeholder="e.g. AAPL"
                            value={form.symbol}
                            onChange={(event) =>
                                set("symbol", event.target.value.toUpperCase())
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
                            onChange={(event) =>
                                set("name", event.target.value)
                            }
                            error={!!errors.name}
                        />
                    </FormField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField label="Quantity" required error={errors.qty}>
                        <Input
                            type="number"
                            step="0.0001"
                            min="0"
                            placeholder="10"
                            value={form.qty}
                            onChange={(event) => set("qty", event.target.value)}
                            error={!!errors.qty}
                        />
                    </FormField>

                    <FormField
                        label="Buy Price"
                        required
                        error={errors.buyPrice}
                    >
                        <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="150.00"
                            value={form.buyPrice}
                            onChange={(event) =>
                                set("buyPrice", event.target.value)
                            }
                            error={!!errors.buyPrice}
                            leftDecor="$"
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
                            onChange={(event) =>
                                set("currentPrice", event.target.value)
                            }
                            error={!!errors.currentPrice}
                            leftDecor="$"
                        />
                    </FormField>
                </div>

                <FormField label="Purchase Date" error={errors.date}>
                    <Input
                        type="date"
                        value={form.date}
                        onChange={(event) => set("date", event.target.value)}
                        error={!!errors.date}
                    />
                </FormField>

                <FormField label="Notes" error={errors.notes}>
                    <textarea
                        className="finova-input w-full text-sm resize-none"
                        rows={2}
                        placeholder="Reason for investing..."
                        value={form.notes}
                        onChange={(event) => set("notes", event.target.value)}
                    />
                </FormField>

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
                                    gain >= 0
                                        ? "text-primary-500"
                                        : "text-red-500"
                                }`}
                            >
                                {gain >= 0 ? "+" : ""}
                                {fmt(gain)}
                            </p>
                            <p
                                className={`text-xs font-semibold ${
                                    gain >= 0
                                        ? "text-primary-500"
                                        : "text-red-500"
                                }`}
                            >
                                {gain >= 0 ? "+" : ""}
                                {gainPct.toFixed(2)}%
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}

function DeleteInvestmentModal({ open, investment, onClose, onDeleted }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (open) {
            setError("");
            setLoading(false);
        }
    }, [open]);

    const handleClose = () => {
        if (loading) return;

        setError("");
        onClose?.();
    };

    const handleDelete = async () => {
        if (!investment?.id) return;

        setLoading(true);
        setError("");

        try {
            const response = await fetch(`/api/investments/${investment.id}`, {
                method: "DELETE",
                headers: requestHeaders(),
                credentials: "same-origin",
            });

            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                setError(result.message || "Failed to delete investment.");
                return;
            }

            onDeleted?.(investment.id);
            onClose?.();
        } catch {
            setError("Network error. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            open={open}
            onClose={handleClose}
            title="Delete Investment"
            subtitle="This action cannot be undone"
            icon={<Trash2 size={20} />}
            iconColor="#EF4444"
            maxWidth="sm"
            footer={
                <ModalFooter
                    onCancel={handleClose}
                    onSubmit={handleDelete}
                    submitLabel="Delete"
                    loading={loading}
                />
            }
        >
            <div className="space-y-4">
                {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                        {error}
                    </div>
                )}

                <p className="text-sm text-muted-foreground">
                    Are you sure you want to delete{" "}
                    <span className="font-bold text-foreground">
                        {investment?.symbol}
                    </span>{" "}
                    from your investment portfolio?
                </p>
            </div>
        </Modal>
    );
}

export function InvestmentsPage() {
    const [showModal, setShowModal] = useState(false);
    const [investments, setInvestments] = useState([]);
    const [investmentAccounts, setInvestmentAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetching, setFetching] = useState(false);
    const [error, setError] = useState("");
    const [editing, setEditing] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [buying, setBuying] = useState(null);
    const [selling, setSelling] = useState(null);
    const [pnl, setPnl] = useState(() => normalizePnl());
    const [pnlLoading, setPnlLoading] = useState(true);
    const [pnlError, setPnlError] = useState("");

    const fetchInvestments = useCallback(async () => {
        setFetching(true);
        setError("");

        try {
            const response = await fetch("/api/investments", {
                headers: {
                    Accept: "application/json",
                },
                credentials: "same-origin",
            });

            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                setError(result.message || "Failed to load investments.");
                return;
            }

            const rows = Array.isArray(result) ? result : result.data || [];

            setInvestments(rows.map(normalizeInvestment));
        } catch {
            setError("Network error. Please check your connection.");
        } finally {
            setLoading(false);
            setFetching(false);
        }
    }, []);

    const fetchInvestmentAccounts = useCallback(async () => {
        try {
            const response = await fetch("/api/accounts?type=investment", {
                headers: { Accept: "application/json" },
                credentials: "same-origin",
            });
            const result = await response.json().catch(() => ({}));
            if (response.ok) {
                setInvestmentAccounts(
                    Array.isArray(result) ? result : result.data || [],
                );
            }
        } catch {
            // Investment loading already provides the primary page error state.
        }
    }, []);

    const fetchPnl = useCallback(async () => {
        setPnlLoading(true);
        setPnlError("");

        try {
            const response = await fetch("/api/investments/pnl", {
                headers: { Accept: "application/json" },
                credentials: "same-origin",
            });
            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                setPnlError("Failed to load investment PnL.");
                return;
            }

            setPnl(normalizePnl(result.data ?? result));
        } catch {
            setPnlError("Failed to load investment PnL.");
        } finally {
            setPnlLoading(false);
        }
    }, []);

    const refreshInvestmentData = useCallback(() => {
        fetchInvestments();
        fetchInvestmentAccounts();
        fetchPnl();
    }, [fetchInvestmentAccounts, fetchInvestments, fetchPnl]);

    useEffect(() => {
        refreshInvestmentData();
    }, [refreshInvestmentData]);

    const totalValue = useMemo(() => {
        return investments.reduce(
            (sum, investment) => sum + investment.totalValue,
            0,
        );
    }, [investments]);

    const totalCost = useMemo(() => {
        return investments.reduce(
            (sum, investment) => sum + investment.totalCost,
            0,
        );
    }, [investments]);

    const totalGain = totalValue - totalCost;
    const totalPct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

    const portfolioHistory = useMemo(() => {
        return makePortfolioHistory(investments);
    }, [investments]);

    const investmentAllocationData = useMemo(() => {
        return makeAllocationData(investments);
    }, [investments]);

    const topPerformers = useMemo(() => {
        return [...investments]
            .sort((a, b) => b.gainPct - a.gainPct)
            .slice(0, 4);
    }, [investments]);

    const handleSaved = () => {
        refreshInvestmentData();
    };

    const handleUpdated = () => {
        refreshInvestmentData();
    };

    const handleDeleted = (id) => {
        setInvestments((prev) =>
            prev.filter((investment) => investment.id !== id),
        );
        refreshInvestmentData();
    };

    const handleSold = (result) => {
        if (result?.mode === "sold_all" && selling?.id) {
            setInvestments((current) =>
                current.filter((investment) => investment.id !== selling.id),
            );
        }

        refreshInvestmentData();
    };

    return (
        <>
            <AddInvestmentModal
                open={showModal}
                onClose={() => setShowModal(false)}
                onSaved={handleSaved}
            />

            <EditInvestmentModal
                open={!!editing}
                investment={editing}
                accounts={investmentAccounts}
                onClose={() => setEditing(null)}
                onSaved={handleUpdated}
            />

            <BuyInvestmentModal
                open={!!buying}
                investment={buying}
                onClose={() => setBuying(null)}
                onSaved={refreshInvestmentData}
            />

            <SellInvestmentModal
                open={!!selling}
                investment={selling}
                onClose={() => setSelling(null)}
                onSaved={handleSold}
            />

            <DeleteInvestmentModal
                open={!!deleting}
                investment={deleting}
                onClose={() => setDeleting(null)}
                onDeleted={handleDeleted}
            />

            <div className="min-w-0 max-w-full space-y-4 sm:space-y-6 animate-in overflow-x-hidden">
                {/* Portfolio hero banner */}
                <div
                    className="relative min-w-0 rounded-2xl overflow-hidden p-4 sm:p-6 text-white"
                    style={{
                        background:
                            "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
                    }}
                >
                    <div className="relative z-10">
                        <p className="text-white/60 text-sm mb-1">
                            Total Portfolio Value
                        </p>

                        <p className="text-2xl min-[380px]:text-3xl sm:text-4xl font-bold mb-2 break-words">
                            {loading ? "Loading..." : fmt(totalValue)}
                        </p>

                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            {totalGain >= 0 ? (
                                <TrendingUp
                                    size={18}
                                    className="text-green-400"
                                />
                            ) : (
                                <TrendingDown
                                    size={18}
                                    className="text-red-400"
                                />
                            )}

                            <span
                                className={`font-semibold ${
                                    totalGain >= 0
                                        ? "text-green-400"
                                        : "text-red-400"
                                }`}
                            >
                                {totalGain >= 0 ? "+" : ""}
                                {fmt(totalGain)} ({fmtPct(totalPct)})
                            </span>

                            <span className="w-full min-[420px]:w-auto text-white/50 text-sm">
                                total return
                            </span>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                        {error}
                    </div>
                )}

                {/* Quick stats */}
                <div className="finova-card overflow-hidden p-2 sm:p-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4">
                        {[
                            {
                                title: "Invested",
                                value: fmt(totalCost),
                                color: "#3B82F6",
                            },
                            {
                                title: "Return",
                                value: fmt(totalGain),
                                color: totalGain >= 0 ? "#2563EB" : "#EF4444",
                            },
                            {
                                title: "Return %",
                                value: fmtPct(totalPct),
                                color: totalPct >= 0 ? "#2563EB" : "#EF4444",
                            },
                            {
                                title: "Assets",
                                value: `${investments.length}`,
                                color: "#8B5CF6",
                            },
                        ].map((stat, index) => (
                            <div
                                key={stat.title}
                                className={`min-w-0 px-3 py-4 text-center sm:px-5 ${
                                    index % 2 === 1
                                        ? ""
                                        : "border-r border-border"
                                } ${index < 2 ? "border-b sm:border-b-0" : ""} ${
                                    index > 0
                                        ? "sm:border-l sm:border-r-0"
                                        : "sm:border-r-0"
                                }`}
                            >
                                <p className="text-xs font-medium text-muted-foreground">
                                    {stat.title}
                                </p>
                                <p
                                    className="mt-1 break-words text-lg font-bold tabular-nums sm:text-xl"
                                    style={{ color: stat.color }}
                                >
                                    {loading ? "..." : stat.value}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid min-w-0 max-w-full gap-4 sm:gap-6 lg:grid-flow-row-dense lg:grid-cols-3">
                    {/* Investment PnL */}
                    <div className="finova-card min-w-0 max-w-full p-4 sm:p-6 overflow-hidden lg:col-span-2 lg:order-1">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <SectionHeader
                                title="Investment PnL"
                                subtitle="Realized performance and current unrealized return"
                            />
                            <div className="py-1 text-left sm:text-right">
                                <p className="text-xs font-medium text-muted-foreground">
                                    Total PnL
                                </p>
                                <p
                                    className={`text-xl sm:text-2xl font-bold tabular-nums ${pnlColor(pnl.totalPnl)}`}
                                >
                                    {pnlLoading ? "..." : fmt(pnl.totalPnl)}
                                </p>
                            </div>
                        </div>

                        {pnlError && (
                            <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                                {pnlError}
                            </p>
                        )}

                        <div className="mt-4 grid grid-cols-2 border-y border-border sm:grid-cols-3">
                            {[
                                [
                                    "Realized PnL",
                                    pnl.realizedPnl,
                                    pnlColor(pnl.realizedPnl),
                                ],
                                [
                                    "Unrealized PnL",
                                    pnl.unrealizedPnl,
                                    pnlColor(pnl.unrealizedPnl),
                                ],
                                [
                                    "Realized Gain",
                                    pnl.realizedGain,
                                    "text-primary-500",
                                ],
                                [
                                    "Realized Loss",
                                    pnl.realizedLoss,
                                    "text-red-500",
                                ],
                                [
                                    "Winning Trades",
                                    pnl.winningTrades,
                                    "text-primary-500",
                                    false,
                                ],
                                [
                                    "Losing Trades",
                                    pnl.losingTrades,
                                    "text-red-500",
                                    false,
                                ],
                            ].map(([label, value, color, currency = true], index) => (
                                <div
                                    key={label}
                                    className={`min-w-0 px-3 py-4 text-center sm:px-4 ${
                                        index % 2 === 0 ? "border-r border-border" : ""
                                    } ${index < 4 ? "border-b border-border" : ""} ${
                                        index % 3 !== 0 ? "sm:border-l sm:border-border" : "sm:border-l-0"
                                    } ${index < 3 ? "sm:border-b" : "sm:border-b-0"} sm:border-r-0`}
                                >
                                    <p className="text-xs text-muted-foreground">
                                        {label}
                                    </p>
                                    <p
                                        className={`mt-1 break-words text-base font-bold tabular-nums ${color}`}
                                    >
                                        {pnlLoading
                                            ? "..."
                                            : currency
                                              ? fmt(value)
                                              : value}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <p className="mt-3 text-xs text-muted-foreground">
                            {pnlLoading
                                ? "Loading realized trades..."
                                : `${pnl.realizedCount} realized trade${pnl.realizedCount === 1 ? "" : "s"} recorded`}
                        </p>

                        {pnl.history.length > 0 && (
                            <div className="mt-5 border-t border-border pt-4">
                                <p className="mb-3 text-sm font-semibold text-foreground">
                                    Realized PnL History
                                </p>
                                <ResponsiveContainer width="100%" height={190}>
                                    <LineChart data={pnl.history}>
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="var(--border)"
                                            vertical={false}
                                        />
                                        <XAxis
                                            dataKey="month"
                                            tick={{
                                                fontSize: 11,
                                                fill: "var(--muted-foreground)",
                                            }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            tick={{
                                                fontSize: 11,
                                                fill: "var(--muted-foreground)",
                                            }}
                                            axisLine={false}
                                            tickLine={false}
                                            tickFormatter={(value) =>
                                                `$${Number(value) / 1000}k`
                                            }
                                        />
                                        <Tooltip
                                            formatter={(value) => [
                                                fmt(Number(value)),
                                                "Realized PnL",
                                            ]}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="realizedPnl"
                                            stroke="#6366F1"
                                            strokeWidth={3}
                                            dot={{ fill: "#6366F1", r: 4 }}
                                            activeDot={{ r: 6 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>

                    <div className="contents">
                        {/* Main column */}
                        <div className="contents">
                            {/* Growth chart */}
                            <div className="finova-card min-w-0 max-w-full p-4 sm:p-6 overflow-hidden lg:col-span-2 lg:order-1">
                                <div className="flex items-start justify-between gap-3">
                                    <SectionHeader
                                        title="Portfolio Growth"
                                        subtitle="Estimated 6-month performance"
                                    />

                                    <button
                                        type="button"
                                        onClick={refreshInvestmentData}
                                        disabled={fetching}
                                        className="shrink-0 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all disabled:opacity-60"
                                    >
                                        <RefreshCw
                                            size={14}
                                            className={
                                                fetching ? "animate-spin" : ""
                                            }
                                        />
                                    </button>
                                </div>

                                <ResponsiveContainer width="100%" height={220}>
                                    <LineChart data={portfolioHistory}>
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="var(--border)"
                                            vertical={false}
                                        />
                                        <XAxis
                                            dataKey="date"
                                            tick={{
                                                fontSize: 11,
                                                fill: "var(--muted-foreground)",
                                            }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            tick={{
                                                fontSize: 11,
                                                fill: "var(--muted-foreground)",
                                            }}
                                            axisLine={false}
                                            tickLine={false}
                                            tickFormatter={(value) =>
                                                `$${Number(value) / 1000}k`
                                            }
                                        />
                                        <Tooltip
                                            formatter={(value) => [
                                                fmt(Number(value)),
                                                "Portfolio",
                                            ]}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="value"
                                            stroke="#6366F1"
                                            strokeWidth={3}
                                            dot={{
                                                fill: "#6366F1",
                                                r: 4,
                                            }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Holdings table */}
                            <div className="finova-card min-w-0 w-full max-w-full p-4 sm:p-6 overflow-hidden lg:col-span-3 lg:order-3">
                                <div className="flex flex-col min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between gap-3 mb-5">
                                    <SectionHeader title="Holdings" />

                                    <button
                                        onClick={() => setShowModal(true)}
                                        className="btn-primary self-start min-[420px]:self-auto flex items-center gap-2 text-sm px-4 py-2 whitespace-nowrap"
                                    >
                                        <Plus size={16} />
                                        Add Investment
                                    </button>
                                </div>

                                <div className="w-full max-w-full overflow-x-auto overscroll-x-contain">
                                    <table className="finova-table min-w-[1160px]">
                                        <thead>
                                            <tr>
                                                <th>Account</th>
                                                <th>Asset</th>
                                                <th>Type</th>
                                                <th>Qty</th>
                                                <th>Buy Price</th>
                                                <th>Current Price</th>
                                                <th>Market Value</th>
                                                <th className="text-right">
                                                    Gain / Loss
                                                </th>
                                                <th className="text-right">
                                                    Action
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {loading && (
                                                <tr>
                                                    <td
                                                        colSpan={9}
                                                        className="py-8 text-center text-sm text-muted-foreground"
                                                    >
                                                        Loading investments...
                                                    </td>
                                                </tr>
                                            )}

                                            {!loading &&
                                                investments.length === 0 && (
                                                    <tr>
                                                        <td
                                                            colSpan={9}
                                                            className="py-8 text-center text-sm text-muted-foreground"
                                                        >
                                                            No investments yet.
                                                            Add your first asset
                                                            to start tracking
                                                            your portfolio.
                                                        </td>
                                                    </tr>
                                                )}

                                            {!loading &&
                                                investments.map(
                                                    (investment) => (
                                                        <tr
                                                            key={investment.id}
                                                            className="cursor-pointer"
                                                        >
                                                            <td>
                                                                <p className="text-sm font-semibold text-foreground">
                                                                    {investment.accountName ||
                                                                        "Unassigned"}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {fmt(
                                                                        investment.accountBalance,
                                                                    )}
                                                                </p>
                                                            </td>
                                                            <td>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-lg">
                                                                        {typeIcon(
                                                                            investment.type,
                                                                        )}
                                                                    </span>
                                                                    <div>
                                                                        <p className="font-bold text-sm text-foreground">
                                                                            {
                                                                                investment.symbol
                                                                            }
                                                                        </p>
                                                                        <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                                                                            {
                                                                                investment.name
                                                                            }
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            <td className="capitalize text-xs text-muted-foreground">
                                                                {typeLabel(
                                                                    investment.type,
                                                                )}
                                                            </td>

                                                            <td className="text-sm text-foreground">
                                                                {investment.qty}
                                                            </td>

                                                            <td className="text-sm text-muted-foreground">
                                                                {fmt(
                                                                    investment.buyPrice,
                                                                )}
                                                            </td>

                                                            <td className="text-sm font-medium text-foreground">
                                                                {fmt(
                                                                    investment.currentPrice,
                                                                )}
                                                            </td>

                                                            <td className="text-sm font-semibold text-foreground">
                                                                {fmt(
                                                                    investment.totalValue,
                                                                )}
                                                            </td>

                                                            <td className="text-right">
                                                                <div
                                                                    className={`flex items-center justify-end gap-1 text-sm font-bold ${
                                                                        investment.gain >=
                                                                        0
                                                                            ? "text-primary-500"
                                                                            : "text-red-500"
                                                                    }`}
                                                                >
                                                                    {investment.gain >=
                                                                    0 ? (
                                                                        <TrendingUp
                                                                            size={
                                                                                14
                                                                            }
                                                                        />
                                                                    ) : (
                                                                        <TrendingDown
                                                                            size={
                                                                                14
                                                                            }
                                                                        />
                                                                    )}
                                                                    <span>
                                                                        {fmtPct(
                                                                            investment.gainPct,
                                                                        )}
                                                                    </span>
                                                                </div>

                                                                <p
                                                                    className={`text-xs text-right ${
                                                                        investment.gain >=
                                                                        0
                                                                            ? "text-primary-500"
                                                                            : "text-red-500"
                                                                    }`}
                                                                >
                                                                    {investment.gain >=
                                                                    0
                                                                        ? "+"
                                                                        : ""}
                                                                    {fmt(
                                                                        investment.gain,
                                                                    )}
                                                                </p>
                                                            </td>

                                                            <td className="text-right">
                                                                <div className="flex items-center justify-end gap-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setBuying(
                                                                                investment,
                                                                            )
                                                                        }
                                                                        className="inline-flex h-8 items-center justify-center rounded-lg border border-emerald-200 px-2.5 text-xs font-semibold text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50 transition-all"
                                                                        title="Buy more"
                                                                    >
                                                                        Buy
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setSelling(
                                                                                investment,
                                                                            )
                                                                        }
                                                                        className="inline-flex h-8 items-center justify-center rounded-lg border border-red-200 px-2.5 text-xs font-semibold text-red-500 hover:border-red-300 hover:bg-red-50 transition-all"
                                                                        title="Sell"
                                                                    >
                                                                        Sell
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setEditing(
                                                                                investment,
                                                                            )
                                                                        }
                                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-indigo-500 hover:border-indigo-300 hover:bg-indigo-50 transition-all"
                                                                        title="Edit"
                                                                    >
                                                                        <Pencil
                                                                            size={
                                                                                14
                                                                            }
                                                                        />
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setDeleting(
                                                                                investment,
                                                                            )
                                                                        }
                                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-red-500 hover:border-red-300 hover:bg-red-50 transition-all"
                                                                        title="Delete"
                                                                    >
                                                                        <Trash2
                                                                            size={
                                                                                14
                                                                            }
                                                                        />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ),
                                                )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Add row button */}
                                <button
                                    onClick={() => setShowModal(true)}
                                    className="mt-4 w-full py-3 rounded-xl border-2 border-dashed border-border hover:border-indigo-400 text-muted-foreground hover:text-indigo-500 transition-all flex items-center justify-center gap-2 text-sm font-medium"
                                >
                                    <Plus size={16} />
                                    Add New Investment
                                </button>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="min-w-0 max-w-full space-y-4 sm:space-y-6 lg:col-span-1 lg:order-1 lg:row-span-2">
                            {/* Allocation donut */}
                            <div className="finova-card min-w-0 max-w-full p-4 sm:p-6 overflow-hidden">
                                <SectionHeader
                                    title="Allocation"
                                    subtitle="By asset class"
                                />

                                {investmentAllocationData.length > 0 ? (
                                    <>
                                        <ResponsiveContainer
                                            width="100%"
                                            height={180}
                                        >
                                            <PieChart>
                                                <Pie
                                                    data={
                                                        investmentAllocationData
                                                    }
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={50}
                                                    outerRadius={75}
                                                    dataKey="value"
                                                    stroke="none"
                                                >
                                                    {investmentAllocationData.map(
                                                        (entry) => (
                                                            <Cell
                                                                key={entry.type}
                                                                fill={
                                                                    entry.color
                                                                }
                                                            />
                                                        ),
                                                    )}
                                                </Pie>
                                                <Tooltip
                                                    formatter={(value) =>
                                                        fmt(Number(value))
                                                    }
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>

                                        <div className="space-y-2 mt-2">
                                            {investmentAllocationData.map(
                                                (item) => (
                                                    <div
                                                        key={item.type}
                                                        className="flex min-w-0 items-center justify-between gap-3 text-xs"
                                                    >
                                                        <div className="flex min-w-0 items-center gap-2">
                                                            <span
                                                                className="w-2.5 h-2.5 rounded-full"
                                                                style={{
                                                                    background:
                                                                        item.color,
                                                                }}
                                                            />
                                                            <span className="truncate text-muted-foreground capitalize">
                                                                {item.name}
                                                            </span>
                                                        </div>

                                                        <span className="shrink-0 text-right font-semibold text-foreground tabular-nums">
                                                            {fmt(item.value)}
                                                        </span>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <p className="py-8 text-center text-sm text-muted-foreground">
                                        No allocation data yet.
                                    </p>
                                )}
                            </div>

                            {/* Top performers */}
                            <div className="finova-card min-w-0 max-w-full p-4 sm:p-6 overflow-hidden">
                                <SectionHeader title="Top Performers" />

                                <div className="space-y-3">
                                    {topPerformers.length > 0 ? (
                                        topPerformers.map((investment) => (
                                            <div
                                                key={investment.id}
                                                className="flex min-w-0 items-center justify-between gap-3"
                                            >
                                                <div className="flex min-w-0 items-center gap-2">
                                                    <span className="text-lg">
                                                        {typeIcon(
                                                            investment.type,
                                                        )}
                                                    </span>

                                                    <div className="min-w-0">
                                                        <p className="text-sm font-bold text-foreground">
                                                            {investment.symbol}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {investment.qty}{" "}
                                                            units
                                                        </p>
                                                    </div>
                                                </div>

                                                <span
                                                    className={`shrink-0 text-sm font-bold ${
                                                        investment.gainPct >= 0
                                                            ? "text-primary-500"
                                                            : "text-red-500"
                                                    }`}
                                                >
                                                    {fmtPct(investment.gainPct)}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="py-4 text-center text-sm text-muted-foreground">
                                            No performers yet.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

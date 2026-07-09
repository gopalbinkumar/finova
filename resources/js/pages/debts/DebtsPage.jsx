import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Plus,
    CheckCircle2,
    Clock,
    Pencil,
    Trash2,
    RefreshCw,
    CreditCard,
} from "lucide-react";
import { SectionHeader, ProgressBar } from "@/components/ui/Cards";
import { Modal, FormField, Input, ModalFooter } from "@/components/ui/Modal";
import { AddDebtModal } from "@/components/modals/AddDebtModal";

const INITIAL_FORM = {
    type: "debt",
    borrower: "",
    amount: "",
    remaining: "",
    dueDate: "",
    notes: "",
};

const fmt = (number) =>
    new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(Number(number) || 0);

const fmtDate = (value) => {
    if (!value) return "-";

    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
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

const calculateDaysLeft = (value) => {
    if (!value) return null;

    const dueDate = new Date(`${value}T00:00:00`);

    if (Number.isNaN(dueDate.getTime())) {
        return null;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return Math.ceil((dueDate.getTime() - today.getTime()) / 86_400_000);
};

const normalizeDebt = (item) => {
    const amount = Number(item.amount ?? 0);
    const remaining = Number(
        item.remaining ??
            item.remainingBalance ??
            item.remaining_balance ??
            amount,
    );

    const dueDate = item.dueDate ?? item.due_date ?? "";
    const daysLeft =
        item.daysLeft ?? item.days_left ?? calculateDaysLeft(dueDate);

    const paidAmount = Number(
        item.paidAmount ?? item.paid_amount ?? Math.max(amount - remaining, 0),
    );

    const paidPct = Number(
        item.paidPct ??
            item.paid_pct ??
            (amount > 0 ? Math.min((paidAmount / amount) * 100, 100) : 0),
    );

    let status = item.status;

    if (!status) {
        if (remaining <= 0) {
            status = "paid";
        } else if (daysLeft !== null && daysLeft < 0) {
            status = "overdue";
        } else if (daysLeft !== null && daysLeft <= 14) {
            status = "due_soon";
        } else {
            status = "active";
        }
    }

    return {
        id: item.id,
        type: item.type || "debt",
        borrower: item.borrower || "",
        amount,
        remaining,
        remainingBalance: remaining,
        paidAmount,
        paidPct,
        dueDate,
        daysLeft,
        status,
        isPaid: remaining <= 0 || status === "paid",
        notes: item.notes || "",
        createdAt: item.createdAt ?? item.created_at ?? "",
        updatedAt: item.updatedAt ?? item.updated_at ?? "",
    };
};

function EditDebtModal({ open, record, onClose, onSaved }) {
    const [form, setForm] = useState(INITIAL_FORM);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);

    useEffect(() => {
        if (!record) return;

        setForm({
            type: record.type || "debt",
            borrower: record.borrower || "",
            amount: record.amount ? String(record.amount) : "",
            remaining:
                record.remaining !== undefined && record.remaining !== null
                    ? String(record.remaining)
                    : "",
            dueDate: record.dueDate || "",
            notes: record.notes || "",
        });

        setErrors({});
        setLoading(false);
        setDone(false);
    }, [record]);

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

    const isDebt = form.type === "debt";

    const validate = () => {
        const newErrors = {};
        const amount = Number(form.amount) || 0;
        const remaining =
            form.remaining !== "" ? Number(form.remaining) : amount;

        if (!form.borrower.trim()) {
            newErrors.borrower = isDebt
                ? "Lender name required"
                : "Borrower name required";
        }

        if (!form.amount || amount <= 0) {
            newErrors.amount = "Enter a valid amount";
        }

        if (form.remaining !== "" && remaining < 0) {
            newErrors.remaining = "Remaining balance cannot be negative";
        }

        if (amount > 0 && remaining > amount) {
            newErrors.remaining =
                "Remaining balance cannot exceed total amount";
        }

        if (!form.dueDate) {
            newErrors.dueDate = "Due date is required";
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
        if (!record?.id) return;

        const validationErrors = validate();

        if (Object.keys(validationErrors).length) {
            setErrors(validationErrors);
            return;
        }

        setLoading(true);
        setErrors({});

        try {
            const amount = Number(form.amount);
            const remaining =
                form.remaining !== "" ? Number(form.remaining) : amount;

            const payload = {
                type: form.type,
                borrower: form.borrower.trim(),
                amount,
                remaining,
                dueDate: form.dueDate,
                notes: form.notes.trim() || null,
            };

            const response = await fetch(`/api/debts/${record.id}`, {
                method: "PATCH",
                headers: requestHeaders(),
                credentials: "same-origin",
                body: JSON.stringify(payload),
            });

            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                if (result.errors) {
                    setErrors({
                        type: result.errors.type?.[0] || "",
                        borrower: result.errors.borrower?.[0] || "",
                        amount: result.errors.amount?.[0] || "",
                        remaining:
                            result.errors.remaining_balance?.[0] ||
                            result.errors.remaining?.[0] ||
                            "",
                        dueDate:
                            result.errors.due_date?.[0] ||
                            result.errors.dueDate?.[0] ||
                            "",
                        notes: result.errors.notes?.[0] || "",
                        general:
                            result.message || "Failed to update debt record",
                    });
                } else {
                    setErrors({
                        general:
                            result.message || "Failed to update debt record",
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

    const amount = Number(form.amount) || 0;
    const remaining =
        form.remaining !== "" ? Number(form.remaining) || 0 : amount;
    const paidPct =
        amount > 0 ? Math.min(((amount - remaining) / amount) * 100, 100) : 0;

    return (
        <Modal
            open={open}
            onClose={handleClose}
            title="Edit Debt Record"
            subtitle="Update debt or receivable information"
            icon={<CreditCard size={20} />}
            iconColor={isDebt ? "#EF4444" : "#2563EB"}
            footer={
                done ? (
                    <p className="text-center text-sm font-semibold text-primary-500">
                        ✅ Record updated!
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

                <FormField label="Record Type" required error={errors.type}>
                    <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-muted">
                        {["debt", "receivable"].map((type) => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => set("type", type)}
                                className={`py-2.5 rounded-lg text-sm font-semibold capitalize transition-all ${
                                    form.type === type
                                        ? type === "debt"
                                            ? "bg-red-500 text-white shadow"
                                            : "bg-primary-500 text-white shadow"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                {type === "debt" ? "💸 I Owe" : "💰 Owed to Me"}
                            </button>
                        ))}
                    </div>
                </FormField>

                <FormField
                    label={isDebt ? "Lender / Creditor" : "Borrower Name"}
                    required
                    error={errors.borrower}
                >
                    <Input
                        placeholder={
                            isDebt
                                ? "e.g. Student Loan, Bank"
                                : "e.g. Marcus Chen"
                        }
                        value={form.borrower}
                        onChange={(event) =>
                            set("borrower", event.target.value)
                        }
                        error={!!errors.borrower}
                        autoFocus
                    />
                </FormField>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                        label="Total Amount"
                        required
                        error={errors.amount}
                    >
                        <Input
                            type="number"
                            step="0.01"
                            min="1"
                            placeholder="1,000"
                            value={form.amount}
                            onChange={(event) =>
                                set("amount", event.target.value)
                            }
                            error={!!errors.amount}
                            leftDecor="$"
                        />
                    </FormField>

                    <FormField
                        label="Remaining Balance"
                        error={errors.remaining}
                    >
                        <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Same as total"
                            value={form.remaining}
                            onChange={(event) =>
                                set("remaining", event.target.value)
                            }
                            error={!!errors.remaining}
                            leftDecor="$"
                        />
                    </FormField>
                </div>

                <FormField label="Due Date" required error={errors.dueDate}>
                    <Input
                        type="date"
                        value={form.dueDate}
                        onChange={(event) => set("dueDate", event.target.value)}
                        error={!!errors.dueDate}
                    />
                </FormField>

                <FormField label="Notes" error={errors.notes}>
                    <textarea
                        className="finova-input w-full text-sm resize-none"
                        rows={2}
                        placeholder={
                            isDebt
                                ? "e.g. Car loan from bank"
                                : "e.g. Trip expense loan"
                        }
                        value={form.notes}
                        onChange={(event) => set("notes", event.target.value)}
                    />
                </FormField>

                {amount > 0 && (
                    <div
                        className="p-4 rounded-xl border space-y-3"
                        style={{
                            borderColor: isDebt
                                ? "rgba(239,68,68,0.3)"
                                : "rgba(8,203,0,0.3)",
                            background: isDebt
                                ? "rgba(239,68,68,0.05)"
                                : "rgba(8,203,0,0.05)",
                        }}
                    >
                        <div className="flex justify-between items-baseline gap-3">
                            <span className="font-bold text-foreground truncate">
                                {form.borrower ||
                                    (isDebt ? "Lender" : "Borrower")}
                            </span>

                            <span
                                className={`font-bold text-lg shrink-0 ${
                                    isDebt ? "text-red-500" : "text-primary-500"
                                }`}
                            >
                                {fmt(remaining)}
                            </span>
                        </div>

                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div
                                className="h-full rounded-full"
                                style={{
                                    width: `${paidPct}%`,
                                    background: isDebt ? "#EF4444" : "#2563EB",
                                }}
                            />
                        </div>

                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{paidPct.toFixed(0)}% paid</span>
                            <span>{fmt(amount - remaining)} paid</span>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}

function DeleteDebtModal({ open, record, onClose, onDeleted }) {
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
        if (!record?.id) return;

        setLoading(true);
        setError("");

        try {
            const response = await fetch(`/api/debts/${record.id}`, {
                method: "DELETE",
                headers: requestHeaders(),
                credentials: "same-origin",
            });

            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                setError(result.message || "Failed to delete record.");
                return;
            }

            onDeleted?.(record.id);
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
            title="Delete Debt Record"
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
                        {record?.borrower}
                    </span>
                    ?
                </p>
            </div>
        </Modal>
    );
}

export function DebtsPage() {
    const [records, setRecords] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState("debt");
    const [editing, setEditing] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [loading, setLoading] = useState(true);
    const [fetching, setFetching] = useState(false);
    const [error, setError] = useState("");
    const [settlingId, setSettlingId] = useState(null);

    const fetchDebts = useCallback(async () => {
        setFetching(true);
        setError("");

        try {
            const response = await fetch("/api/debts", {
                headers: {
                    Accept: "application/json",
                },
                credentials: "same-origin",
            });

            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                setError(result.message || "Failed to load debt records.");
                return;
            }

            const rows = Array.isArray(result) ? result : result.data || [];

            setRecords(rows.map(normalizeDebt));
        } catch {
            setError("Network error. Please check your connection.");
        } finally {
            setLoading(false);
            setFetching(false);
        }
    }, []);

    useEffect(() => {
        fetchDebts();
    }, [fetchDebts]);

    const debts = useMemo(() => {
        return records.filter(
            (record) =>
                record.type === "debt" &&
                !record.isPaid &&
                Number(record.remaining) > 0,
        );
    }, [records]);

    const receivables = useMemo(() => {
        return records.filter(
            (record) =>
                record.type === "receivable" &&
                !record.isPaid &&
                Number(record.remaining) > 0,
        );
    }, [records]);

    const settledDebts = useMemo(() => {
        return records.filter(
            (record) =>
                record.type === "debt" &&
                (record.isPaid || Number(record.remaining) <= 0),
        );
    }, [records]);

    const settledReceivables = useMemo(() => {
        return records.filter(
            (record) =>
                record.type === "receivable" &&
                (record.isPaid || Number(record.remaining) <= 0),
        );
    }, [records]);

    const totalDebt = useMemo(() => {
        return debts.reduce((sum, record) => sum + Number(record.remaining), 0);
    }, [debts]);

    const totalReceivable = useMemo(() => {
        return receivables.reduce(
            (sum, record) => sum + Number(record.remaining),
            0,
        );
    }, [receivables]);

    const netDebt = totalDebt - totalReceivable;

    const openModal = (type) => {
        setModalType(type);
        setShowModal(true);
    };

    const handleSaved = () => {
        fetchDebts();
    };

    const handleUpdated = (next) => {
        if (!next) {
            fetchDebts();
            return;
        }

        const normalized = normalizeDebt(next);

        setRecords((items) =>
            items.map((item) =>
                item.id === normalized.id ? normalized : item,
            ),
        );
    };

    const handleDeleted = (id) => {
        setRecords((items) => items.filter((item) => item.id !== id));
    };

    const markSettled = async (record) => {
        if (!record?.id) return;

        setSettlingId(record.id);
        setError("");

        try {
            const response = await fetch(`/api/debts/${record.id}`, {
                method: "PATCH",
                headers: requestHeaders(),
                credentials: "same-origin",
                body: JSON.stringify({
                    remaining: 0,
                }),
            });

            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                setError(result.message || "Failed to mark record as settled.");
                return;
            }

            if (result.data) {
                handleUpdated(result.data);
            } else {
                fetchDebts();
            }
        } catch {
            setError("Network error. Please check your connection.");
        } finally {
            setSettlingId(null);
        }
    };

    return (
        <>
            <AddDebtModal
                open={showModal}
                onClose={() => setShowModal(false)}
                defaultType={modalType}
                onSaved={handleSaved}
            />

            <EditDebtModal
                open={!!editing}
                record={editing}
                onClose={() => setEditing(null)}
                onSaved={handleUpdated}
            />

            <DeleteDebtModal
                open={!!deleting}
                record={deleting}
                onClose={() => setDeleting(null)}
                onDeleted={handleDeleted}
            />

            <div className="space-y-6 animate-in">
                {/* Summary */}
                <div className="grid sm:grid-cols-3 gap-4">
                    <div className="finova-card text-center">
                        <p className="text-xs text-muted-foreground">
                            Total Owed
                        </p>
                        <p className="text-2xl font-bold text-red-500 mt-1">
                            {loading ? "..." : fmt(totalDebt)}
                        </p>
                    </div>

                    <div className="finova-card text-center">
                        <p className="text-xs text-muted-foreground">
                            To Receive
                        </p>
                        <p className="text-2xl font-bold text-primary-500 mt-1">
                            {loading ? "..." : fmt(totalReceivable)}
                        </p>
                    </div>

                    <div className="finova-card text-center">
                        <p className="text-xs text-muted-foreground">
                            Net Debt
                        </p>
                        <p
                            className={`text-2xl font-bold mt-1 ${
                                netDebt > 0
                                    ? "text-red-500"
                                    : "text-primary-500"
                            }`}
                        >
                            {loading ? "..." : fmt(netDebt)}
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                        {error}
                    </div>
                )}

                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={fetchDebts}
                        disabled={fetching}
                        className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all disabled:opacity-60"
                    >
                        <RefreshCw
                            size={14}
                            className={fetching ? "animate-spin" : ""}
                        />
                        Refresh
                    </button>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Debts I owe */}
                    <div className="finova-card">
                        <div className="flex flex-col min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between gap-3 mb-5">
                            <SectionHeader
                                title="💸 Money I Owe"
                                subtitle={`${debts.length} active debts`}
                            />

                            <button
                                onClick={() => openModal("debt")}
                                className="btn-primary self-start min-[420px]:self-auto flex items-center gap-2 text-sm px-4 py-2"
                            >
                                <Plus size={16} />
                                Add Debt
                            </button>
                        </div>

                        <div className="space-y-4">
                            {loading && (
                                <p className="py-6 text-center text-sm text-muted-foreground">
                                    Loading debts...
                                </p>
                            )}

                            {!loading && debts.length === 0 && (
                                <p className="py-6 text-center text-sm text-muted-foreground">
                                    No active debts recorded.
                                </p>
                            )}

                            {!loading &&
                                debts.map((debt) => {
                                    const paidAmount = Math.max(
                                        debt.amount - debt.remaining,
                                        0,
                                    );
                                    const days = debt.daysLeft;

                                    return (
                                        <div
                                            key={debt.id}
                                            className="p-4 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/30 dark:bg-red-900/5 group"
                                        >
                                            <div className="flex items-start justify-between mb-3 gap-3">
                                                <div className="min-w-0">
                                                    <p className="font-bold text-foreground truncate">
                                                        {debt.borrower}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground truncate">
                                                        {debt.notes}
                                                    </p>
                                                </div>

                                                <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                                                    <button
                                                        onClick={() =>
                                                            markSettled(debt)
                                                        }
                                                        disabled={
                                                            settlingId ===
                                                            debt.id
                                                        }
                                                        className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-primary-500 disabled:opacity-50"
                                                        aria-label={`Mark ${debt.borrower} as settled`}
                                                        title="Mark settled"
                                                    >
                                                        <CheckCircle2
                                                            size={12}
                                                        />
                                                    </button>

                                                    <button
                                                        onClick={() =>
                                                            setEditing(debt)
                                                        }
                                                        className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                                                        aria-label={`Edit ${debt.borrower}`}
                                                        title="Edit"
                                                    >
                                                        <Pencil size={12} />
                                                    </button>

                                                    <button
                                                        onClick={() =>
                                                            setDeleting(debt)
                                                        }
                                                        className="p-1.5 rounded hover:bg-red-100 text-muted-foreground hover:text-red-500"
                                                        aria-label={`Delete ${debt.borrower}`}
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-baseline mb-2 gap-3">
                                                <span className="text-lg font-bold text-red-500">
                                                    {fmt(debt.remaining)}
                                                </span>
                                                <span className="text-sm text-muted-foreground">
                                                    of {fmt(debt.amount)}
                                                </span>
                                            </div>

                                            <ProgressBar
                                                value={paidAmount}
                                                max={debt.amount}
                                                color="#EF4444"
                                                showLabel={false}
                                                height={6}
                                            />

                                            <div className="flex items-center justify-between mt-2 text-xs gap-3">
                                                <div className="flex items-center gap-1 text-muted-foreground">
                                                    <Clock size={11} />
                                                    <span>
                                                        Due{" "}
                                                        {fmtDate(debt.dueDate)}
                                                    </span>
                                                </div>

                                                <span
                                                    className={`font-semibold ${
                                                        days !== null &&
                                                        days < 14
                                                            ? "text-red-500"
                                                            : days !== null &&
                                                                days < 60
                                                              ? "text-amber-500"
                                                              : "text-muted-foreground"
                                                    }`}
                                                >
                                                    {days !== null
                                                        ? days > 0
                                                            ? `${days}d left`
                                                            : "Overdue!"
                                                        : "-"}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>

                        {/* Add debt dashed row */}
                        <button
                            onClick={() => openModal("debt")}
                            className="mt-4 w-full py-3 rounded-xl border-2 border-dashed border-red-200 dark:border-red-900/40 hover:border-red-400 text-red-400 hover:text-red-500 transition-all flex items-center justify-center gap-2 text-sm font-medium"
                        >
                            <Plus size={16} />
                            Record Another Debt
                        </button>

                        {/* Settled debts */}
                        {settledDebts.length > 0 && (
                            <div className="mt-6 pt-4 border-t border-border">
                                <SectionHeader title="✅ Settled" />

                                <div className="space-y-2">
                                    {settledDebts.map((record) => (
                                        <div
                                            key={record.id}
                                            className="flex items-center justify-between p-3 rounded-lg bg-red-50/40 dark:bg-red-900/10 gap-3"
                                        >
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-foreground opacity-60 truncate">
                                                    {record.borrower}
                                                </p>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {record.notes}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className="text-sm text-muted-foreground">
                                                    {fmt(record.amount)}
                                                </span>
                                                <CheckCircle2
                                                    size={16}
                                                    className="text-red-500"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Receivables */}
                    <div className="finova-card">
                        <div className="flex flex-col min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between gap-3 mb-5">
                            <SectionHeader
                                title="💰 Money Owed to Me"
                                subtitle={`${receivables.length} active`}
                            />

                            <button
                                onClick={() => openModal("receivable")}
                                className="btn-primary self-start min-[420px]:self-auto flex items-center gap-2 text-sm px-4 py-2"
                            >
                                <Plus size={16} />
                                Add Record
                            </button>
                        </div>

                        <div className="space-y-4">
                            {loading && (
                                <p className="py-6 text-center text-sm text-muted-foreground">
                                    Loading receivables...
                                </p>
                            )}

                            {!loading && receivables.length === 0 && (
                                <p className="py-6 text-center text-sm text-muted-foreground">
                                    No active receivables recorded.
                                </p>
                            )}

                            {!loading &&
                                receivables.map((receivable) => {
                                    const days = receivable.daysLeft;

                                    return (
                                        <div
                                            key={receivable.id}
                                            className="p-4 rounded-xl border border-primary-200 dark:border-primary-900/50 bg-primary-50/30 dark:bg-primary-900/5 group"
                                        >
                                            <div className="flex items-start justify-between mb-3 gap-3">
                                                <div className="min-w-0">
                                                    <p className="font-bold text-foreground truncate">
                                                        {receivable.borrower}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground truncate">
                                                        {receivable.notes}
                                                    </p>
                                                </div>

                                                <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                                                    <button
                                                        onClick={() =>
                                                            markSettled(
                                                                receivable,
                                                            )
                                                        }
                                                        disabled={
                                                            settlingId ===
                                                            receivable.id
                                                        }
                                                        className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-primary-500 disabled:opacity-50"
                                                        aria-label={`Mark ${receivable.borrower} as settled`}
                                                        title="Mark settled"
                                                    >
                                                        <CheckCircle2
                                                            size={12}
                                                        />
                                                    </button>

                                                    <button
                                                        onClick={() =>
                                                            setEditing(
                                                                receivable,
                                                            )
                                                        }
                                                        className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                                                        aria-label={`Edit ${receivable.borrower}`}
                                                        title="Edit"
                                                    >
                                                        <Pencil size={12} />
                                                    </button>

                                                    <button
                                                        onClick={() =>
                                                            setDeleting(
                                                                receivable,
                                                            )
                                                        }
                                                        className="p-1.5 rounded hover:bg-red-100 text-muted-foreground hover:text-red-500"
                                                        aria-label={`Delete ${receivable.borrower}`}
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            </div>

                                            <p className="text-2xl font-bold text-primary-500 mb-3">
                                                {fmt(receivable.remaining)}
                                            </p>

                                            <div className="flex items-center justify-between text-xs gap-3">
                                                <div className="flex items-center gap-1 text-muted-foreground">
                                                    <Clock size={11} />
                                                    <span>
                                                        Expected by{" "}
                                                        {fmtDate(
                                                            receivable.dueDate,
                                                        )}
                                                    </span>
                                                </div>

                                                <span
                                                    className={`font-semibold ${
                                                        days !== null &&
                                                        days < 14
                                                            ? "text-amber-500"
                                                            : "text-muted-foreground"
                                                    }`}
                                                >
                                                    {days !== null
                                                        ? days > 0
                                                            ? `${days}d`
                                                            : "Overdue"
                                                        : "-"}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>

                        {/* Add receivable dashed row */}
                        <button
                            onClick={() => openModal("receivable")}
                            className="mt-4 w-full py-3 rounded-xl border-2 border-dashed border-primary-500/30 hover:border-primary-500 text-primary-500/60 hover:text-primary-500 transition-all flex items-center justify-center gap-2 text-sm font-medium"
                        >
                            <Plus size={16} />
                            Record Receivable
                        </button>

                        {/* Settled */}
                        {settledReceivables.length > 0 && (
                            <div className="mt-6 pt-4 border-t border-border">
                                <SectionHeader title="✅ Settled" />

                                <div className="space-y-2">
                                    {settledReceivables.map((record) => (
                                        <div
                                            key={record.id}
                                            className="flex items-center justify-between p-3 rounded-lg bg-blue-50/40 dark:bg-blue-900/10 gap-3"
                                        >
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-foreground opacity-60 truncate">
                                                    {record.borrower}
                                                </p>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {record.notes}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className="text-sm text-muted-foreground">
                                                    {fmt(record.amount)}
                                                </span>
                                                <CheckCircle2
                                                    size={16}
                                                    className="text-primary-500"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

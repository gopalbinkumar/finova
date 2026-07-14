import { useEffect, useState } from "react";
import { CreditCard } from "lucide-react";
import { Modal, FormField, Input, ModalFooter } from "@/components/ui/Modal";
import { useCurrencyFormatter } from "@/utils/currency";

const INITIAL = {
    type: "debt",
    borrower: "",
    amount: "",
    remaining: "",
    dueDate: "",
    notes: "",
};

const getCsrfToken = () => {
    return document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute("content");
};

export function AddDebtModal({ open, onClose, defaultType = "debt", onSaved }) {
    const { formatCurrency: fmt, symbol } = useCurrencyFormatter();
    const [form, setForm] = useState({
        ...INITIAL,
        type: defaultType,
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);

    useEffect(() => {
        if (open) {
            setForm({
                ...INITIAL,
                type: defaultType,
            });
            setErrors({});
            setLoading(false);
            setDone(false);
        }
    }, [open, defaultType]);

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

    const resetForm = () => {
        setForm({
            ...INITIAL,
            type: defaultType,
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

    const handleSubmit = async () => {
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

            const response = await fetch("/api/debts", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    ...(getCsrfToken()
                        ? { "X-CSRF-TOKEN": getCsrfToken() }
                        : {}),
                },
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
                        general: result.message || "Failed to save debt record",
                    });
                } else {
                    setErrors({
                        general: result.message || "Failed to save debt record",
                    });
                }

                return;
            }

            setDone(true);

            if (typeof onSaved === "function") {
                onSaved(result.data);
            }

            setTimeout(() => {
                resetForm();
                onClose?.();
            }, 1000);
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

    const daysLeft = form.dueDate
        ? Math.ceil(
              (new Date(form.dueDate).getTime() - Date.now()) / 86_400_000,
          )
        : null;

    return (
        <Modal
            open={open}
            onClose={handleClose}
            title={isDebt ? "Record a Debt" : "Record Receivable"}
            subtitle={isDebt ? "Money you owe to someone" : "Money owed to you"}
            icon={<CreditCard size={20} />}
            iconColor={isDebt ? "#EF4444" : "#2563EB"}
            footer={
                done ? (
                    <p className="text-center text-sm font-semibold text-primary-500">
                        ✅ Record saved!
                    </p>
                ) : (
                    <ModalFooter
                        onCancel={handleClose}
                        onSubmit={handleSubmit}
                        submitLabel="Save Record"
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

                {/* Type toggle */}
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

                {/* Borrower/Lender */}
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

                {/* Total amount + Remaining */}
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
                            leftDecor={symbol}
                        />
                    </FormField>

                    <FormField
                        label="Remaining Balance"
                        hint="Leave blank if none paid"
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
                            leftDecor={symbol}
                        />
                    </FormField>
                </div>

                {/* Due date */}
                <FormField label="Due Date" required error={errors.dueDate}>
                    <Input
                        type="date"
                        value={form.dueDate}
                        onChange={(event) => set("dueDate", event.target.value)}
                        error={!!errors.dueDate}
                    />
                </FormField>

                {/* Notes */}
                <FormField label="Notes" hint="Purpose of the debt">
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

                {/* Preview */}
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

                        {/* Progress */}
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

                            {daysLeft !== null && (
                                <span
                                    className={
                                        daysLeft < 14
                                            ? "text-red-500 font-semibold"
                                            : ""
                                    }
                                >
                                    {daysLeft > 0
                                        ? `${daysLeft} days left`
                                        : "Overdue"}
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}

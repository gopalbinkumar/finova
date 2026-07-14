import { useEffect, useMemo, useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import {
    Modal,
    FormField,
    Input,
    Select,
    Textarea,
    ModalFooter,
} from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { api } from "@/services/api";
import { useCurrencyFormatter } from "@/utils/currency";

const INITIAL = {
    type: "expense",
    account_id: "",
    to_account_id: "",
    category_id: "",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    description: "",
    notes: "",
};

const typeColors = {
    income: "#2563EB",
    expense: "#EF4444",
    transfer: "#6366F1",
};


export function AddTransactionModal({
    open,
    onClose,
    defaultType = "expense",
    onCreate,
}) {
    const { formatCurrency: fmt, symbol: currencySymbol } = useCurrencyFormatter();
    const [form, setForm] = useState({
        ...INITIAL,
        type: defaultType,
    });

    const [accounts, setAccounts] = useState([]);
    const [categories, setCategories] = useState([]);

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [loadingOptions, setLoadingOptions] = useState(false);
    const [done, setDone] = useState(false);

    const typeColor = typeColors[form.type] || typeColors.expense;

    const selectedAccount = accounts.find(
        (account) => String(account.id) === String(form.account_id),
    );

    const selectedToAccount = accounts.find(
        (account) => String(account.id) === String(form.to_account_id),
    );

    const selectedCategory = categories.find(
        (category) => String(category.id) === String(form.category_id),
    );

    useEffect(() => {
        if (open) {
            setForm({
                ...INITIAL,
                type: defaultType,
                date: new Date().toISOString().slice(0, 10),
            });

            setErrors({});
            setDone(false);
            setLoading(false);
            fetchOptions();
        }
    }, [open, defaultType]);

    const fetchOptions = async () => {
        try {
            setLoadingOptions(true);

            const [accountsResponse, categoriesResponse] = await Promise.all([
                api.get("/accounts"),
                api.get("/categories"),
            ]);

            const accountData = Array.isArray(accountsResponse.data)
                ? accountsResponse.data
                : accountsResponse.data.data || [];

            const categoryData = Array.isArray(categoriesResponse.data)
                ? categoriesResponse.data
                : categoriesResponse.data.data || [];

            setAccounts(accountData);
            setCategories(categoryData);
        } catch (error) {
            console.error("Failed to load transaction options:", error);

            setErrors((current) => ({
                ...current,
                general:
                    error?.response?.data?.message ||
                    "Failed to load accounts and categories.",
            }));
        } finally {
            setLoadingOptions(false);
        }
    };

    const setField = (key, value) => {
        setForm((current) => ({
            ...current,
            [key]: value,
        }));

        setErrors((current) => ({
            ...current,
            [key]: "",
            general: "",
        }));
    };

    const handleTypeChange = (type) => {
        setForm((current) => ({
            ...current,
            type,
            category_id: "",
            to_account_id: "",
        }));

        setErrors({});
    };

    const accountOptions = useMemo(() => {
        return accounts.map((account) => ({
            value: String(account.id),
            label: `${account.name} (${fmt(account.balance)})`,
        }));
    }, [accounts, fmt]);

    const toAccountOptions = useMemo(() => {
        return accounts
            .filter((account) => String(account.id) !== String(form.account_id))
            .map((account) => ({
                value: String(account.id),
                label: `${account.name} (${fmt(account.balance)})`,
            }));
    }, [accounts, form.account_id, fmt]);

    const filteredCategories = useMemo(() => {
        if (form.type === "transfer") return [];

        return categories
            .filter((category) => category.type === form.type)
            .map((category) => ({
                value: String(category.id),
                label: `${category.icon || "🏷️"} ${category.name}`,
            }));
    }, [categories, form.type]);

    const validate = () => {
        const nextErrors = {};

        if (!form.account_id) {
            nextErrors.account_id = "Please select an account";
        }

        if (!form.amount || Number(form.amount) <= 0) {
            nextErrors.amount = "Enter a valid amount";
        }

        if (!form.date) {
            nextErrors.date = "Date is required";
        }

        if (!form.description.trim()) {
            nextErrors.description = "Description is required";
        }

        if (form.type !== "transfer" && !form.category_id) {
            nextErrors.category_id = "Please select a category";
        }

        if (form.type === "transfer" && !form.to_account_id) {
            nextErrors.to_account_id = "Please select destination account";
        }

        if (
            form.type === "transfer" &&
            form.account_id &&
            form.to_account_id &&
            String(form.account_id) === String(form.to_account_id)
        ) {
            nextErrors.to_account_id = "Destination account must be different";
        }

        return nextErrors;
    };

    const handleClose = () => {
        if (loading) return;

        setErrors({});
        setDone(false);
        onClose();
    };

    const handleSubmit = async () => {
        const nextErrors = validate();

        if (Object.keys(nextErrors).length) {
            setErrors(nextErrors);
            return;
        }

        const payload = {
            type: form.type,
            account_id: Number(form.account_id),
            to_account_id:
                form.type === "transfer" ? Number(form.to_account_id) : null,
            category_id:
                form.type === "transfer" ? null : Number(form.category_id),
            amount: Number(form.amount),
            date: form.date,
            description: form.description.trim(),
            notes: form.notes?.trim() || null,
        };

        try {
            setLoading(true);

            if (onCreate) {
                await onCreate(payload);
            } else {
                await api.post("/transactions", payload);
            }

            setDone(true);

            setTimeout(() => {
                setDone(false);

                setForm({
                    ...INITIAL,
                    type: defaultType,
                    date: new Date().toISOString().slice(0, 10),
                });

                onClose();
            }, 800);
        } catch (error) {
            const validationErrors = error?.response?.data?.errors;

            setErrors({
                general:
                    error?.response?.data?.message ||
                    "Failed to create transaction",
                account_id: validationErrors?.account_id?.[0] || "",
                to_account_id: validationErrors?.to_account_id?.[0] || "",
                category_id: validationErrors?.category_id?.[0] || "",
                amount: validationErrors?.amount?.[0] || "",
                date: validationErrors?.date?.[0] || "",
                description: validationErrors?.description?.[0] || "",
                notes: validationErrors?.notes?.[0] || "",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            open={open}
            onClose={handleClose}
            title="Add Transaction"
            subtitle="Record income, expense, or transfer"
            icon={<ArrowLeftRight size={20} />}
            iconColor={typeColor}
            maxWidth="lg"
            footer={
                done ? (
                    <p className="text-center text-sm font-semibold text-primary-500">
                        ✅ Transaction recorded!
                    </p>
                ) : (
                    <ModalFooter
                        onCancel={handleClose}
                        onSubmit={handleSubmit}
                        submitLabel="Add Transaction"
                        loading={loading}
                    />
                )
            }
        >
            <div className="space-y-4">
                {errors.general && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-900/40 dark:bg-red-900/20">
                        {errors.general}
                    </div>
                )}

                {/* Transaction type tabs */}
                <FormField label="Transaction Type" required>
                    <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-muted">
                        {["expense", "income", "transfer"].map((type) => (
                            <button
                                key={type}
                                type="button"
                                disabled={loading}
                                onClick={() => handleTypeChange(type)}
                                className={`py-2.5 rounded-lg text-sm font-semibold capitalize transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                                    form.type === type
                                        ? "text-white shadow"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                                style={
                                    form.type === type
                                        ? { background: typeColors[type] }
                                        : {}
                                }
                            >
                                {type === "income"
                                    ? "💚"
                                    : type === "expense"
                                      ? "💸"
                                      : "↔️"}{" "}
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                            </button>
                        ))}
                    </div>
                </FormField>

                {/* Amount */}
                <FormField label="Amount" required error={errors.amount}>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground">
                            {currencySymbol}
                        </span>

                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={form.amount}
                            disabled={loading}
                            onChange={(event) =>
                                setField("amount", event.target.value)
                            }
                            className={`finova-input w-full pl-14 text-2xl font-bold py-4 disabled:opacity-60 disabled:cursor-not-allowed ${
                                errors.amount ? "border-red-500" : ""
                            }`}
                            style={{ color: typeColor }}
                            autoFocus
                        />
                    </div>
                </FormField>

                {/* Account row */}
                <div
                    className={`grid gap-4 ${
                        form.type === "transfer"
                            ? "grid-cols-1 sm:grid-cols-2"
                            : "grid-cols-1"
                    }`}
                >
                    <FormField
                        label={
                            form.type === "transfer"
                                ? "From Account"
                                : "Account"
                        }
                        required
                        error={errors.account_id}
                    >
                        {loadingOptions ? (
                            <Skeleton className="h-11 w-full" />
                        ) : (
                            <Select
                                value={form.account_id}
                                onChange={(event) =>
                                    setField("account_id", event.target.value)
                                }
                                options={accountOptions}
                                placeholder="Select account..."
                                error={!!errors.account_id}
                                disabled={loading}
                            />
                        )}
                    </FormField>

                    {form.type === "transfer" && (
                        <FormField
                            label="To Account"
                            required
                            error={errors.to_account_id}
                        >
                            {loadingOptions ? (
                                <Skeleton className="h-11 w-full" />
                            ) : (
                                <Select
                                    value={form.to_account_id}
                                    onChange={(event) =>
                                        setField(
                                            "to_account_id",
                                            event.target.value,
                                        )
                                    }
                                    options={toAccountOptions}
                                    placeholder="Select destination..."
                                    error={!!errors.to_account_id}
                                    disabled={loading || !form.account_id}
                                />
                            )}
                        </FormField>
                    )}
                </div>

                {/* Category */}
                {form.type !== "transfer" && (
                    <FormField
                        label="Category"
                        required
                        error={errors.category_id}
                    >
                        {loadingOptions ? (
                            <Skeleton className="h-11 w-full" />
                        ) : (
                            <Select
                                value={form.category_id}
                                onChange={(event) =>
                                    setField("category_id", event.target.value)
                                }
                                options={filteredCategories}
                                placeholder={
                                    filteredCategories.length === 0
                                        ? `No ${form.type} categories found`
                                        : "Select category..."
                                }
                                error={!!errors.category_id}
                                disabled={loading}
                            />
                        )}
                    </FormField>
                )}

                {/* Date + Description row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Date" required error={errors.date}>
                        <Input
                            type="date"
                            value={form.date}
                            onChange={(event) =>
                                setField("date", event.target.value)
                            }
                            error={!!errors.date}
                            disabled={loading}
                        />
                    </FormField>

                    <FormField
                        label="Description"
                        required
                        error={errors.description}
                    >
                        <Input
                            placeholder="e.g. Monthly rent"
                            value={form.description}
                            onChange={(event) =>
                                setField("description", event.target.value)
                            }
                            error={!!errors.description}
                            disabled={loading}
                        />
                    </FormField>
                </div>

                {/* Notes */}
                <FormField
                    label="Notes"
                    hint="Optional additional details"
                    error={errors.notes}
                >
                    <Textarea
                        placeholder="Add any notes..."
                        value={form.notes}
                        onChange={(event) =>
                            setField("notes", event.target.value)
                        }
                        disabled={loading}
                    />
                </FormField>

                {/* Summary preview */}
                {form.amount && Number(form.amount) > 0 && (
                    <div
                        className="flex items-center gap-4 p-4 rounded-xl border"
                        style={{
                            borderColor: `${typeColor}30`,
                            background: `${typeColor}08`,
                        }}
                    >
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                            style={{
                                background: `${typeColor}20`,
                            }}
                        >
                            {form.type === "income"
                                ? "💚"
                                : form.type === "transfer"
                                  ? "↔️"
                                  : "💸"}
                        </div>

                        <div className="flex-1">
                            <p className="text-sm font-semibold text-foreground">
                                {form.description || "Transaction"}
                            </p>

                            <p className="text-xs text-muted-foreground">
                                {selectedAccount?.name || "Account"}
                                {form.type === "transfer" &&
                                    selectedToAccount &&
                                    ` → ${selectedToAccount.name}`}
                                {form.type !== "transfer" &&
                                    selectedCategory &&
                                    ` · ${selectedCategory.name}`}
                                {" · "}
                                {form.date}
                            </p>
                        </div>

                        <p
                            className="font-bold text-lg"
                            style={{
                                color: typeColor,
                            }}
                        >
                            {form.type === "income"
                                ? "+"
                                : form.type === "transfer"
                                  ? "±"
                                  : "-"}
                            {fmt(form.amount)}
                        </p>
                    </div>
                )}
            </div>
        </Modal>
    );
}

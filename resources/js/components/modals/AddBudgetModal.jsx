import { useEffect, useMemo, useState } from "react";
import { PieChart } from "lucide-react";
import {
    Modal,
    FormField,
    Input,
    Select,
    ModalFooter,
} from "@/components/ui/Modal";
import { api } from "@/services/api";

const getCurrentMonth = () => {
    return new Date().toISOString().slice(0, 7);
};

const generatePeriodOptions = () => {
    const options = [];
    const today = new Date();

    for (let offset = -2; offset <= 6; offset += 1) {
        const date = new Date(
            today.getFullYear(),
            today.getMonth() + offset,
            1,
        );

        const value = `${date.getFullYear()}-${String(
            date.getMonth() + 1,
        ).padStart(2, "0")}`;

        const label = date.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
        });

        options.push({
            value,
            label,
        });
    }

    return options;
};

const PERIOD_OPTIONS = generatePeriodOptions();

const INITIAL = {
    category_id: "",
    limit: "",
    period: getCurrentMonth(),
    alert_at: "80",
    notes: "",
};

const fmt = (value) => {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(Number(value || 0));
};

const normalizePeriod = (record) => {
    if (record?.period_month) {
        return String(record.period_month).slice(0, 7);
    }

    if (record?.period) {
        const parsed = new Date(`1 ${record.period}`);

        if (!Number.isNaN(parsed.getTime())) {
            return `${parsed.getFullYear()}-${String(
                parsed.getMonth() + 1,
            ).padStart(2, "0")}`;
        }
    }

    return getCurrentMonth();
};

function BudgetModal({ open, onClose, record, onSave, onCreate }) {
    const isEditing = Boolean(record);

    const [form, setForm] = useState(INITIAL);
    const [categories, setCategories] = useState([]);

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [done, setDone] = useState(false);

    useEffect(() => {
        if (!open) return;

        fetchExpenseCategories();

        if (isEditing) {
            setForm({
                category_id: record?.category_id
                    ? String(record.category_id)
                    : "",
                limit: String(record?.limit ?? ""),
                period: normalizePeriod(record),
                alert_at: String(record?.alertAt ?? record?.alert_at ?? "80"),
                notes: record?.notes ?? "",
            });
        } else {
            setForm({
                ...INITIAL,
                period: getCurrentMonth(),
            });
        }

        setErrors({});
        setLoading(false);
        setDone(false);
    }, [open, isEditing, record]);

    const fetchExpenseCategories = async () => {
        try {
            setLoadingCategories(true);

            const response = await api.get("/categories");

            const data = Array.isArray(response.data)
                ? response.data
                : response.data.data || [];

            setCategories(
                data.filter((category) => category.type === "expense"),
            );
        } catch (error) {
            console.error("Failed to fetch expense categories:", error);

            setErrors((current) => ({
                ...current,
                general:
                    error?.response?.data?.message ||
                    "Failed to load expense categories.",
            }));
        } finally {
            setLoadingCategories(false);
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

    const expenseCategoryOptions = useMemo(() => {
        return categories.map((category) => ({
            value: String(category.id),
            label: `${category.icon || "🏷️"} ${category.name}`,
        }));
    }, [categories]);

    const selectedCategory = categories.find(
        (category) => String(category.id) === String(form.category_id),
    );

    const validate = () => {
        const nextErrors = {};

        if (!form.category_id) {
            nextErrors.category_id = "Please select a category";
        }

        if (!form.limit || Number(form.limit) <= 0) {
            nextErrors.limit = "Enter a valid budget limit";
        }

        if (!form.period) {
            nextErrors.period = "Please select a budget period";
        }

        if (
            form.alert_at === "" ||
            Number(form.alert_at) < 50 ||
            Number(form.alert_at) > 100
        ) {
            nextErrors.alert_at = "Alert must be between 50% and 100%";
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
            category_id: Number(form.category_id),
            limit: Number(form.limit),
            period: form.period,
            alert_at: Number(form.alert_at),
            notes: form.notes?.trim() || null,
        };

        try {
            setLoading(true);

            if (isEditing) {
                if (onSave) {
                    await onSave({
                        ...record,
                        ...payload,
                    });
                } else {
                    await api.put(`/budgets/${record.id}`, payload);
                }
            } else {
                if (onCreate) {
                    await onCreate(payload);
                } else {
                    await api.post("/budgets", payload);
                }
            }

            setDone(true);

            setTimeout(() => {
                setDone(false);
                setForm({
                    ...INITIAL,
                    period: getCurrentMonth(),
                });
                onClose();
            }, 800);
        } catch (error) {
            const validationErrors = error?.response?.data?.errors;

            setErrors({
                general:
                    error?.response?.data?.message ||
                    `Failed to ${isEditing ? "update" : "create"} budget`,
                category_id: validationErrors?.category_id?.[0] || "",
                limit: validationErrors?.limit?.[0] || "",
                period: validationErrors?.period?.[0] || "",
                alert_at: validationErrors?.alert_at?.[0] || "",
                notes: validationErrors?.notes?.[0] || "",
            });
        } finally {
            setLoading(false);
        }
    };

    const limit = Number(form.limit) || 0;
    const alertAmount = (limit * Number(form.alert_at || 0)) / 100;

    return (
        <Modal
            open={open}
            onClose={handleClose}
            title={isEditing ? "Edit Budget" : "Create Budget"}
            subtitle={
                isEditing
                    ? "Update the spending limit for this category"
                    : "Set a spending limit for an expense category"
            }
            icon={<PieChart size={20} />}
            iconColor="#8B5CF6"
            footer={
                done ? (
                    <p className="text-center text-sm font-semibold text-primary-500">
                        ✅ {isEditing ? "Budget updated!" : "Budget created!"}
                    </p>
                ) : (
                    <ModalFooter
                        onCancel={handleClose}
                        onSubmit={handleSubmit}
                        submitLabel={
                            isEditing ? "Save Changes" : "Create Budget"
                        }
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

                {/* Category */}
                <FormField label="Category" required error={errors.category_id}>
                    <Select
                        value={form.category_id}
                        onChange={(event) =>
                            setField("category_id", event.target.value)
                        }
                        options={expenseCategoryOptions}
                        placeholder={
                            loadingCategories
                                ? "Loading categories..."
                                : expenseCategoryOptions.length === 0
                                  ? "No expense categories found"
                                  : "Select a category..."
                        }
                        error={!!errors.category_id}
                        disabled={loading || loadingCategories}
                    />
                </FormField>

                {/* Period */}
                <FormField label="Budget Period" required error={errors.period}>
                    <Select
                        value={form.period}
                        onChange={(event) =>
                            setField("period", event.target.value)
                        }
                        options={PERIOD_OPTIONS}
                        disabled={loading}
                    />
                </FormField>

                {/* Budget Limit */}
                <FormField label="Monthly Limit" required error={errors.limit}>
                    <Input
                        type="number"
                        step="1"
                        min="1"
                        placeholder="500"
                        value={form.limit}
                        onChange={(event) =>
                            setField("limit", event.target.value)
                        }
                        error={!!errors.limit}
                        leftDecor="$"
                        disabled={loading}
                    />
                </FormField>

                {/* Alert threshold slider */}
                <FormField
                    label={`Alert me at ${form.alert_at}% — ${
                        alertAmount > 0 ? fmt(alertAmount) : "--"
                    }`}
                    hint="Get notified before you hit the limit"
                    error={errors.alert_at}
                >
                    <div className="space-y-2">
                        <input
                            type="range"
                            min="50"
                            max="100"
                            step="5"
                            value={form.alert_at}
                            onChange={(event) =>
                                setField("alert_at", event.target.value)
                            }
                            className="w-full accent-primary-500"
                            disabled={loading}
                        />

                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>50%</span>
                            <span>75%</span>
                            <span>100%</span>
                        </div>
                    </div>
                </FormField>

                {/* Notes */}
                <FormField label="Notes" hint="Optional" error={errors.notes}>
                    <textarea
                        className="finova-input w-full text-sm resize-none"
                        rows={2}
                        placeholder="e.g. Cut back on dining out"
                        value={form.notes}
                        onChange={(event) =>
                            setField("notes", event.target.value)
                        }
                        disabled={loading}
                    />
                </FormField>

                {/* Summary card */}
                {form.category_id && limit > 0 && (
                    <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-foreground">
                                {selectedCategory?.icon || "🏷️"}{" "}
                                {selectedCategory?.name || "Category"}
                            </span>

                            <span className="text-sm font-bold text-foreground">
                                {fmt(limit)}
                            </span>
                        </div>

                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div className="h-full w-0 rounded-full bg-primary-500 transition-all" />
                        </div>

                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>$0 spent</span>
                            <span>
                                Period:{" "}
                                {
                                    PERIOD_OPTIONS.find(
                                        (item) => item.value === form.period,
                                    )?.label
                                }
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}

export function AddBudgetModal({ open, onClose, onCreate }) {
    return <BudgetModal open={open} onClose={onClose} onCreate={onCreate} />;
}

export function EditBudgetModal({ open, onClose, record, onSave }) {
    return (
        <BudgetModal
            open={open}
            onClose={onClose}
            record={record}
            onSave={onSave}
        />
    );
}

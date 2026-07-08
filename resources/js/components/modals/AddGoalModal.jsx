import { useEffect, useState } from "react";
import { Target } from "lucide-react";
import { FormField, Input, Modal, ModalFooter } from "@/components/ui/Modal";
import { api } from "@/services/api";

const ICON_OPTIONS = [
    "🎯",
    "🛡️",
    "💻",
    "🌴",
    "🏠",
    "🚗",
    "💍",
    "✈️",
    "🎓",
    "🏖️",
    "🎸",
    "🎥",
    "⛵",
    "🏔️",
    "🐶",
    "💊",
    "📱",
    "🏋️",
    "🌏",
];

const COLOR_PRESETS = [
    "#2563EB",
    "#3B82F6",
    "#F59E0B",
    "#8B5CF6",
    "#EC4899",
    "#EF4444",
    "#14B8A6",
    "#F97316",
];

const INITIAL = {
    name: "",
    icon: "🎯",
    color: "#2563EB",
    target: "",
    deadline: "",
    notes: "",
};

export function AddGoalModal({ open, onClose, onSave }) {
    const [form, setForm] = useState(INITIAL);
    const [errors, setErrors] = useState({});
    const [generalError, setGeneralError] = useState("");
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);

    useEffect(() => {
        if (!open) return;

        setForm(INITIAL);
        setErrors({});
        setGeneralError("");
        setLoading(false);
        setDone(false);
    }, [open]);

    const set = (key, value) => {
        setForm((current) => ({ ...current, [key]: value }));
        setErrors((current) => ({ ...current, [key]: "" }));
        setGeneralError("");
    };

    const normalizeGoal = (goal) => {
        const target = Number(goal.target_amount ?? goal.target ?? 0);
        const current = Number(goal.current_amount ?? goal.current ?? 0);

        return {
            ...goal,
            target,
            target_amount: target,
            current,
            current_amount: current,
            allocations: goal.allocations ?? goal.goal_accounts ?? [],
            goal_accounts: goal.goal_accounts ?? goal.allocations ?? [],
        };
    };

    const getBackendErrors = (error) => {
        const responseErrors = error?.response?.data?.errors || {};
        const nextErrors = {};

        Object.entries(responseErrors).forEach(([key, value]) => {
            const message = Array.isArray(value) ? value[0] : value;

            if (key === "target_amount" || key === "target") {
                nextErrors.target = message;
                return;
            }

            nextErrors[key] = message;
        });

        return nextErrors;
    };

    const handleSubmit = async () => {
        const nextErrors = {};

        if (!form.name.trim()) {
            nextErrors.name = "Goal name is required";
        }

        if (!form.target || Number(form.target) <= 0) {
            nextErrors.target = "Enter a target amount";
        }

        if (!form.deadline) {
            nextErrors.deadline = "Please set a deadline";
        }

        if (Object.keys(nextErrors).length) {
            setErrors(nextErrors);
            return;
        }

        const target = Number(form.target);

        const payload = {
            name: form.name.trim(),
            target_amount: target,
            deadline: form.deadline,
            icon: form.icon,
            color: form.color,
            notes: form.notes.trim() || null,
            status: "active",
            allocations: [],
        };

        try {
            setLoading(true);
            setErrors({});
            setGeneralError("");

            const response = await api.post("/goals", payload);
            const savedGoal = normalizeGoal(response.data.data);

            onSave?.(savedGoal);

            setDone(true);

            setTimeout(() => {
                setLoading(false);
                onClose?.();
            }, 700);
        } catch (error) {
            const backendErrors = getBackendErrors(error);

            if (Object.keys(backendErrors).length) {
                setErrors(backendErrors);
            }

            setGeneralError(
                error?.response?.data?.message ||
                    "Failed to create goal. Please check your input and try again.",
            );

            setLoading(false);
        }
    };

    const target = Number(form.target) || 0;

    return (
        <Modal
            open={open}
            onClose={loading ? undefined : onClose}
            title="New Financial Goal"
            subtitle="Create the goal first, then allocate funds from its card"
            icon={<Target size={20} />}
            iconColor={form.color}
            footer={
                done ? (
                    <p className="text-center text-sm font-semibold text-primary-500">
                        🎯 Goal created!
                    </p>
                ) : (
                    <ModalFooter
                        onCancel={onClose}
                        onSubmit={handleSubmit}
                        submitLabel="Create Goal"
                        loading={loading}
                    />
                )
            }
        >
            <div className="space-y-4">
                {generalError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                        {generalError}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <FormField label="Goal Icon">
                        <div className="grid grid-cols-6 gap-1.5 p-2 rounded-xl border border-border bg-muted/30 max-h-28 overflow-y-auto">
                            {ICON_OPTIONS.map((icon) => (
                                <button
                                    key={icon}
                                    type="button"
                                    onClick={() => set("icon", icon)}
                                    disabled={loading}
                                    className={`w-9 h-9 rounded-lg text-xl flex items-center justify-center transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed ${
                                        form.icon === icon
                                            ? "bg-card shadow ring-2 ring-primary-500"
                                            : "hover:bg-card"
                                    }`}
                                    aria-label={`Use icon ${icon}`}
                                >
                                    {icon}
                                </button>
                            ))}
                        </div>
                    </FormField>

                    <FormField label="Color Theme">
                        <div className="grid grid-cols-4 gap-2">
                            {COLOR_PRESETS.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => set("color", color)}
                                    disabled={loading}
                                    className="w-9 h-9 rounded-lg transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{
                                        background: color,
                                        outline:
                                            form.color === color
                                                ? `3px solid ${color}`
                                                : "none",
                                        outlineOffset: "2px",
                                        boxShadow:
                                            form.color === color
                                                ? "0 0 0 2px white"
                                                : "none",
                                    }}
                                    aria-label={`Use color ${color}`}
                                />
                            ))}
                        </div>

                        <input
                            type="color"
                            value={form.color}
                            onChange={(event) =>
                                set("color", event.target.value)
                            }
                            disabled={loading}
                            className="w-9 h-9 rounded-lg cursor-pointer border border-border mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Custom goal color"
                        />
                    </FormField>
                </div>

                <FormField label="Goal Name" required error={errors.name}>
                    <Input
                        placeholder="e.g. Emergency Fund"
                        value={form.name}
                        onChange={(event) => set("name", event.target.value)}
                        error={!!errors.name}
                        disabled={loading}
                        autoFocus
                    />
                </FormField>

                <div className="grid sm:grid-cols-2 gap-4">
                    <FormField
                        label="Target Amount"
                        required
                        error={errors.target}
                    >
                        <Input
                            type="number"
                            step="100"
                            min="1"
                            placeholder="10,000"
                            value={form.target}
                            onChange={(event) =>
                                set("target", event.target.value)
                            }
                            error={!!errors.target}
                            leftDecor="$"
                            disabled={loading}
                        />
                    </FormField>

                    <FormField
                        label="Target Date"
                        required
                        error={errors.deadline}
                    >
                        <Input
                            type="date"
                            value={form.deadline}
                            onChange={(event) =>
                                set("deadline", event.target.value)
                            }
                            error={!!errors.deadline}
                            disabled={loading}
                        />
                    </FormField>
                </div>

                <FormField label="Notes" hint="Optional" error={errors.notes}>
                    <textarea
                        className={`finova-input w-full text-sm resize-none ${
                            errors.notes ? "border-red-500" : ""
                        }`}
                        rows={2}
                        placeholder="e.g. 6 months of living expenses"
                        value={form.notes}
                        onChange={(event) => set("notes", event.target.value)}
                        disabled={loading}
                    />
                </FormField>

                {(form.name || target > 0) && (
                    <div
                        className="rounded-xl border p-4 flex items-center justify-between gap-4"
                        style={{
                            borderColor: `${form.color}30`,
                            background: `${form.color}08`,
                        }}
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <div
                                className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                                style={{ background: `${form.color}20` }}
                            >
                                {form.icon}
                            </div>

                            <div className="min-w-0">
                                <p className="font-bold text-foreground truncate">
                                    {form.name || "Your Goal"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Funds can be allocated after creation
                                </p>
                            </div>
                        </div>

                        <p className="font-bold text-foreground flex-shrink-0">
                            ${target.toLocaleString()}
                        </p>
                    </div>
                )}
            </div>
        </Modal>
    );
}

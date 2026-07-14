import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, PiggyBank, Plus, Trash2 } from "lucide-react";
import { FormField, Input, Modal, ModalFooter } from "@/components/ui/Modal";
import { SkeletonList } from "@/components/ui/Skeleton";
import { api } from "@/services/api";
import { useCurrencyFormatter } from "@/utils/currency";

let allocationRowId = 0;

const emptyAllocation = () => ({
    rowId: `allocation-${allocationRowId++}`,
    account_id: "",
    amount: "",
    notes: "",
});

const getAccountIcon = (type) => {
    const icons = {
        bank: "🏦",
        cash: "💵",
        credit_card: "💳",
        e_wallet: "📱",
        investment: "📈",
    };

    return icons[type] || "💰";
};

const normalizeAccounts = (payload) => {
    const rows = payload?.data ?? payload ?? [];

    return rows.map((account) => ({
        ...account,
        id: Number(account.id),
        name: account.name ?? "Unnamed Account",
        type: account.type ?? "bank",
        icon: account.icon ?? getAccountIcon(account.type),
        balance: Number(account.balance ?? 0),
    }));
};

const normalizeAllocations = (record) => {
    const allocations = record?.allocations ?? record?.goal_accounts ?? [];

    if (!allocations.length) {
        return [emptyAllocation()];
    }

    return allocations.map((allocation) => ({
        rowId: `allocation-${allocationRowId++}`,
        account_id: String(
            allocation.account_id ??
                allocation.account?.id ??
                allocation.id ??
                "",
        ),
        amount: String(allocation.amount ?? allocation.pivot?.amount ?? ""),
        notes: allocation.notes ?? allocation.pivot?.notes ?? "",
    }));
};

const normalizeGoal = (goal) => {
    const target = Number(goal?.target_amount ?? goal?.target ?? 0);
    const current = Number(goal?.current_amount ?? goal?.current ?? 0);

    return {
        ...goal,
        target,
        target_amount: target,
        current,
        current_amount: current,
        allocations: goal?.allocations ?? goal?.goal_accounts ?? [],
        goal_accounts: goal?.goal_accounts ?? goal?.allocations ?? [],
    };
};

export function GoalAllocationsModal({ open, onClose, record, onSave }) {
    const { formatCurrency: fmt, symbol } = useCurrencyFormatter();
    const [accounts, setAccounts] = useState([]);
    const [accountsLoading, setAccountsLoading] = useState(false);
    const [accountsError, setAccountsError] = useState("");

    const [allocations, setAllocations] = useState([emptyAllocation()]);
    const [errors, setErrors] = useState({});
    const [generalError, setGeneralError] = useState("");

    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);

    useEffect(() => {
        if (!open) return;

        setAllocations(normalizeAllocations(record));
        setErrors({});
        setGeneralError("");
        setAccountsError("");
        setLoading(false);
        setDone(false);

        const fetchAccounts = async () => {
            try {
                setAccountsLoading(true);
                const response = await api.get("/accounts");
                setAccounts(normalizeAccounts(response.data));
            } catch (error) {
                setAccountsError(
                    error?.response?.data?.message ||
                        "Failed to load accounts.",
                );
            } finally {
                setAccountsLoading(false);
            }
        };

        fetchAccounts();
    }, [open, record]);

    const selectedAccountIds = useMemo(
        () =>
            allocations
                .map((allocation) => String(allocation.account_id))
                .filter(Boolean),
        [allocations],
    );

    const target = Number(record?.target_amount ?? record?.target) || 0;

    const totalAllocation = useMemo(
        () =>
            allocations.reduce(
                (total, allocation) =>
                    total +
                    (allocation.account_id
                        ? Number(allocation.amount) || 0
                        : 0),
                0,
            ),
        [allocations],
    );

    const remaining = Math.max(target - totalAllocation, 0);
    const progress = target > 0 ? (totalAllocation / target) * 100 : 0;

    const addDisabled =
        accountsLoading ||
        !accounts.length ||
        selectedAccountIds.length >= accounts.length ||
        allocations.length >= accounts.length;

    const setAllocation = (rowId, key, value) => {
        setAllocations((current) =>
            current.map((allocation) =>
                allocation.rowId === rowId
                    ? { ...allocation, [key]: value }
                    : allocation,
            ),
        );

        setErrors((current) => ({
            ...current,
            [rowId]: {
                ...current[rowId],
                [key]: "",
            },
        }));

        setGeneralError("");
    };

    const addAllocation = () => {
        if (addDisabled) return;

        setAllocations((current) => [...current, emptyAllocation()]);
    };

    const removeAllocation = (rowId) => {
        setAllocations((current) => {
            const next = current.filter(
                (allocation) => allocation.rowId !== rowId,
            );

            return next.length ? next : [emptyAllocation()];
        });

        setErrors((current) => {
            const next = { ...current };
            delete next[rowId];
            return next;
        });

        setGeneralError("");
    };

    const validateAllocations = () => {
        const nextErrors = {};
        const seen = new Set();

        allocations.forEach((allocation) => {
            const rowErrors = {};
            const hasAccount = Boolean(allocation.account_id);
            const hasAmount =
                allocation.amount !== "" &&
                allocation.amount !== null &&
                allocation.amount !== undefined;
            const hasNotes = Boolean(allocation.notes?.trim());

            const isEmptyRow = !hasAccount && !hasAmount && !hasNotes;

            if (isEmptyRow) {
                return;
            }

            if (!hasAccount) {
                rowErrors.account_id = "Please select an account.";
            }

            if (hasAccount && seen.has(String(allocation.account_id))) {
                rowErrors.account_id =
                    "This account has already been selected.";
            }

            if (hasAccount) {
                seen.add(String(allocation.account_id));
            }

            if (!hasAmount || Number(allocation.amount) <= 0) {
                rowErrors.amount = "Enter an allocation amount.";
            }

            if (Object.keys(rowErrors).length) {
                nextErrors[allocation.rowId] = rowErrors;
            }
        });

        setErrors(nextErrors);

        return Object.keys(nextErrors).length === 0;
    };

    const getBackendErrorMessage = (error) => {
        const response = error?.response?.data;

        if (response?.message) {
            return response.message;
        }

        if (response?.errors) {
            const firstError = Object.values(response.errors)?.[0];
            return Array.isArray(firstError)
                ? firstError[0]
                : firstError || "Failed to save allocations.";
        }

        return "Failed to save allocations.";
    };

    const handleSave = async () => {
        if (!record?.id) {
            setGeneralError(
                "Goal data is missing. Please refresh and try again.",
            );
            return;
        }

        if (!validateAllocations()) {
            return;
        }

        const nextAllocations = allocations
            .filter((allocation) => allocation.account_id)
            .map((allocation) => ({
                account_id: Number(allocation.account_id),
                amount: Number(allocation.amount) || 0,
                notes: allocation.notes?.trim() || null,
            }));

        try {
            setLoading(true);
            setGeneralError("");

            const response = await api.put(`/goals/${record.id}/allocations`, {
                allocations: nextAllocations,
            });

            const savedGoal = normalizeGoal(response.data.data);

            onSave?.(savedGoal);

            setDone(true);

            setTimeout(() => {
                setLoading(false);
                onClose?.();
            }, 700);
        } catch (error) {
            setGeneralError(getBackendErrorMessage(error));
            setLoading(false);
        }
    };

    return (
        <Modal
            open={open}
            onClose={loading ? undefined : onClose}
            title="Allocation Accounts"
            subtitle={`Manage funds stored for ${record?.name ?? "this goal"}`}
            icon={<PiggyBank size={20} />}
            iconColor={record?.color ?? "#2563EB"}
            maxWidth="lg"
            footer={
                done ? (
                    <p className="text-center text-sm font-semibold text-primary-500">
                        Funds allocation updated!
                    </p>
                ) : (
                    <ModalFooter
                        onCancel={onClose}
                        onSubmit={handleSave}
                        submitLabel="Save Allocations"
                        loading={loading}
                    />
                )
            }
        >
            <div className="space-y-4">
                {(generalError || accountsError) && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                        {generalError || accountsError}
                    </div>
                )}

                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h3 className="text-sm font-bold text-foreground">
                            Stored In Accounts
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            These are tracking records only. Account balances
                            stay unchanged.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={addAllocation}
                        disabled={addDisabled || loading}
                        className="btn-secondary px-3 py-2 text-xs flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    >
                        <Plus size={14} />
                        Add Allocation
                    </button>
                </div>

                {accountsLoading && (
                    <div className="rounded-xl border border-border bg-muted/20 p-4">
                        <SkeletonList rows={2} showAvatar showTrailing={false} />
                    </div>
                )}

                {!accountsLoading && !accounts.length && (
                    <div className="rounded-xl border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                        No accounts found. Please create an account first before
                        adding goal allocations.
                    </div>
                )}

                <div className="space-y-3">
                    {allocations.map((allocation, index) => {
                        const rowErrors = errors[allocation.rowId] || {};

                        return (
                            <div
                                key={allocation.rowId}
                                className="rounded-xl border border-border bg-muted/20 p-3"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs font-semibold text-muted-foreground">
                                        Allocation {index + 1}
                                    </p>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            removeAllocation(allocation.rowId)
                                        }
                                        disabled={loading}
                                        className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        aria-label={`Remove allocation ${
                                            index + 1
                                        }`}
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>

                                <div className="grid sm:grid-cols-2 gap-3">
                                    <FormField
                                        label="Account"
                                        error={rowErrors.account_id}
                                    >
                                        <select
                                            className={`finova-input w-full text-sm appearance-none cursor-pointer ${
                                                rowErrors.account_id
                                                    ? "border-red-500"
                                                    : ""
                                            }`}
                                            value={allocation.account_id}
                                            disabled={
                                                loading ||
                                                accountsLoading ||
                                                !accounts.length
                                            }
                                            onChange={(event) =>
                                                setAllocation(
                                                    allocation.rowId,
                                                    "account_id",
                                                    event.target.value,
                                                )
                                            }
                                        >
                                            <option value="">
                                                Select account...
                                            </option>

                                            {accounts.map((account) => {
                                                const selectedElsewhere =
                                                    selectedAccountIds.includes(
                                                        String(account.id),
                                                    ) &&
                                                    String(
                                                        allocation.account_id,
                                                    ) !== String(account.id);

                                                return (
                                                    <option
                                                        key={account.id}
                                                        value={account.id}
                                                        disabled={
                                                            selectedElsewhere
                                                        }
                                                    >
                                                        {account.icon}{" "}
                                                        {account.name}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </FormField>

                                    <FormField
                                        label="Amount"
                                        error={rowErrors.amount}
                                    >
                                        <Input
                                            type="number"
                                            min="0"
                                            step="100"
                                            placeholder="0"
                                            leftDecor={symbol}
                                            value={allocation.amount}
                                            disabled={loading}
                                            error={!!rowErrors.amount}
                                            onChange={(event) =>
                                                setAllocation(
                                                    allocation.rowId,
                                                    "amount",
                                                    event.target.value,
                                                )
                                            }
                                        />
                                    </FormField>

                                    <div className="sm:col-span-2">
                                        <FormField
                                            label="Notes"
                                            hint="Optional"
                                        >
                                            <Input
                                                placeholder="e.g. Emergency cash reserve"
                                                value={allocation.notes}
                                                disabled={loading}
                                                onChange={(event) =>
                                                    setAllocation(
                                                        allocation.rowId,
                                                        "notes",
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                        </FormField>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div
                    className="rounded-xl border p-4 space-y-3"
                    style={{
                        borderColor: `${record?.color ?? "#2563EB"}30`,
                        background: `${record?.color ?? "#2563EB"}08`,
                    }}
                >
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                            <p className="text-xs text-muted-foreground">
                                Target Amount
                            </p>
                            <p className="text-sm font-bold text-foreground mt-0.5">
                                {fmt(target)}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs text-muted-foreground">
                                Total Allocated
                            </p>
                            <p
                                className="text-sm font-bold mt-0.5"
                                style={{
                                    color: record?.color ?? "#2563EB",
                                }}
                            >
                                {fmt(totalAllocation)}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs text-muted-foreground">
                                Remaining
                            </p>
                            <p className="text-sm font-bold text-foreground mt-0.5">
                                {fmt(remaining)}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs text-muted-foreground">
                                Progress
                            </p>
                            <p
                                className="text-sm font-bold mt-0.5"
                                style={{
                                    color: record?.color ?? "#2563EB",
                                }}
                            >
                                {progress.toFixed(0)}%
                            </p>
                        </div>
                    </div>

                    <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                                width: `${Math.min(progress, 100)}%`,
                                background: record?.color ?? "#2563EB",
                            }}
                        />
                    </div>

                    {totalAllocation > target && target > 0 && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1.5">
                            <AlertTriangle size={14} />
                            Allocated amount exceeds target.
                        </p>
                    )}
                </div>
            </div>
        </Modal>
    );
}

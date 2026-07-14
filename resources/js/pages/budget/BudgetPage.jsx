import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, AlertCircle, CheckCircle2 } from "lucide-react";
import { ProgressBar, SectionHeader } from "@/components/ui/Cards";
import { ConfirmDeleteModal } from "@/components/ui/RecordActions";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
    AddBudgetModal,
    EditBudgetModal,
} from "@/components/modals/AddBudgetModal";
import {
    BudgetListSkeleton,
    ChartSkeleton,
    Skeleton,
    SkeletonCard,
} from "@/components/ui/Skeleton";
import { api } from "@/services/api";
import { useCurrencyFormatter } from "@/utils/currency";

const toNumber = (value) => {
    const number = Number(value);

    return Number.isNaN(number) ? 0 : number;
};

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

export function BudgetPage() {
    const { formatCurrency: fmt } = useCurrencyFormatter();
    const [budgets, setBudgets] = useState([]);
    const [period, setPeriod] = useState(getCurrentMonth());

    const [loading, setLoading] = useState(false);
    const [pageError, setPageError] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [deleting, setDeleting] = useState(null);

    const periodLabel =
        PERIOD_OPTIONS.find((item) => item.value === period)?.label || period;

    const fetchBudgets = async () => {
        try {
            setLoading(true);
            setPageError("");

            const response = await api.get("/budgets", {
                params: {
                    period,
                },
            });

            const budgetData = Array.isArray(response.data)
                ? response.data
                : response.data.data || [];

            setBudgets(budgetData);
        } catch (error) {
            console.error("Failed to fetch budgets:", error);

            setPageError(
                error?.response?.data?.message || "Failed to load budgets.",
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBudgets();
    }, [period]);

    const handleCreateBudget = async (payload) => {
        try {
            setPageError("");

            const response = await api.post("/budgets", payload);

            const createdBudget = response.data.data || response.data;

            if (createdBudget.period_month === period) {
                setBudgets((items) => [createdBudget, ...items]);
            } else {
                await fetchBudgets();
            }
        } catch (error) {
            console.error("Failed to create budget:", error);

            throw error;
        }
    };

    const handleUpdateBudget = async (next) => {
        try {
            setPageError("");

            const payload = {
                category_id: Number(next.category_id),
                limit: Number(next.limit),
                period: next.period,
                alert_at: Number(next.alert_at ?? next.alertAt ?? 80),
                notes: next.notes || null,
            };

            const response = await api.put(`/budgets/${next.id}`, payload);

            const updatedBudget = response.data.data || response.data;

            if (updatedBudget.period_month === period) {
                setBudgets((items) =>
                    items.map((item) =>
                        item.id === updatedBudget.id ? updatedBudget : item,
                    ),
                );
            } else {
                setBudgets((items) =>
                    items.filter((item) => item.id !== updatedBudget.id),
                );
            }

            setEditing(null);
        } catch (error) {
            console.error("Failed to update budget:", error);

            setPageError(
                error?.response?.data?.message || "Failed to update budget.",
            );
        }
    };

    const handleDeleteBudget = async () => {
        if (!deleting?.id) return;

        try {
            setPageError("");

            await api.delete(`/budgets/${deleting.id}`);

            setBudgets((items) =>
                items.filter((item) => item.id !== deleting.id),
            );

            setDeleting(null);
        } catch (error) {
            console.error("Failed to delete budget:", error);

            setPageError(
                error?.response?.data?.message || "Failed to delete budget.",
            );
        }
    };

    const totalBudget = budgets.reduce(
        (sum, budget) => sum + toNumber(budget.limit),
        0,
    );

    const totalSpent = budgets.reduce(
        (sum, budget) => sum + toNumber(budget.spent),
        0,
    );

    const remaining = Math.max(0, totalBudget - totalSpent);

    const overBudget = budgets.filter(
        (budget) => toNumber(budget.spent) > toNumber(budget.limit),
    );

    const healthPercentage =
        totalBudget > 0
            ? Math.max(0, Math.round((1 - totalSpent / totalBudget) * 100))
            : 100;

    const healthStroke =
        totalBudget > 0
            ? Math.max(0, 100 - (totalSpent / totalBudget) * 100) * 0.879
            : 87.9;

    const pieData = useMemo(() => {
        return budgets
            .filter((budget) => toNumber(budget.spent) > 0)
            .map((budget) => ({
                name: budget.category,
                value: toNumber(budget.spent),
                color: budget.color || "#8B5CF6",
                id: budget.id,
            }));
    }, [budgets]);

    return (
        <>
            <AddBudgetModal
                open={showModal}
                onClose={() => setShowModal(false)}
                onCreate={handleCreateBudget}
            />

            <EditBudgetModal
                open={!!editing}
                onClose={() => setEditing(null)}
                record={editing}
                onSave={handleUpdateBudget}
            />

            <ConfirmDeleteModal
                open={!!deleting}
                onClose={() => setDeleting(null)}
                itemName={deleting?.category}
                itemType="budget"
                onConfirm={handleDeleteBudget}
            />

            <div className="space-y-6 animate-in">
                {/* Summary */}
                <div className="grid sm:grid-cols-3 gap-4">
                    {loading ? (
                        <>
                            <SkeletonCard rows={2} showIcon={false} />
                            <SkeletonCard rows={2} showIcon={false} />
                            <SkeletonCard rows={2} showIcon={false} />
                        </>
                    ) : (
                        <>
                            <div className="finova-card text-center">
                                <p className="text-xs text-muted-foreground mb-1">
                                    Total Budget
                                </p>

                                <p className="text-2xl font-bold text-foreground">
                                    {fmt(totalBudget)}
                                </p>
                            </div>

                            <div className="finova-card text-center">
                                <p className="text-xs text-muted-foreground mb-1">
                                    Total Spent
                                </p>

                                <p
                                    className={`text-2xl font-bold ${
                                        totalSpent > totalBudget && totalBudget > 0
                                            ? "text-red-500"
                                            : "text-foreground"
                                    }`}
                                >
                                    {fmt(totalSpent)}
                                </p>
                            </div>

                            <div className="finova-card text-center">
                                <p className="text-xs text-muted-foreground mb-1">
                                    Remaining
                                </p>

                                <p
                                    className={`text-2xl font-bold ${
                                        totalBudget - totalSpent < 0
                                            ? "text-red-500"
                                            : "text-primary-500"
                                    }`}
                                >
                                    {fmt(remaining)}
                                </p>
                            </div>
                        </>
                    )}
                </div>

                {/* Error */}
                {pageError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-900/40 dark:bg-red-900/20">
                        {pageError}
                    </div>
                )}

                {/* Alerts */}
                {overBudget.length > 0 && (
                    <div className="finova-card bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800">
                        <div className="flex items-start gap-3">
                            <AlertCircle
                                className="text-red-500 flex-shrink-0 mt-0.5"
                                size={20}
                            />

                            <div>
                                <p className="font-semibold text-red-700 dark:text-red-400 text-sm">
                                    Budget Alert
                                </p>

                                <p className="text-red-600 dark:text-red-300 text-xs mt-0.5">
                                    {overBudget
                                        .map((budget) => budget.category)
                                        .join(", ")}{" "}
                                    {overBudget.length === 1 ? "has" : "have"}{" "}
                                    exceeded budget for {periodLabel}.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Budget list */}
                    <div className="lg:col-span-2 finova-card">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                            <SectionHeader
                                title="Budget Overview"
                                subtitle={periodLabel}
                            />

                            <div className="flex items-center gap-2">
                                <select
                                    value={period}
                                    onChange={(event) =>
                                        setPeriod(event.target.value)
                                    }
                                    className="finova-input text-sm w-auto min-w-[150px]"
                                >
                                    {PERIOD_OPTIONS.map((item) => (
                                        <option
                                            key={item.value}
                                            value={item.value}
                                        >
                                            {item.label}
                                        </option>
                                    ))}
                                </select>

                                <button
                                    onClick={() => setShowModal(true)}
                                    className="btn-primary flex items-center gap-2 text-sm px-4 py-2"
                                >
                                    <Plus size={16} />
                                    New Budget
                                </button>
                            </div>
                        </div>

                        {loading ? (
                            <BudgetListSkeleton />
                        ) : budgets.length === 0 ? (
                            <div className="py-10 text-center text-sm text-muted-foreground border border-dashed border-border rounded-xl">
                                No budgets found for {periodLabel}.
                            </div>
                        ) : (
                            <div className="space-y-5">
                                {budgets.map((budget) => {
                                    const limit = toNumber(budget.limit);
                                    const spent = toNumber(budget.spent);
                                    const pct =
                                        limit > 0 ? (spent / limit) * 100 : 0;
                                    const isOver = pct > 100;
                                    const isWarn =
                                        pct >=
                                            toNumber(
                                                budget.alertAt ??
                                                    budget.alert_at ??
                                                    80,
                                            ) && !isOver;

                                    return (
                                        <div key={budget.id} className="group">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                                                        style={{
                                                            background: `${
                                                                budget.color ||
                                                                "#8B5CF6"
                                                            }20`,
                                                        }}
                                                    >
                                                        {budget.icon || "🏷️"}
                                                    </div>

                                                    <div>
                                                        <p className="font-semibold text-foreground text-sm">
                                                            {budget.category}
                                                        </p>

                                                        <p className="text-xs text-muted-foreground">
                                                            {fmt(spent)} spent
                                                            of {fmt(limit)}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {isOver && (
                                                        <span className="text-red-500 text-xs font-semibold">
                                                            +
                                                            {fmt(spent - limit)}
                                                        </span>
                                                    )}

                                                    {isOver ? (
                                                        <AlertCircle
                                                            size={16}
                                                            className="text-red-500"
                                                        />
                                                    ) : pct === 100 ? (
                                                        <CheckCircle2
                                                            size={16}
                                                            className="text-primary-500"
                                                        />
                                                    ) : null}

                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() =>
                                                                setEditing(
                                                                    budget,
                                                                )
                                                            }
                                                            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                                                            aria-label={`Edit ${budget.category} budget`}
                                                        >
                                                            <Pencil size={12} />
                                                        </button>

                                                        <button
                                                            onClick={() =>
                                                                setDeleting(
                                                                    budget,
                                                                )
                                                            }
                                                            className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-500"
                                                            aria-label={`Delete ${budget.category} budget`}
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            <ProgressBar
                                                value={spent}
                                                max={limit}
                                                color={
                                                    budget.color || "#8B5CF6"
                                                }
                                                showLabel={false}
                                                height={10}
                                            />

                                            <div className="flex justify-between mt-1 text-xs">
                                                <span className="text-muted-foreground">
                                                    {pct.toFixed(0)}% used
                                                </span>

                                                <span
                                                    className={
                                                        isOver
                                                            ? "text-red-500 font-semibold"
                                                            : isWarn
                                                              ? "text-amber-500 font-semibold"
                                                              : "text-muted-foreground"
                                                    }
                                                >
                                                    {isOver
                                                        ? `${fmt(
                                                              Math.abs(
                                                                  limit - spent,
                                                              ),
                                                          )} over`
                                                        : `${fmt(
                                                              limit - spent,
                                                          )} left`}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Add new budget row */}
                        <button
                            onClick={() => setShowModal(true)}
                            className="mt-5 w-full py-3 rounded-xl border-2 border-dashed border-border hover:border-primary-500 text-muted-foreground hover:text-primary-500 transition-all flex items-center justify-center gap-2 text-sm font-medium"
                        >
                            <Plus size={16} />
                            Add Another Budget
                        </button>
                    </div>

                    {/* Donut overview */}
                    <div className="space-y-6">
                        <div className="finova-card">
                            <SectionHeader title="Spending Breakdown" />

                            {loading ? (
                                <ChartSkeleton type="donut" />
                            ) : pieData.length === 0 ? (
                                <div className="h-[180px] flex items-center justify-center text-sm text-muted-foreground">
                                    No spending data yet.
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={180}>
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={75}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {pieData.map((item) => (
                                                <Cell
                                                    key={item.id}
                                                    fill={item.color}
                                                />
                                            ))}
                                        </Pie>

                                        <Tooltip
                                            formatter={(value) =>
                                                fmt(Number(value))
                                            }
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}

                            {!loading && <div className="space-y-2 mt-2">
                                {budgets.map((budget) => (
                                    <div
                                        key={budget.id}
                                        className="flex items-center justify-between text-xs"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="w-2.5 h-2.5 rounded-full"
                                                style={{
                                                    background:
                                                        budget.color ||
                                                        "#8B5CF6",
                                                }}
                                            />

                                            <span className="text-muted-foreground">
                                                {budget.category}
                                            </span>
                                        </div>

                                        <span className="font-semibold">
                                            {fmt(budget.spent)}
                                        </span>
                                    </div>
                                ))}

                                {budgets.length === 0 && (
                                    <p className="text-xs text-muted-foreground text-center">
                                        No budget categories yet.
                                    </p>
                                )}
                            </div>}
                        </div>

                        {/* Health score */}
                        <div className="finova-card">
                            <SectionHeader title="Budget Health" />

                            {loading ? (
                                <div className="py-4">
                                    <Skeleton className="mx-auto h-28 w-28 rounded-full" />
                                    <Skeleton className="mx-auto mt-4 h-4 w-28" />
                                </div>
                            ) : (
                            <div className="text-center py-4">
                                <div className="relative inline-flex items-center justify-center">
                                    <svg
                                        className="w-28 h-28 -rotate-90"
                                        viewBox="0 0 36 36"
                                    >
                                        <circle
                                            cx="18"
                                            cy="18"
                                            r="14"
                                            fill="none"
                                            className="stroke-muted"
                                            strokeWidth="3"
                                        />

                                        <circle
                                            cx="18"
                                            cy="18"
                                            r="14"
                                            fill="none"
                                            stroke="#2563EB"
                                            strokeWidth="3"
                                            strokeDasharray={`${healthStroke} 100`}
                                            strokeLinecap="round"
                                        />
                                    </svg>

                                    <div className="absolute text-center">
                                        <p className="text-2xl font-bold text-primary-500">
                                            {healthPercentage}%
                                        </p>

                                        <p className="text-[9px] text-muted-foreground leading-tight">
                                            remaining
                                        </p>
                                    </div>
                                </div>

                                <p className="text-sm font-semibold text-foreground mt-2">
                                    {totalBudget === 0
                                        ? "No Budget Yet"
                                        : totalSpent > totalBudget
                                          ? "🚨 Over Budget"
                                          : totalSpent / totalBudget > 0.8
                                            ? "⚠️ Almost there"
                                            : "✅ On Track"}
                                </p>
                            </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

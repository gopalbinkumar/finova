import { useEffect, useMemo, useState } from 'react';
import {
    Plus,
    CheckCircle2,
    Clock,
    Pencil,
    Trash2,
    Zap,
    RefreshCw,
} from 'lucide-react';
import { ProgressBar, SectionHeader } from '@/components/ui/Cards';
import {
    ConfirmDeleteModal,
    EditRecordModal,
} from '@/components/ui/RecordActions';
import { AddGoalModal } from '@/components/modals/AddGoalModal';
import { GoalAllocationsModal } from '@/components/modals/GoalAllocationsModal';
import { api } from '@/services/api';

const fmt = (n) =>
    new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
    }).format(Number(n) || 0);

const fmtDate = (date) => {
    if (!date) return '-';

    const parsed = new Date(`${date}T00:00:00`);

    if (Number.isNaN(parsed.getTime())) {
        return '-';
    }

    return parsed.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};

const daysLeft = (deadline) => {
    if (!deadline) return null;

    const targetDate = new Date(`${deadline}T00:00:00`);
    const today = new Date();

    targetDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    if (Number.isNaN(targetDate.getTime())) {
        return null;
    }

    const diff = targetDate.getTime() - today.getTime();

    return Math.ceil(diff / 86_400_000);
};

const normalizeGoal = (goal) => {
    const target = Number(goal?.target_amount ?? goal?.target ?? 0);
    const current = Number(goal?.current_amount ?? goal?.current ?? 0);
    const allocations = goal?.allocations ?? goal?.goal_accounts ?? [];

    return {
        ...goal,
        id: Number(goal.id),
        target,
        target_amount: target,
        current,
        current_amount: current,
        remaining: Number(goal?.remaining ?? Math.max(target - current, 0)),
        progress:
            goal?.progress !== undefined
                ? Number(goal.progress)
                : target > 0
                  ? (current / target) * 100
                  : 0,
        allocations,
        goal_accounts: goal?.goal_accounts ?? allocations,
        status:
            goal?.status ??
            (target > 0 && current >= target ? 'completed' : 'active'),
    };
};

const goalFields = [
    {
        key: 'name',
        label: 'Goal Name',
        required: true,
        placeholder: 'Goal name',
    },
    {
        key: 'deadline',
        label: 'Target Date',
        type: 'date',
    },
    {
        key: 'target',
        label: 'Target Amount',
        type: 'number',
        leftDecor: '$',
        min: '0',
        step: '100',
    },
    {
        key: 'icon',
        label: 'Icon',
        placeholder: 'Emoji',
    },
    {
        key: 'color',
        label: 'Goal Color',
        type: 'color',
    },
    {
        key: 'notes',
        label: 'Notes',
        type: 'textarea',
        fullWidth: true,
        placeholder: 'Goal notes',
    },
];

export function GoalsPage() {
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pageError, setPageError] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [allocating, setAllocating] = useState(null);
    const [deleting, setDeleting] = useState(null);

    const fetchGoals = async () => {
        try {
            setLoading(true);
            setPageError('');

            const response = await api.get('/goals');
            const rows = response.data.data || [];

            setGoals(rows.map(normalizeGoal));
        } catch (error) {
            setPageError(
                error?.response?.data?.message ||
                    'Failed to load goals. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGoals();
    }, []);

    const completed = useMemo(
        () => goals.filter((goal) => goal.target > 0 && goal.current >= goal.target),
        [goals]
    );

    const active = useMemo(
        () => goals.filter((goal) => !(goal.target > 0 && goal.current >= goal.target)),
        [goals]
    );

    const totalSaved = useMemo(
        () => goals.reduce((sum, goal) => sum + Number(goal.current || 0), 0),
        [goals]
    );

    const totalTarget = useMemo(
        () => goals.reduce((sum, goal) => sum + Number(goal.target || 0), 0),
        [goals]
    );

    const handleCreateGoal = (next) => {
        const savedGoal = normalizeGoal(next);

        setGoals((items) => {
            const exists = items.some((item) => item.id === savedGoal.id);

            if (exists) {
                return items.map((item) =>
                    item.id === savedGoal.id ? savedGoal : item
                );
            }

            return [savedGoal, ...items];
        });

        setShowModal(false);
    };

    const handleUpdateGoal = async (next) => {
        if (!next?.id) return;

        const target = Number(next.target ?? next.target_amount ?? 0);

        const payload = {
            name: next.name?.trim(),
            target_amount: target,
            deadline: next.deadline,
            icon: next.icon || '🎯',
            color: next.color || '#2563EB',
            notes: next.notes?.trim() || null,
            status: next.status || 'active',
        };

        try {
            setPageError('');

            const response = await api.put(`/goals/${next.id}`, payload);
            const savedGoal = normalizeGoal(response.data.data);

            setGoals((items) =>
                items.map((item) =>
                    item.id === savedGoal.id ? savedGoal : item
                )
            );

            setEditing(null);
        } catch (error) {
            setPageError(
                error?.response?.data?.message ||
                    'Failed to update goal. Please check your input.'
            );
        }
    };

    const handleSaveAllocations = (next) => {
        const savedGoal = normalizeGoal(next);

        setGoals((items) =>
            items.map((item) =>
                item.id === savedGoal.id ? savedGoal : item
            )
        );

        setAllocating(null);
    };

    const handleDeleteGoal = async () => {
        if (!deleting?.id) return;

        try {
            setPageError('');

            await api.delete(`/goals/${deleting.id}`);

            setGoals((items) =>
                items.filter((item) => item.id !== deleting.id)
            );

            setDeleting(null);
        } catch (error) {
            setPageError(
                error?.response?.data?.message ||
                    'Failed to delete goal. Please try again.'
            );
        }
    };

    const renderGoalCard = (goal, isCompleted = false) => {
        const pct =
            goal.target > 0
                ? Math.min(Math.round((goal.current / goal.target) * 100), 999)
                : 0;

        const days = daysLeft(goal.deadline);
        const remaining = Math.max(goal.target - goal.current, 0);

        return (
            <div
                key={goal.id}
                className={`finova-card group relative hover:shadow-lg transition-all ${
                    isCompleted
                        ? 'border-primary-500/30 bg-primary-50/30 dark:bg-primary-900/10 overflow-hidden'
                        : ''
                }`}
            >
                {isCompleted && (
                    <div className="absolute top-3 right-3">
                        <CheckCircle2
                            className="text-primary-500"
                            size={20}
                        />
                    </div>
                )}

                {!isCompleted && (
                    <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => setEditing(goal)}
                            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                            aria-label={`Edit ${goal.name}`}
                        >
                            <Pencil size={14} />
                        </button>

                        <button
                            onClick={() => setDeleting(goal)}
                            className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-500"
                            aria-label={`Delete ${goal.name}`}
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                )}

                {isCompleted && (
                    <div className="absolute top-3 right-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => setEditing(goal)}
                            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                            aria-label={`Edit ${goal.name}`}
                        >
                            <Pencil size={14} />
                        </button>

                        <button
                            onClick={() => setDeleting(goal)}
                            className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-500"
                            aria-label={`Delete ${goal.name}`}
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                    <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                        style={{ background: `${goal.color}20` }}
                    >
                        {goal.icon}
                    </div>

                    <div className="min-w-0">
                        <p className="font-bold text-foreground leading-tight truncate">
                            {goal.name}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                            {goal.notes || 'No notes'}
                        </p>
                    </div>
                </div>

                <div className="mb-3">
                    <div className="flex justify-between items-baseline mb-1">
                        <span
                            className={`text-xl font-bold ${
                                isCompleted
                                    ? 'text-primary-500'
                                    : 'text-foreground'
                            }`}
                        >
                            {fmt(goal.current)}
                        </span>

                        <span className="text-sm text-muted-foreground">
                            / {fmt(goal.target)}
                        </span>
                    </div>

                    <ProgressBar
                        value={goal.current}
                        max={goal.target || 1}
                        color={goal.color}
                        showLabel={false}
                        height={8}
                    />

                    <div className="flex justify-between mt-1 text-xs">
                        <span
                            className="font-semibold"
                            style={{ color: goal.color }}
                        >
                            {pct}% saved
                        </span>

                        <span className="text-muted-foreground">
                            {isCompleted
                                ? 'Completed ✅'
                                : `${fmt(remaining)} to go`}
                        </span>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock size={12} />
                        <span>Due {fmtDate(goal.deadline)}</span>
                    </div>

                    {!isCompleted && (
                        <span
                            className={`text-xs font-semibold flex items-center gap-1 ${
                                days === null
                                    ? 'text-muted-foreground'
                                    : days < 30
                                      ? 'text-red-500'
                                      : days < 90
                                        ? 'text-amber-500'
                                        : 'text-muted-foreground'
                            }`}
                        >
                            <Zap size={10} />
                            {days === null
                                ? '-'
                                : days > 0
                                  ? `${days}d left`
                                  : 'Overdue'}
                        </span>
                    )}

                    {isCompleted && (
                        <span className="text-xs font-semibold text-primary-500">
                            Done
                        </span>
                    )}
                </div>

                <button
                    onClick={() => setAllocating(goal)}
                    className="w-full mt-3 py-2 rounded-lg text-xs font-semibold transition-all border"
                    style={{
                        borderColor: `${goal.color}50`,
                        color: goal.color,
                    }}
                    onMouseEnter={(event) => {
                        event.currentTarget.style.background = `${goal.color}15`;
                    }}
                    onMouseLeave={(event) => {
                        event.currentTarget.style.background = 'transparent';
                    }}
                >
                    Manage Allocations
                </button>
            </div>
        );
    };

    return (
        <>
            <AddGoalModal
                open={showModal}
                onClose={() => setShowModal(false)}
                onSave={handleCreateGoal}
            />

            <EditRecordModal
                open={!!editing}
                onClose={() => setEditing(null)}
                title="Edit Goal"
                subtitle="Update goal details"
                record={editing}
                fields={goalFields}
                iconColor={editing?.color}
                onSave={handleUpdateGoal}
            />

            <GoalAllocationsModal
                open={!!allocating}
                onClose={() => setAllocating(null)}
                record={allocating}
                onSave={handleSaveAllocations}
            />

            <ConfirmDeleteModal
                open={!!deleting}
                onClose={() => setDeleting(null)}
                itemName={deleting?.name}
                itemType="goal"
                onConfirm={handleDeleteGoal}
            />

            <div className="space-y-6 animate-in">
                <div className="grid sm:grid-cols-3 gap-4">
                    <div className="finova-card text-center">
                        <p className="text-xs text-muted-foreground">
                            Total Saved
                        </p>
                        <p className="text-2xl font-bold text-primary-500 mt-1">
                            {fmt(totalSaved)}
                        </p>
                    </div>

                    <div className="finova-card text-center">
                        <p className="text-xs text-muted-foreground">
                            Total Target
                        </p>
                        <p className="text-2xl font-bold text-foreground mt-1">
                            {fmt(totalTarget)}
                        </p>
                    </div>

                    <div className="finova-card text-center">
                        <p className="text-xs text-muted-foreground">
                            Goals Completed
                        </p>
                        <p className="text-2xl font-bold text-foreground mt-1">
                            {completed.length} / {goals.length}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-bold text-foreground">
                            Financial Goals
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Track goals and allocate funds across accounts.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={fetchGoals}
                            disabled={loading}
                            className="btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <RefreshCw
                                size={16}
                                className={loading ? 'animate-spin' : ''}
                            />
                            Refresh
                        </button>

                        <button
                            onClick={() => setShowModal(true)}
                            className="btn-primary flex items-center gap-2"
                        >
                            <Plus size={16} />
                            New Goal
                        </button>
                    </div>
                </div>

                {pageError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                        {pageError}
                    </div>
                )}

                {loading && (
                    <div className="finova-card text-center py-10">
                        <p className="text-sm text-muted-foreground">
                            Loading goals...
                        </p>
                    </div>
                )}

                {!loading && completed.length > 0 && (
                    <div>
                        <SectionHeader
                            title={`🎉 Completed (${completed.length})`}
                        />

                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {completed.map((goal) =>
                                renderGoalCard(goal, true)
                            )}
                        </div>
                    </div>
                )}

                {!loading && (
                    <div>
                        <SectionHeader
                            title={`🎯 Active Goals (${active.length})`}
                        />

                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {active.map((goal) =>
                                renderGoalCard(goal, false)
                            )}

                            <button
                                onClick={() => setShowModal(true)}
                                className="finova-card border-2 border-dashed border-border hover:border-primary-500 flex flex-col items-center justify-center gap-3 min-h-[220px] text-muted-foreground hover:text-primary-500 transition-all group"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 transition-colors">
                                    <Plus size={24} />
                                </div>

                                <span className="text-sm font-semibold">
                                    Create New Goal
                                </span>
                            </button>
                        </div>
                    </div>
                )}

                {!loading && !goals.length && (
                    <div className="finova-card text-center py-10">
                        <div className="w-14 h-14 rounded-2xl bg-muted mx-auto flex items-center justify-center mb-3">
                            <Plus size={24} />
                        </div>

                        <p className="font-bold text-foreground">
                            No goals yet
                        </p>

                        <p className="text-sm text-muted-foreground mt-1">
                            Create your first financial goal and start tracking
                            allocations.
                        </p>

                        <button
                            onClick={() => setShowModal(true)}
                            className="btn-primary mt-4 inline-flex items-center gap-2"
                        >
                            <Plus size={16} />
                            New Goal
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
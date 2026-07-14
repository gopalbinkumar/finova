import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart as RePieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";
import {
    TrendingUp,
    TrendingDown,
    Target,
    CreditCard,
    Calendar,
    Plus,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { StatCard, ProgressBar, SectionHeader } from "@/components/ui/Cards";
import { AddTransactionModal } from "@/components/modals/AddTransactionModal";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import { api } from "@/services/api";
import { useCurrencyFormatter } from "@/utils/currency";

const defaultDashboard = {
    userName: "User",
    periodLabel: "",
    currentMonthShort: "",
    summaryStats: {
        netWorth: 0,
        totalBalance: 0,
        totalInvestment: 0,
        monthlyIncome: 0,
        monthlyExpense: 0,
        activeGoals: 0,
        activeDebts: 0,
    },
    monthlyStats: {
        current: { income: 0, expense: 0 },
        last: { income: 0, expense: 0 },
        incomeTrend: 0,
        expenseTrend: 0,
    },
    completedGoalsCount: 0,
    debtDueThisWeek: 0,
    monthlyChartData: [],
    expenseCategoryData: [],
    expenseChartData: [{ name: "No spending", value: 0, color: "#94A3B8" }],
    cashFlowData: [],
    recent: [],
    topBudgets: [],
    upcomingBills: [],
};

const getGreeting = () => {
    const hour = new Date().getHours();

    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
};

const CustomTooltip = ({ active, payload, label, formatter }) => {
    if (!active || !payload?.length) return null;

    return (
        <div className="finova-card !p-3 !shadow-xl text-xs space-y-1 min-w-[120px]">
            <p className="font-semibold text-foreground mb-2">{label}</p>
            {payload.map((p) => (
                <div
                    key={p.name}
                    className="flex items-center justify-between gap-4"
                >
                    <span style={{ color: p.color }}>{p.name}</span>
                    <span className="font-semibold">{formatter(p.value)}</span>
                </div>
            ))}
        </div>
    );
};

export function DashboardPage() {
    const { formatCurrency: fmt, formatCurrencyCompact } = useCurrencyFormatter();

    const [dashboard, setDashboard] = useState(defaultDashboard);
    const [showTxModal, setShowTxModal] = useState(false);
    const [loadingDashboard, setLoadingDashboard] = useState(false);
    const [pageError, setPageError] = useState("");

    const fetchDashboard = async () => {
        try {
            setLoadingDashboard(true);
            setPageError("");

            const response = await api.get("/dashboard");
            setDashboard({
                ...defaultDashboard,
                ...response.data.data,
            });
        } catch (error) {
            console.error("Failed to fetch dashboard:", error);
            setPageError(
                error?.response?.data?.message || "Failed to load dashboard.",
            );
        } finally {
            setLoadingDashboard(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
    }, []);

    const {
        periodLabel,
        currentMonthShort,
        summaryStats,
        monthlyStats,
        completedGoalsCount,
        debtDueThisWeek,
        monthlyChartData,
        expenseCategoryData,
        expenseChartData,
        cashFlowData,
        recent,
        topBudgets,
        upcomingBills,
        userName,
    } = dashboard;

    return (
        <>
            <AddTransactionModal
                open={showTxModal}
                onClose={() => setShowTxModal(false)}
                onCreate={() => {
                    setShowTxModal(false);
                    fetchDashboard();
                }}
            />

            {loadingDashboard ? (
                <DashboardSkeleton />
            ) : (
            <div className="space-y-6 animate-in">
                {pageError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-900/40 dark:bg-red-900/20">
                        {pageError}
                    </div>
                )}

                <div
                    className="relative rounded-2xl overflow-hidden p-6 text-white"
                    style={{
                        background:
                            "linear-gradient(135deg, #0F172A 0%, #2563EB 100%)",
                    }}
                >
                    <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
                        <svg viewBox="0 0 200 200" fill="none">
                            <circle cx="150" cy="50" r="80" fill="white" />
                            <circle cx="50" cy="150" r="60" fill="white" />
                        </svg>
                    </div>
                    <div className="relative">
                        <p className="text-white/70 text-sm mb-1">
                            {getGreeting()}
                        </p>
                        <h1 className="text-2xl font-bold mb-1">
                            Welcome back, {userName}!
                        </h1>
                        <p className="text-white/70 text-sm">
                            Here's your financial overview for {periodLabel}.
                        </p>
                    </div>
                    <div className="relative mt-6 flex flex-wrap gap-3">
                        <div className="bg-white/10 rounded-xl p-3">
                            <p className="text-white/60 text-xs">Net Worth</p>
                            <p className="text-xl font-bold">
                                {fmt(summaryStats.netWorth)}
                            </p>
                        </div>
                        <div className="bg-white/10 rounded-xl p-3 hidden sm:block">
                            <p className="text-white/60 text-xs">
                                Total Balance
                            </p>
                            <p className="text-xl font-bold">
                                {fmt(summaryStats.totalBalance)}
                            </p>
                        </div>
                        <div className="bg-white/10 rounded-xl p-3 hidden sm:block">
                            <p className="text-white/60 text-xs">Investments</p>
                            <p className="text-xl font-bold">
                                {fmt(summaryStats.totalInvestment)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
                    <StatCard
                        title="Monthly Income"
                        value={fmt(summaryStats.monthlyIncome)}
                        subtitle={`vs ${fmt(monthlyStats.last.income)} last month`}
                        icon={<TrendingUp size={20} />}
                        trend={{
                            value: Number(monthlyStats.incomeTrend.toFixed(1)),
                            label: "vs last month",
                        }}
                        accentColor="#2563EB"
                        className="animate-in"
                    />
                    <StatCard
                        title="Monthly Expenses"
                        value={fmt(summaryStats.monthlyExpense)}
                        subtitle={`vs ${fmt(monthlyStats.last.expense)} last month`}
                        icon={<TrendingDown size={20} />}
                        trend={{
                            value: Number(monthlyStats.expenseTrend.toFixed(1)),
                            label: "vs last month",
                        }}
                        accentColor="#EF4444"
                        className="animate-in"
                    />
                    <StatCard
                        title="Active Goals"
                        value={`${summaryStats.activeGoals}`}
                        subtitle={`${completedGoalsCount} completed`}
                        icon={<Target size={20} />}
                        accentColor="#8B5CF6"
                        className="animate-in"
                    />
                    <StatCard
                        title="Active Debts"
                        value={`${summaryStats.activeDebts}`}
                        subtitle={`${fmt(debtDueThisWeek)} due this week`}
                        icon={<CreditCard size={20} />}
                        accentColor="#F59E0B"
                        className="animate-in"
                    />
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 finova-card">
                        <SectionHeader
                            title="Income vs Expenses"
                            subtitle="Last 6 months"
                        />
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart
                                data={monthlyChartData}
                                barSize={20}
                                barGap={4}
                            >
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
                                    tickFormatter={(v) => formatCurrencyCompact(v)}
                                />
                                <Tooltip content={<CustomTooltip formatter={fmt} />} />
                                <Legend
                                    iconType="circle"
                                    iconSize={8}
                                    wrapperStyle={{ fontSize: 12 }}
                                />
                                <Bar
                                    dataKey="income"
                                    name="Income"
                                    fill="#2563EB"
                                    radius={[4, 4, 0, 0]}
                                />
                                <Bar
                                    dataKey="expense"
                                    name="Expense"
                                    fill="#EF4444"
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="finova-card">
                        <SectionHeader
                            title="Spending Breakdown"
                            subtitle={periodLabel}
                        />
                        <div className="flex flex-col items-center">
                            <ResponsiveContainer width="100%" height={160}>
                                <RePieChart>
                                    <Pie
                                        data={expenseChartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={45}
                                        outerRadius={70}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {expenseChartData.map((entry, i) => (
                                            <Cell key={i} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(v) => fmt(v)} />
                                </RePieChart>
                            </ResponsiveContainer>
                            <div className="w-full space-y-1.5 mt-2">
                                {expenseCategoryData.slice(0, 4).map((d) => (
                                    <div
                                        key={d.name}
                                        className="flex items-center justify-between text-xs"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                                style={{ background: d.color }}
                                            />
                                            <span className="text-muted-foreground">
                                                {d.name}
                                            </span>
                                        </div>
                                        <span className="font-semibold text-foreground">
                                            {fmt(d.value)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 finova-card">
                        <SectionHeader
                            title="Recent Transactions"
                            subtitle="Latest 6 transactions"
                            action={
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setShowTxModal(true)}
                                        className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors"
                                    >
                                        <Plus size={12} />
                                        Add
                                    </button>
                                    <Link
                                        to="/transactions"
                                        className="text-xs text-primary-500 hover:underline font-medium"
                                    >
                                        View all -&gt;
                                    </Link>
                                </div>
                            }
                        />
                        <div className="space-y-1">
                            {recent.map((tx) => (
                                <div
                                    key={tx.id}
                                    className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0"
                                >
                                    <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-base flex-shrink-0">
                                        {tx.type === "income"
                                            ? "+"
                                            : tx.type === "transfer"
                                              ? "<>"
                                              : "-"}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate">
                                            {tx.description}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {tx.category} - {tx.date}
                                        </p>
                                    </div>
                                    <span
                                        className={`text-sm font-bold flex-shrink-0 ${tx.type === "income" ? "text-primary-500" : tx.type === "transfer" ? "text-blue-500" : "text-red-500"}`}
                                    >
                                        {tx.type === "income"
                                            ? "+"
                                            : tx.type === "transfer"
                                              ? "<>"
                                              : "-"}
                                        {fmt(tx.amount)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="finova-card">
                            <SectionHeader
                                title="Budget Snapshot"
                                action={
                                    <Link
                                        to="/budget"
                                        className="text-xs text-primary-500 hover:underline font-medium"
                                    >
                                        View all -&gt;
                                    </Link>
                                }
                            />
                            <div className="space-y-4">
                                {topBudgets.map((b) => (
                                    <div key={b.id}>
                                        <div className="flex items-center justify-between mb-1.5 text-sm">
                                            <span className="flex items-center gap-1.5">
                                                <span>{b.icon}</span>
                                                <span className="text-foreground font-medium">
                                                    {b.category}
                                                </span>
                                            </span>
                                            <span className="text-muted-foreground text-xs">
                                                {fmt(b.spent)} / {fmt(b.limit)}
                                            </span>
                                        </div>
                                        <ProgressBar
                                            value={b.spent}
                                            max={b.limit || 1}
                                            color={b.color}
                                            showLabel={false}
                                            height={6}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="finova-card">
                            <SectionHeader
                                title="Upcoming Bills"
                                action={
                                    <Calendar
                                        size={16}
                                        className="text-muted-foreground"
                                    />
                                }
                            />
                            <div className="space-y-3">
                                {upcomingBills.map((bill, i) => (
                                    <div
                                        key={`${bill.name}-${i}`}
                                        className="flex items-center gap-3"
                                    >
                                        <div
                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                                            style={{
                                                background: `${bill.color}20`,
                                            }}
                                        >
                                            {bill.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-foreground">
                                                {bill.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Due {bill.dueDate}
                                            </p>
                                        </div>
                                        <span className="text-sm font-semibold text-foreground">
                                            {fmt(bill.amount)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="finova-card">
                    <SectionHeader
                        title="Cash Flow"
                        subtitle={`Balance trend - ${periodLabel}`}
                    />
                    <ResponsiveContainer width="100%" height={180}>
                        <AreaChart data={cashFlowData}>
                            <defs>
                                <linearGradient
                                    id="cashFlowGrad"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >
                                    <stop
                                        offset="5%"
                                        stopColor="#2563EB"
                                        stopOpacity={0.3}
                                    />
                                    <stop
                                        offset="95%"
                                        stopColor="#2563EB"
                                        stopOpacity={0}
                                    />
                                </linearGradient>
                            </defs>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="var(--border)"
                                vertical={false}
                            />
                            <XAxis
                                dataKey="day"
                                tick={{
                                    fontSize: 11,
                                    fill: "var(--muted-foreground)",
                                }}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(v) => `${currentMonthShort} ${v}`}
                            />
                            <YAxis
                                tick={{
                                    fontSize: 11,
                                    fill: "var(--muted-foreground)",
                                }}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(v) => formatCurrencyCompact(v)}
                            />
                            <Tooltip formatter={(v) => [fmt(v), "Balance"]} />
                            <Area
                                type="monotone"
                                dataKey="balance"
                                stroke="#2563EB"
                                strokeWidth={2.5}
                                fill="url(#cashFlowGrad)"
                                dot={false}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
            )}
        </>
    );
}

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
export function StatCard({
    title,
    value,
    subtitle,
    icon,
    trend,
    accentColor = "#2563EB",
    className = "",
}) {
    const trendPositive = (trend?.value ?? 0) >= 0;
    return (
        <div className={`finova-card group cursor-default ${className}`}>
            <div className="flex items-start justify-between mb-4">
                <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                    style={{
                        background: `${accentColor}20`,
                        color: accentColor,
                    }}
                >
                    {icon}
                </div>
                {trend && (
                    <div
                        className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${trendPositive ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400" : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"}`}
                    >
                        {trendPositive ? (
                            <TrendingUp size={12} />
                        ) : trend.value === 0 ? (
                            <Minus size={12} />
                        ) : (
                            <TrendingDown size={12} />
                        )}
                        {Math.abs(trend.value)}%
                    </div>
                )}
            </div>

            <div>
                <p className="text-sm text-muted-foreground font-medium">
                    {title}
                </p>
                <p className="text-2xl font-bold text-foreground mt-0.5 leading-tight">
                    {value}
                </p>
                {subtitle && (
                    <p className="text-xs text-muted-foreground mt-1">
                        {subtitle}
                    </p>
                )}
                {trend && (
                    <p className="text-xs text-muted-foreground mt-1">
                        {trend.label}
                    </p>
                )}
            </div>
        </div>
    );
}
export function MiniStat({ label, value, color = "#2563EB", dot = false }) {
    return (
        <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
                {dot && (
                    <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ background: color }}
                    />
                )}
                <span className="text-sm text-muted-foreground">{label}</span>
            </div>
            <span className="text-sm font-semibold text-foreground">
                {value}
            </span>
        </div>
    );
}
export function ProgressBar({
    value,
    max = 100,
    color = "#2563EB",
    showLabel = true,
    height = 8,
    className = "",
}) {
    const pct = Math.min((value / max) * 100, 100);
    const overBudget = pct >= 100;
    const warning = pct >= 80;
    const barColor = overBudget ? "#EF4444" : warning ? "#F59E0B" : color;
    return (
        <div className={`w-full ${className}`}>
            <div
                className="rounded-full bg-muted overflow-hidden"
                style={{ height }}
            >
                <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                        width: `${Math.min(pct, 100)}%`,
                        background: barColor,
                    }}
                />
            </div>
            {showLabel && (
                <div className="flex justify-between mt-1">
                    <span className="text-xs text-muted-foreground">
                        {pct.toFixed(0)}%
                    </span>
                    <span
                        className={`text-xs font-medium ${overBudget ? "text-red-500" : warning ? "text-amber-500" : "text-muted-foreground"}`}
                    >
                        {overBudget
                            ? "Over budget!"
                            : warning
                              ? "Near limit"
                              : "On track"}
                    </span>
                </div>
            )}
        </div>
    );
}
const badgeStyles = {
    success:
        "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300",
    danger: "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300",
    warning:
        "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300",
    info: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300",
    neutral: "bg-muted text-muted-foreground",
};
export function Badge({ children, variant = "neutral" }) {
    return (
        <span
            className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${badgeStyles[variant]}`}
        >
            {children}
        </span>
    );
}
// ─── Empty State ───────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4 text-3xl">
                {icon}
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1">
                {title}
            </h3>
            {description && (
                <p className="text-sm text-muted-foreground mb-4 max-w-xs">
                    {description}
                </p>
            )}
            {action}
        </div>
    );
}
// ─── Section Header ────────────────────────────────────────────────────────────
export function SectionHeader({ title, subtitle, action }) {
    return (
        <div className="flex items-center justify-between mb-5">
            <div>
                <h2 className="text-base font-bold text-foreground">{title}</h2>
                {subtitle && (
                    <p className="text-sm text-muted-foreground mt-0.5">
                        {subtitle}
                    </p>
                )}
            </div>
            {action}
        </div>
    );
}

export function Skeleton({ className = "", ...props }) {
    return (
        <div
            className={`animate-pulse rounded-lg bg-muted ${className}`}
            {...props}
        />
    );
}

export function SkeletonLine({ className = "" }) {
    return <Skeleton className={`h-3 ${className}`} />;
}

export function SkeletonCard({
    rows = 3,
    showIcon = true,
    className = "",
}) {
    return (
        <div className={`finova-card ${className}`}>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-3">
                    {Array.from({ length: rows }).map((_, index) => (
                        <Skeleton
                            key={index}
                            className={
                                index === 0
                                    ? "h-3 w-24"
                                    : index === 1
                                      ? "h-7 w-32"
                                      : "h-3 w-28"
                            }
                        />
                    ))}
                </div>
                {showIcon && <Skeleton className="h-10 w-10 rounded-xl" />}
            </div>
        </div>
    );
}

export function PageHeaderSkeleton({ className = "" }) {
    return (
        <div className={`flex items-center justify-between gap-4 ${className}`}>
            <div className="space-y-2">
                <Skeleton className="h-7 w-48 max-w-full" />
                <SkeletonLine className="w-64 max-w-full" />
            </div>
            <Skeleton className="hidden h-10 w-28 sm:block" />
        </div>
    );
}

export function SkeletonList({
    rows = 5,
    showAvatar = true,
    showTrailing = true,
    className = "",
}) {
    return (
        <div className={`space-y-1 ${className}`}>
            {Array.from({ length: rows }).map((_, index) => (
                <div
                    key={index}
                    className="flex items-center gap-3 border-b border-border/50 py-2.5 last:border-0"
                >
                    {showAvatar && <Skeleton className="h-9 w-9 rounded-lg" />}
                    <div className="min-w-0 flex-1 space-y-2">
                        <SkeletonLine className="w-44 max-w-full" />
                        <SkeletonLine className="w-32 max-w-full" />
                    </div>
                    {showTrailing && <SkeletonLine className="w-20" />}
                </div>
            ))}
        </div>
    );
}

export function AccountGridSkeleton() {
    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="rounded-xl border border-border p-5">
                    <div className="mb-4 flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-10 rounded-xl" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-28" />
                                <Skeleton className="h-3 w-20" />
                            </div>
                        </div>
                        <Skeleton className="h-6 w-6 rounded" />
                    </div>
                    <div className="mb-3 space-y-2">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-6 w-32" />
                    </div>
                    <Skeleton className="h-5 w-16 rounded-full" />
                </div>
            ))}
        </div>
    );
}

export function CategoryGridSkeleton() {
    return (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
                <div
                    key={index}
                    className="flex items-center gap-3 rounded-xl border border-border p-4"
                >
                    <Skeleton className="h-10 w-10 rounded-xl" />
                    <div className="min-w-0 flex-1 space-y-2">
                        <Skeleton className="h-4 w-32 max-w-full" />
                        <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                    <Skeleton className="h-7 w-14" />
                </div>
            ))}
        </div>
    );
}

export function BudgetListSkeleton() {
    return (
        <div className="space-y-5">
            {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-9 w-9 rounded-xl" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-40" />
                            </div>
                        </div>
                        <Skeleton className="h-5 w-20" />
                    </div>
                    <Skeleton className="h-2.5 w-full rounded-full" />
                    <div className="flex justify-between">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function GoalCardsSkeleton() {
    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="finova-card">
                    <div className="mb-4 flex items-center gap-3">
                        <Skeleton className="h-12 w-12 rounded-2xl" />
                        <div className="min-w-0 flex-1 space-y-2">
                            <Skeleton className="h-4 w-32 max-w-full" />
                            <Skeleton className="h-3 w-40 max-w-full" />
                        </div>
                    </div>
                    <div className="mb-3 flex items-baseline justify-between gap-3">
                        <Skeleton className="h-6 w-28" />
                        <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-2 w-full rounded-full" />
                    <div className="mt-4 flex items-center justify-between">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="mt-4 h-9 w-full" />
                </div>
            ))}
        </div>
    );
}

export function DebtRecordSkeleton({ rows = 3 }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, index) => (
                <div key={index} className="rounded-xl border border-border p-4">
                    <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 space-y-2">
                            <Skeleton className="h-4 w-36 max-w-full" />
                            <Skeleton className="h-3 w-44 max-w-full" />
                        </div>
                        <Skeleton className="h-7 w-20" />
                    </div>
                    <div className="mb-3 flex justify-between gap-3">
                        <Skeleton className="h-6 w-28" />
                        <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-2 w-full rounded-full" />
                    <div className="mt-3 flex items-center justify-between gap-3">
                        <Skeleton className="h-3 w-28" />
                        <Skeleton className="h-3 w-16" />
                    </div>
                </div>
            ))}
        </>
    );
}

export function ProfileSkeleton() {
    return (
        <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 animate-in">
            <PageHeaderSkeleton />

            <div className="finova-card">
                <Skeleton className="mb-5 h-5 w-36" />
                <div className="flex flex-col items-center gap-6 sm:flex-row">
                    <Skeleton className="h-24 w-24 rounded-full" />
                    <div className="w-full space-y-3 text-center sm:text-left">
                        <Skeleton className="mx-auto h-5 w-40 sm:mx-0" />
                        <Skeleton className="mx-auto h-4 w-56 sm:mx-0" />
                        <div className="flex justify-center gap-2 sm:justify-start">
                            <Skeleton className="h-8 w-28" />
                            <Skeleton className="h-8 w-20" />
                        </div>
                    </div>
                </div>
            </div>

            <SkeletonCard rows={5} showIcon={false} />
            <SkeletonCard rows={4} showIcon={false} />
        </div>
    );
}

export function SkeletonTable({
    rows = 6,
    columns = 5,
    className = "",
}) {
    return (
        <div className={`overflow-hidden rounded-xl border border-border ${className}`}>
            <div
                className="grid gap-4 border-b border-border bg-muted/50 px-4 py-3"
                style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
            >
                {Array.from({ length: columns }).map((_, index) => (
                    <SkeletonLine key={index} className="w-20" />
                ))}
            </div>
            <div className="divide-y divide-border">
                {Array.from({ length: rows }).map((_, rowIndex) => (
                    <div
                        key={rowIndex}
                        className="grid gap-4 px-4 py-3"
                        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
                    >
                        {Array.from({ length: columns }).map((_, columnIndex) => (
                            <SkeletonLine
                                key={columnIndex}
                                className={columnIndex === 0 ? "w-28" : "w-20"}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

export function ChartSkeleton({ type = "bar", className = "" }) {
    if (type === "donut") {
        return (
            <div className={className}>
                <div className="mx-auto mb-6 h-36 w-36 animate-pulse rounded-full border-[28px] border-muted bg-transparent" />
                <div className="space-y-3">
                    {[0, 1, 2, 3].map((item) => (
                        <div key={item} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-3 w-3 rounded-full" />
                                <SkeletonLine className="w-24" />
                            </div>
                            <SkeletonLine className="w-16" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (type === "line") {
        return (
            <div className={`relative h-[180px] border-b border-l border-border ${className}`}>
                <div className="absolute inset-x-3 bottom-4 top-6">
                    <svg
                        className="h-full w-full"
                        preserveAspectRatio="none"
                        viewBox="0 0 600 140"
                    >
                        <path
                            d="M0 110 C80 50 140 80 210 46 C280 10 340 70 410 38 C485 4 540 44 600 22"
                            fill="none"
                            stroke="var(--muted)"
                            strokeLinecap="round"
                            strokeWidth="12"
                            className="animate-pulse"
                        />
                    </svg>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex h-[220px] items-end gap-3 border-b border-l border-border px-3 pb-4 ${className}`}>
            {[58, 82, 45, 72, 62, 88, 54, 76, 66, 92, 70, 84].map(
                (height, index) => (
                    <Skeleton
                        key={index}
                        className="flex-1 rounded-t"
                        style={{ height: `${height}%` }}
                    />
                ),
            )}
        </div>
    );
}

export function DashboardSkeleton() {
    return (
        <div className="space-y-6 animate-in" aria-busy="true">
            <div
                className="relative overflow-hidden rounded-2xl p-6 text-white"
                style={{
                    background:
                        "linear-gradient(135deg, #0F172A 0%, #2563EB 100%)",
                }}
            >
                <div className="absolute top-0 right-0 h-64 w-64 opacity-10">
                    <svg viewBox="0 0 200 200" fill="none">
                        <circle cx="150" cy="50" r="80" fill="white" />
                        <circle cx="50" cy="150" r="60" fill="white" />
                    </svg>
                </div>
                <div className="relative space-y-3">
                    <div className="h-3 w-28 animate-pulse rounded bg-white/25" />
                    <div className="h-7 w-64 max-w-full animate-pulse rounded bg-white/30" />
                    <div className="h-3 w-80 max-w-full animate-pulse rounded bg-white/20" />
                </div>
                <div className="relative mt-6 flex flex-wrap gap-3">
                    {[0, 1, 2].map((item) => (
                        <div key={item} className="rounded-xl bg-white/10 p-3">
                            <div className="mb-3 h-3 w-20 animate-pulse rounded bg-white/20" />
                            <div className="h-6 w-32 animate-pulse rounded bg-white/30" />
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {[0, 1, 2, 3].map((item) => (
                    <SkeletonCard key={item} />
                ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="finova-card lg:col-span-2">
                    <div className="mb-6 space-y-2">
                        <Skeleton className="h-5 w-44" />
                        <SkeletonLine className="w-28" />
                    </div>
                    <ChartSkeleton />
                </div>

                <div className="finova-card">
                    <div className="mb-5 space-y-2">
                        <Skeleton className="h-5 w-40" />
                        <SkeletonLine className="w-24" />
                    </div>
                    <ChartSkeleton type="donut" />
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="finova-card lg:col-span-2">
                    <div className="mb-5 flex items-center justify-between">
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-40" />
                            <SkeletonLine className="w-32" />
                        </div>
                        <Skeleton className="h-8 w-20" />
                    </div>
                    <SkeletonList rows={6} />
                </div>

                <div className="space-y-6">
                    <div className="finova-card">
                        <div className="mb-5 flex items-center justify-between">
                            <Skeleton className="h-5 w-36" />
                            <SkeletonLine className="w-16" />
                        </div>
                        <div className="space-y-4">
                            {[0, 1, 2, 3].map((item) => (
                                <div key={item}>
                                    <div className="mb-2 flex items-center justify-between">
                                        <SkeletonLine className="w-28" />
                                        <SkeletonLine className="w-20" />
                                    </div>
                                    <Skeleton className="h-2 w-full" />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="finova-card">
                        <div className="mb-5 flex items-center justify-between">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-4 w-4 rounded" />
                        </div>
                        <SkeletonList rows={4} showAvatar />
                    </div>
                </div>
            </div>

            <div className="finova-card">
                <div className="mb-5 space-y-2">
                    <Skeleton className="h-5 w-28" />
                    <SkeletonLine className="w-44" />
                </div>
                <ChartSkeleton type="line" />
            </div>
        </div>
    );
}

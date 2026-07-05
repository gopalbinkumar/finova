import { useState } from 'react'
import { Plus, Pencil, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { ProgressBar, SectionHeader } from '@/components/ui/Cards'
import { mockBudgets } from '@/data/mockData'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { AddBudgetModal } from '@/components/modals/AddBudgetModal'

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

const totalBudget = mockBudgets.reduce((s, b) => s + b.limit, 0)
const totalSpent  = mockBudgets.reduce((s, b) => s + b.spent, 0)
const overBudget  = mockBudgets.filter(b => b.spent > b.limit)

export function BudgetPage() {
  const [period]          = useState('June 2024')
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <AddBudgetModal open={showModal} onClose={() => setShowModal(false)} />

      <div className="space-y-6 animate-in">
        {/* Summary */}
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="finova-card text-center">
            <p className="text-xs text-muted-foreground mb-1">Total Budget</p>
            <p className="text-2xl font-bold text-foreground">{fmt(totalBudget)}</p>
          </div>
          <div className="finova-card text-center">
            <p className="text-xs text-muted-foreground mb-1">Total Spent</p>
            <p className={`text-2xl font-bold ${totalSpent > totalBudget ? 'text-red-500' : 'text-foreground'}`}>
              {fmt(totalSpent)}
            </p>
          </div>
          <div className="finova-card text-center">
            <p className="text-xs text-muted-foreground mb-1">Remaining</p>
            <p className={`text-2xl font-bold ${totalBudget - totalSpent < 0 ? 'text-red-500' : 'text-primary-500'}`}>
              {fmt(Math.max(0, totalBudget - totalSpent))}
            </p>
          </div>
        </div>

        {/* Alerts */}
        {overBudget.length > 0 && (
          <div className="finova-card bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-semibold text-red-700 dark:text-red-400 text-sm">Budget Alert</p>
                <p className="text-red-600 dark:text-red-300 text-xs mt-0.5">
                  {overBudget.map(b => b.category).join(', ')}{' '}
                  {overBudget.length === 1 ? 'has' : 'have'} exceeded budget for {period}.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Budget list */}
          <div className="lg:col-span-2 finova-card">
            <div className="flex items-center justify-between mb-5">
              <SectionHeader title="Budget Overview" subtitle={period} />
              <button
                onClick={() => setShowModal(true)}
                className="btn-primary flex items-center gap-2 text-sm px-4 py-2"
              >
                <Plus size={16} />
                New Budget
              </button>
            </div>

            <div className="space-y-5">
              {mockBudgets.map(budget => {
                const pct    = (budget.spent / budget.limit) * 100
                const isOver = pct > 100
                const isWarn = pct > 80 && !isOver

                return (
                  <div key={budget.id} className="group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                          style={{ background: `${budget.color}20` }}
                        >
                          {budget.icon}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-sm">{budget.category}</p>
                          <p className="text-xs text-muted-foreground">
                            {fmt(budget.spent)} spent of {fmt(budget.limit)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isOver && (
                          <span className="text-red-500 text-xs font-semibold">
                            +{fmt(budget.spent - budget.limit)}
                          </span>
                        )}
                        {isOver ? (
                          <AlertCircle size={16} className="text-red-500" />
                        ) : pct === 100 ? (
                          <CheckCircle2 size={16} className="text-primary-500" />
                        ) : null}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground">
                            <Pencil size={12} />
                          </button>
                          <button className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-500">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>

                    <ProgressBar
                      value={budget.spent}
                      max={budget.limit}
                      color={budget.color}
                      showLabel={false}
                      height={10}
                    />
                    <div className="flex justify-between mt-1 text-xs">
                      <span className="text-muted-foreground">{pct.toFixed(0)}% used</span>
                      <span className={
                        isOver ? 'text-red-500 font-semibold'
                        : isWarn ? 'text-amber-500 font-semibold'
                        : 'text-muted-foreground'
                      }>
                        {isOver
                          ? `${fmt(budget.limit - budget.spent)} over`
                          : `${fmt(budget.limit - budget.spent)} left`}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

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
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={mockBudgets.map(b => ({ name: b.category, value: b.spent }))}
                    cx="50%" cy="50%"
                    innerRadius={50} outerRadius={75}
                    dataKey="value"
                    stroke="none"
                  >
                    {mockBudgets.map((b, i) => <Cell key={i} fill={b.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => fmt(Number(v))} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {mockBudgets.map(b => (
                  <div key={b.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: b.color }} />
                      <span className="text-muted-foreground">{b.category}</span>
                    </div>
                    <span className="font-semibold">{fmt(b.spent)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Health score */}
            <div className="finova-card">
              <SectionHeader title="Budget Health" />
              <div className="text-center py-4">
                <div className="relative inline-flex items-center justify-center">
                  <svg className="w-28 h-28 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="14" fill="none" className="stroke-muted" strokeWidth="3" />
                    <circle
                      cx="18" cy="18" r="14" fill="none" stroke="#08CB00" strokeWidth="3"
                      strokeDasharray={`${Math.max(0, 100 - (totalSpent / totalBudget) * 100) * 0.879} 100`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <p className="text-2xl font-bold text-primary-500">
                      {Math.max(0, Math.round((1 - totalSpent / totalBudget) * 100))}%
                    </p>
                    <p className="text-[9px] text-muted-foreground leading-tight">remaining</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-foreground mt-2">
                  {totalSpent > totalBudget
                    ? '🚨 Over Budget'
                    : totalSpent / totalBudget > 0.8
                    ? '⚠️ Almost there'
                    : '✅ On Track'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

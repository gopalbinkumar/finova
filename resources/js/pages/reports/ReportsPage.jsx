import { useState } from 'react';
import { Download, Calendar } from 'lucide-react';
import { SectionHeader } from '@/components/ui/Cards';
import { BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, } from 'recharts';
import { monthlyChartData, expenseCategoryData, summaryStats } from '@/data/mockData';
const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
const months = ['January', 'February', 'March', 'April', 'May', 'June'];
// Savings rate data
const savingsData = monthlyChartData.map(m => ({
    month: m.month,
    savings: m.income - m.expense,
    rate: Math.round(((m.income - m.expense) / m.income) * 100),
}));
// Yearly projections
const projectionData = [
    { month: 'Jul', projected: 12800 },
    { month: 'Aug', projected: 13200 },
    { month: 'Sep', projected: 12500 },
    { month: 'Oct', projected: 14100 },
    { month: 'Nov', projected: 13900 },
    { month: 'Dec', projected: 15000 },
];
export function ReportsPage() {
    const [period, setPeriod] = useState('June 2024');
    const netSavings = summaryStats.monthlyIncome - summaryStats.monthlyExpense;
    const savingsRate = Math.round((netSavings / summaryStats.monthlyIncome) * 100);
    return (<div className="space-y-6 animate-in">
      {/* Header controls */}
      <div className="finova-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-foreground">Financial Reports</h2>
          <p className="text-sm text-muted-foreground">Insights and analytics for {period}</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
            <select value={period} onChange={e => setPeriod(e.target.value)} className="finova-input pl-9 text-sm pr-4 py-2 appearance-none">
              {months.map(m => <option key={m} value={`${m} 2024`}>{m} 2024</option>)}
            </select>
          </div>
          <button className="btn-secondary flex items-center gap-2 text-sm px-4 py-2">
            <Download size={16}/>
            Export PDF
          </button>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 stagger">
        <div className="finova-card text-center animate-in">
          <p className="text-xs text-muted-foreground">Net Income</p>
          <p className="text-xl font-bold text-foreground mt-1">{fmt(summaryStats.monthlyIncome)}</p>
          <span className="text-xs text-primary-500 font-semibold">+20.4%</span>
        </div>
        <div className="finova-card text-center animate-in">
          <p className="text-xs text-muted-foreground">Total Expenses</p>
          <p className="text-xl font-bold text-foreground mt-1">{fmt(summaryStats.monthlyExpense)}</p>
          <span className="text-xs text-amber-500 font-semibold">+5.5%</span>
        </div>
        <div className="finova-card text-center animate-in">
          <p className="text-xs text-muted-foreground">Net Savings</p>
          <p className="text-xl font-bold text-primary-500 mt-1">{fmt(netSavings)}</p>
          <span className="text-xs text-primary-500 font-semibold">+35.2%</span>
        </div>
        <div className="finova-card text-center animate-in">
          <p className="text-xs text-muted-foreground">Savings Rate</p>
          <p className="text-xl font-bold text-foreground mt-1">{savingsRate}%</p>
          <span className="text-xs text-primary-500 font-semibold">+12pts</span>
        </div>
      </div>

      {/* Charts row 1 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Income vs Expense */}
        <div className="finova-card">
          <SectionHeader title="Income vs Expenses" subtitle="6-month comparison"/>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={monthlyChartData} barSize={18} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v / 1000}k`}/>
              <Tooltip formatter={(v) => fmt(v)}/>
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }}/>
              <Bar dataKey="income" name="Income" fill="#2563EB" radius={[4, 4, 0, 0]}/>
              <Bar dataKey="expense" name="Expense" fill="#EF4444" radius={[4, 4, 0, 0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Savings trend */}
        <div className="finova-card">
          <SectionHeader title="Monthly Savings" subtitle="Net savings per month"/>
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={savingsData}>
              <defs>
                <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v / 1000}k`}/>
              <Tooltip formatter={(v) => [fmt(v), 'Savings']}/>
              <Area type="monotone" dataKey="savings" stroke="#2563EB" strokeWidth={2.5} fill="url(#savingsGrad)"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Expense breakdown */}
        <div className="finova-card">
          <SectionHeader title="Spending by Category"/>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={expenseCategoryData} cx="50%" cy="50%" outerRadius={70} dataKey="value" stroke="none">
                {expenseCategoryData.map((e, i) => <Cell key={i} fill={e.color}/>)}
              </Pie>
              <Tooltip formatter={(v) => fmt(v)}/>
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {expenseCategoryData.slice(0, 5).map(d => (<div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: d.color }}/>
                  <span className="text-muted-foreground">{d.name}</span>
                </div>
                <span className="font-semibold">{fmt(d.value)}</span>
              </div>))}
          </div>
        </div>

        {/* Savings rate gauge + projection */}
        <div className="lg:col-span-2 finova-card">
          <SectionHeader title="Projected Savings" subtitle="Next 6 months estimate"/>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={projectionData}>
              <defs>
                <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v / 1000}k`}/>
              <Tooltip formatter={(v) => [fmt(v), 'Projected Balance']}/>
              <Area type="monotone" dataKey="projected" stroke="#8B5CF6" strokeWidth={2.5} fill="url(#projGrad)" strokeDasharray="6 3"/>
            </AreaChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border">
            {[
            { label: 'Avg Monthly Savings', value: fmt(savingsData.reduce((s, d) => s + d.savings, 0) / savingsData.length) },
            { label: 'Best Month', value: fmt(Math.max(...savingsData.map(d => d.savings))) },
            { label: 'Savings Rate', value: `${savingsRate}%` },
        ].map(s => (<div key={s.label} className="text-center">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-bold text-foreground mt-1">{s.value}</p>
              </div>))}
          </div>
        </div>
      </div>
    </div>);
}

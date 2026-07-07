import { useState } from 'react';
import { Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { SectionHeader } from '@/components/ui/Cards';
import { mockInvestments, investmentAllocationData } from '@/data/mockData';
import { AddInvestmentModal } from '@/components/modals/AddInvestmentModal';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, } from 'recharts';
const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
const fmtPct = (n) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
const portfolioHistory = [
    { date: 'Jan', value: 22000 },
    { date: 'Feb', value: 23500 },
    { date: 'Mar', value: 21800 },
    { date: 'Apr', value: 25200 },
    { date: 'May', value: 27400 },
    { date: 'Jun', value: 29913 },
];
const typeIcon = (type) => {
    if (type === 'crypto')
        return '₿';
    if (type === 'stock')
        return '📈';
    if (type === 'gold')
        return '🥇';
    if (type === 'mutual_fund')
        return '📊';
    return '💼';
};
export function InvestmentsPage() {
    const [showModal, setShowModal] = useState(false);
    const totalValue = mockInvestments.reduce((s, inv) => s + inv.qty * inv.currentPrice, 0);
    const totalCost = mockInvestments.reduce((s, inv) => s + inv.qty * inv.avgCost, 0);
    const totalGain = totalValue - totalCost;
    const totalPct = (totalGain / totalCost) * 100;
    return (<>
      <AddInvestmentModal open={showModal} onClose={() => setShowModal(false)}/>

      <div className="min-w-0 max-w-full space-y-4 sm:space-y-6 animate-in overflow-x-hidden">
        {/* Portfolio hero banner */}
        <div className="relative min-w-0 rounded-2xl overflow-hidden p-4 sm:p-6 text-white" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)' }}>
          <div className="relative z-10">
            <p className="text-white/60 text-sm mb-1">Total Portfolio Value</p>
            <p className="text-2xl min-[380px]:text-3xl sm:text-4xl font-bold mb-2 break-words">{fmt(totalValue)}</p>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              {totalGain >= 0 ? (<TrendingUp size={18} className="text-green-400"/>) : (<TrendingDown size={18} className="text-red-400"/>)}
              <span className={`font-semibold ${totalGain >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {totalGain >= 0 ? '+' : ''}{fmt(totalGain)} ({fmtPct(totalPct)})
              </span>
              <span className="w-full min-[420px]:w-auto text-white/50 text-sm">total return</span>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-1 min-[380px]:grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 stagger">
          {[
            { title: 'Invested', value: fmt(totalCost), color: '#3B82F6' },
            { title: 'Return', value: fmt(totalGain), color: totalGain >= 0 ? '#2563EB' : '#EF4444' },
            { title: 'Return %', value: fmtPct(totalPct), color: totalPct >= 0 ? '#2563EB' : '#EF4444' },
            { title: 'Assets', value: `${mockInvestments.length}`, color: '#8B5CF6' },
        ].map(s => (<div key={s.title} className="finova-card min-w-0 p-4 sm:p-6 text-center animate-in overflow-hidden">
              <p className="text-xs text-muted-foreground">{s.title}</p>
              <p className="text-base sm:text-xl font-bold mt-1 break-words tabular-nums" style={{ color: s.color }}>{s.value}</p>
            </div>))}
        </div>

        <div className="grid min-w-0 max-w-full lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Main column */}
          <div className="min-w-0 max-w-full lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Growth chart */}
            <div className="finova-card min-w-0 max-w-full p-4 sm:p-6 overflow-hidden">
              <SectionHeader title="Portfolio Growth" subtitle="6-month performance"/>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={portfolioHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v / 1000}k`}/>
                  <Tooltip formatter={(v) => [fmt(Number(v)), 'Portfolio']}/>
                  <Line type="monotone" dataKey="value" stroke="#6366F1" strokeWidth={3} dot={{ fill: '#6366F1', r: 4 }}/>
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Holdings table */}
            <div className="finova-card min-w-0 max-w-full p-4 sm:p-6 overflow-hidden">
              <div className="flex flex-col min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between gap-3 mb-5">
                <SectionHeader title="Holdings"/>
                <button onClick={() => setShowModal(true)} className="btn-primary self-start min-[420px]:self-auto flex items-center gap-2 text-sm px-4 py-2 whitespace-nowrap">
                  <Plus size={16}/>
                  Add Investment
                </button>
              </div>

              <div className="w-full max-w-full overflow-x-auto overscroll-x-contain">
                <table className="finova-table min-w-[760px]">
                  <thead>
                    <tr>
                      <th>Asset</th>
                      <th>Type</th>
                      <th>Qty</th>
                      <th>Avg Cost</th>
                      <th>Current Price</th>
                      <th>Market Value</th>
                      <th className="text-right">Gain / Loss</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockInvestments.map(inv => {
            const value = inv.qty * inv.currentPrice;
            const cost = inv.qty * inv.avgCost;
            const gain = value - cost;
            const pct = (gain / cost) * 100;
            return (<tr key={inv.id} className="cursor-pointer">
                          <td>
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{typeIcon(inv.type)}</span>
                              <div>
                                <p className="font-bold text-sm text-foreground">{inv.symbol}</p>
                                <p className="text-xs text-muted-foreground truncate max-w-[100px]">{inv.name}</p>
                              </div>
                            </div>
                          </td>
                          <td className="capitalize text-xs text-muted-foreground">{inv.type.replace('_', ' ')}</td>
                          <td className="text-sm text-foreground">{inv.qty}</td>
                          <td className="text-sm text-muted-foreground">{fmt(inv.avgCost)}</td>
                          <td className="text-sm font-medium text-foreground">{fmt(inv.currentPrice)}</td>
                          <td className="text-sm font-semibold text-foreground">{fmt(value)}</td>
                          <td className="text-right">
                            <div className={`flex items-center justify-end gap-1 text-sm font-bold ${gain >= 0 ? 'text-primary-500' : 'text-red-500'}`}>
                              {gain >= 0 ? <TrendingUp size={14}/> : <TrendingDown size={14}/>}
                              <span>{fmtPct(pct)}</span>
                            </div>
                            <p className={`text-xs text-right ${gain >= 0 ? 'text-primary-500' : 'text-red-500'}`}>
                              {gain >= 0 ? '+' : ''}{fmt(gain)}
                            </p>
                          </td>
                        </tr>);
        })}
                  </tbody>
                </table>
              </div>

              {/* Add row button */}
              <button onClick={() => setShowModal(true)} className="mt-4 w-full py-3 rounded-xl border-2 border-dashed border-border hover:border-indigo-400 text-muted-foreground hover:text-indigo-500 transition-all flex items-center justify-center gap-2 text-sm font-medium">
                <Plus size={16}/>
                Add New Investment
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="min-w-0 max-w-full space-y-4 sm:space-y-6">
            {/* Allocation donut */}
            <div className="finova-card min-w-0 max-w-full p-4 sm:p-6 overflow-hidden">
              <SectionHeader title="Allocation" subtitle="By asset class"/>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={investmentAllocationData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" stroke="none">
                    {investmentAllocationData.map((e, i) => <Cell key={i} fill={e.color}/>)}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(Number(v))}/>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {investmentAllocationData.map(d => (<div key={d.name} className="flex min-w-0 items-center justify-between gap-3 text-xs">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }}/>
                      <span className="truncate text-muted-foreground">{d.name}</span>
                    </div>
                    <span className="shrink-0 text-right font-semibold text-foreground tabular-nums">{fmt(d.value)}</span>
                  </div>))}
              </div>
            </div>

            {/* Top performers */}
            <div className="finova-card min-w-0 max-w-full p-4 sm:p-6 overflow-hidden">
              <SectionHeader title="Top Performers"/>
              <div className="space-y-3">
                {[...mockInvestments]
            .sort((a, b) => (b.currentPrice - b.avgCost) / b.avgCost -
            (a.currentPrice - a.avgCost) / a.avgCost)
            .slice(0, 4)
            .map(inv => {
            const pct = ((inv.currentPrice - inv.avgCost) / inv.avgCost) * 100;
            return (<div key={inv.id} className="flex min-w-0 items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="text-lg">{typeIcon(inv.type)}</span>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-foreground">{inv.symbol}</p>
                            <p className="text-xs text-muted-foreground">{inv.qty} units</p>
                          </div>
                        </div>
                        <span className={`shrink-0 text-sm font-bold ${pct >= 0 ? 'text-primary-500' : 'text-red-500'}`}>
                          {fmtPct(pct)}
                        </span>
                      </div>);
        })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>);
}

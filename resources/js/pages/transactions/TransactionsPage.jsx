import { useState } from 'react';
import { Search, Plus, Filter, Download, ArrowUpRight, ArrowDownRight, ArrowLeftRight, } from 'lucide-react';
import { Badge } from '@/components/ui/Cards';
import { mockTransactions } from '@/data/mockData';
import { AddTransactionModal } from '@/components/modals/AddTransactionModal';
const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
const totalIncome = mockTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
const totalExpense = mockTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
export function TransactionsPage() {
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [defaultTxType, setDefaultTxType] = useState('expense');
    const perPage = 10;
    const filtered = mockTransactions.filter(t => {
        const matchSearch = t.description.toLowerCase().includes(search.toLowerCase()) ||
            t.category.toLowerCase().includes(search.toLowerCase());
        const matchType = typeFilter === 'all' || t.type === typeFilter;
        return matchSearch && matchType;
    });
    const paginated = filtered.slice((page - 1) * perPage, page * perPage);
    const totalPages = Math.ceil(filtered.length / perPage);
    const openModal = (type = 'expense') => {
        setDefaultTxType(type);
        setShowModal(true);
    };
    const txTypeIcon = (type) => {
        if (type === 'income')
            return <ArrowUpRight size={15}/>;
        if (type === 'transfer')
            return <ArrowLeftRight size={15}/>;
        return <ArrowDownRight size={15}/>;
    };
    const txBadge = (type) => {
        if (type === 'income')
            return <Badge variant="success">Income</Badge>;
        if (type === 'transfer')
            return <Badge variant="info">Transfer</Badge>;
        return <Badge variant="danger">Expense</Badge>;
    };
    return (<>
      <AddTransactionModal open={showModal} onClose={() => setShowModal(false)} defaultType={defaultTxType}/>

      <div className="space-y-6 animate-in">
        {/* Summary row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Income', value: totalIncome, color: 'text-primary-500', bg: 'bg-primary-50 dark:bg-primary-900/20' },
            { label: 'Total Expenses', value: totalExpense, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
            { label: 'Net Cash Flow', value: totalIncome - totalExpense,
                color: totalIncome - totalExpense >= 0 ? 'text-primary-500' : 'text-red-500', bg: 'bg-muted' },
        ].map(s => (<div key={s.label} className={`finova-card text-center ${s.bg}`}>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-xl font-bold mt-1 ${s.color}`}>{fmt(s.value)}</p>
            </div>))}
        </div>

        {/* Filters + Table */}
        <div className="finova-card">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
              <input type="text" placeholder="Search transactions..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="finova-input pl-9 text-sm"/>
            </div>

            <div className="flex gap-2 flex-wrap">
              {['all', 'income', 'expense', 'transfer'].map(t => (<button key={t} onClick={() => { setTypeFilter(t); setPage(1); }} className={`text-xs font-semibold px-3 py-2 rounded-lg border transition-all capitalize ${typeFilter === t
                ? 'bg-primary-500 text-white border-primary-500'
                : 'border-border text-muted-foreground hover:text-foreground'}`}>
                  {t}
                </button>))}
              <button className="btn-secondary flex items-center gap-2 text-sm px-3 py-2">
                <Filter size={14}/>
                Filter
              </button>
              <button className="btn-secondary flex items-center gap-2 text-sm px-3 py-2">
                <Download size={14}/>
                Export
              </button>

              {/* Quick add buttons */}
              <button onClick={() => openModal('income')} className="text-xs font-semibold px-3 py-2 rounded-lg border border-primary-500/50 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all">
                + Income
              </button>
              <button onClick={() => openModal('expense')} className="text-xs font-semibold px-3 py-2 rounded-lg border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                + Expense
              </button>
              <button onClick={() => openModal('expense')} className="btn-primary flex items-center gap-2 text-sm px-3 py-2">
                <Plus size={14}/>
                Add
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="finova-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Account</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(tx => (<tr key={tx.id} className="cursor-pointer">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${tx.type === 'income' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-500' :
                tx.type === 'transfer' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-500' :
                    'bg-red-50 dark:bg-red-900/20 text-red-500'}`}>
                          {txTypeIcon(tx.type)}
                        </div>
                        <span className="font-medium text-foreground max-w-[160px] truncate text-sm">
                          {tx.description}
                        </span>
                      </div>
                    </td>
                    <td className="text-muted-foreground text-sm">{tx.category}</td>
                    <td className="text-muted-foreground text-sm">{tx.account}</td>
                    <td className="text-muted-foreground text-sm whitespace-nowrap">{tx.date}</td>
                    <td>{txBadge(tx.type)}</td>
                    <td className="text-right">
                      <span className={`font-bold text-sm ${tx.type === 'income' ? 'text-primary-500' :
                tx.type === 'transfer' ? 'text-blue-500' : 'text-red-500'}`}>
                        {tx.type === 'income' ? '+' : tx.type === 'transfer' ? '±' : '-'}
                        {fmt(tx.amount)}
                      </span>
                    </td>
                  </tr>))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (<div className="flex items-center justify-between mt-5 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length}
              </p>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary text-sm px-3 py-1.5 disabled:opacity-50">
                  Prev
                </button>
                <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="btn-secondary text-sm px-3 py-1.5 disabled:opacity-50">
                  Next
                </button>
              </div>
            </div>)}
        </div>
      </div>
    </>);
}

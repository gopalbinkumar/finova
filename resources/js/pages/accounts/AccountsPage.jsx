import { useState } from 'react';
import { Plus, Eye, EyeOff, Wallet, CreditCard, Smartphone, PiggyBank, TrendingUp, MoreVertical } from 'lucide-react';
import { SectionHeader, StatCard, Badge } from '@/components/ui/Cards';
import { mockAccounts, totalBalance } from '@/data/mockData';
import { AddAccountModal } from '@/components/modals/AddAccountModal';
const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
const accountTypeIcons = {
    bank: <Wallet size={18}/>,
    credit_card: <CreditCard size={18}/>,
    e_wallet: <Smartphone size={18}/>,
    cash: <PiggyBank size={18}/>,
    investment: <TrendingUp size={18}/>,
};
const accountTypeLabels = {
    bank: 'Bank', credit_card: 'Credit Card', e_wallet: 'E-Wallet', cash: 'Cash', investment: 'Investment',
};
export function AccountsPage() {
    const [hideBalance, setHideBalance] = useState(false);
    const [activeType, setActiveType] = useState('all');
    const [showAddModal, setShowAddModal] = useState(false);
    const types = ['all', ...Array.from(new Set(mockAccounts.map(a => a.type)))];
    const filtered = activeType === 'all' ? mockAccounts : mockAccounts.filter(a => a.type === activeType);
    const totalAssets = mockAccounts.filter(a => a.balance > 0).reduce((s, a) => s + a.balance, 0);
    const totalLiabilities = Math.abs(mockAccounts.filter(a => a.balance < 0).reduce((s, a) => s + a.balance, 0));
    return (<>
    <AddAccountModal open={showAddModal} onClose={() => setShowAddModal(false)}/>
    <div className="space-y-6 animate-in">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger">
        <StatCard title="Net Balance" value={hideBalance ? '••••••' : fmt(totalBalance)} icon={<Wallet size={20}/>} accentColor="#2563EB" className="animate-in"/>
        <StatCard title="Total Assets" value={hideBalance ? '••••••' : fmt(totalAssets)} icon={<TrendingUp size={20}/>} accentColor="#3B82F6" className="animate-in"/>
        <StatCard title="Total Liabilities" value={hideBalance ? '••••••' : fmt(totalLiabilities)} icon={<CreditCard size={20}/>} accentColor="#EF4444" className="animate-in"/>
      </div>

      {/* Account list */}
      <div className="finova-card">
        <div className="flex items-center justify-between mb-5">
          <SectionHeader title="My Accounts" subtitle={`${mockAccounts.length} accounts connected`}/>
          <div className="flex items-center gap-2">
            <button onClick={() => setHideBalance(v => !v)} className="btn-ghost p-2 rounded-lg" title="Toggle visibility">
              {hideBalance ? <EyeOff size={18} className="text-muted-foreground"/> : <Eye size={18} className="text-muted-foreground"/>}
            </button>
            <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2 text-sm px-4 py-2">
              <Plus size={16}/>
              Add Account
            </button>
          </div>
        </div>

        {/* Type filter tabs */}
        <div className="flex gap-2 flex-wrap mb-5">
          {types.map((t) => (<button key={t} onClick={() => setActiveType(t)} className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${activeType === t
                ? 'bg-primary-500 text-white border-primary-500'
                : 'border-border text-muted-foreground hover:text-foreground hover:border-primary-500'}`}>
              {t === 'all' ? 'All' : accountTypeLabels[t]}
            </button>))}
        </div>

        {/* Account cards grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((account) => (<div key={account.id} className="relative rounded-xl border border-border p-5 hover:border-primary-500/30 hover:shadow-md transition-all cursor-pointer group overflow-hidden">
              {/* Gradient top strip */}
              <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl" style={{ background: account.color }}/>

              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${account.color}20`, color: account.color }}>
                    {accountTypeIcons[account.type] ?? <Wallet size={18}/>}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm leading-tight">{account.name}</p>
                    <p className="text-xs text-muted-foreground">{accountTypeLabels[account.type]}</p>
                  </div>
                </div>
                <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted text-muted-foreground">
                  <MoreVertical size={16}/>
                </button>
              </div>

              {/* Balance */}
              <div className="mb-2">
                <p className="text-xs text-muted-foreground mb-1">Current Balance</p>
                <p className={`text-xl font-bold ${account.balance < 0 ? 'text-red-500' : 'text-foreground'}`}>
                  {hideBalance ? '••••••' : fmt(account.balance)}
                </p>
              </div>

              <Badge variant={account.balance < 0 ? 'danger' : 'success'}>
                {account.balance < 0 ? 'Liability' : 'Asset'}
              </Badge>
            </div>))}

          {/* Add account card */}
          <button onClick={() => setShowAddModal(true)} className="rounded-xl border-2 border-dashed border-border hover:border-primary-500 p-5 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary-500 transition-all min-h-[140px] group">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 transition-colors">
              <Plus size={20}/>
            </div>
            <span className="text-sm font-medium">Add New Account</span>
          </button>
        </div>
      </div>
    </div>
    </>);
}

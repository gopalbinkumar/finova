import { useState } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { SectionHeader, Badge } from '@/components/ui/Cards';
import { mockCategories } from '@/data/mockData';
import { AddCategoryModal } from '@/components/modals/AddCategoryModal';
export function CategoriesPage() {
    const [search, setSearch] = useState('');
    const [tab, setTab] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [defaultType, setDefaultType] = useState('expense');
    const filtered = mockCategories.filter(c => {
        const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
        const matchTab = tab === 'all' || c.type === tab;
        return matchSearch && matchTab;
    });
    const openModal = (type = 'expense') => {
        setDefaultType(type);
        setShowModal(true);
    };
    const income = mockCategories.filter(c => c.type === 'income');
    const expense = mockCategories.filter(c => c.type === 'expense');
    return (<>
      <AddCategoryModal open={showModal} onClose={() => setShowModal(false)} defaultType={defaultType}/>

      <div className="space-y-6 animate-in">
        {/* Header */}
        <div className="finova-card flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <h2 className="text-base font-bold text-foreground">Category Management</h2>
            <p className="text-sm text-muted-foreground">
              {income.length} income · {expense.length} expense categories
            </p>
          </div>
          <button onClick={() => openModal('expense')} className="btn-primary flex items-center gap-2 text-sm px-4 py-2 flex-shrink-0">
            <Plus size={16}/>
            New Category
          </button>
        </div>

        {/* Filters */}
        <div className="finova-card">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
              <input type="text" placeholder="Search categories..." value={search} onChange={e => setSearch(e.target.value)} className="finova-input pl-9 text-sm"/>
            </div>
            {/* Tabs */}
            <div className="flex rounded-lg border border-border overflow-hidden">
              {['all', 'income', 'expense'].map(t => (<button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium transition-colors capitalize ${tab === t
                ? 'bg-primary-500 text-white'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}>
                  {t}
                </button>))}
            </div>
          </div>

          <SectionHeader title={`${filtered.length} Categories`} subtitle="Click icon to edit"/>

          {/* Category grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map(cat => (<div key={cat.id} className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-primary-500/30 hover:shadow-md transition-all group cursor-pointer">
                {/* Icon */}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 transition-transform group-hover:scale-110" style={{ background: `${cat.color}20` }}>
                  {cat.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm truncate">{cat.name}</p>
                  <Badge variant={cat.type === 'income' ? 'success' : 'danger'}>
                    {cat.type}
                  </Badge>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                    <Pencil size={14}/>
                  </button>
                  <button className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-500 transition-colors">
                    <Trash2 size={14}/>
                  </button>
                </div>
              </div>))}

            {/* Add income category */}
            <button onClick={() => openModal('income')} className="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-primary-500/30 hover:border-primary-500 text-primary-500/60 hover:text-primary-500 transition-all group min-h-[72px]">
              <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
                <Plus size={18}/>
              </div>
              <span className="text-sm font-medium">Add Income Category</span>
            </button>

            {/* Add expense category */}
            <button onClick={() => openModal('expense')} className="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-red-200 dark:border-red-900/40 hover:border-red-400 text-red-400/60 hover:text-red-500 transition-all group min-h-[72px]">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                <Plus size={18}/>
              </div>
              <span className="text-sm font-medium">Add Expense Category</span>
            </button>
          </div>
        </div>
      </div>
    </>);
}

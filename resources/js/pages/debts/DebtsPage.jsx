import { useState } from 'react';
import { Plus, CheckCircle2, Clock, Pencil, Trash2 } from 'lucide-react';
import { SectionHeader, ProgressBar } from '@/components/ui/Cards';
import { ConfirmDeleteModal, EditRecordModal } from '@/components/ui/RecordActions';
import { mockDebts } from '@/data/mockData';
import { AddDebtModal } from '@/components/modals/AddDebtModal';
const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const debtFields = [
    { key: 'borrower', label: 'Name', required: true, placeholder: 'Lender or borrower' },
    { key: 'type', label: 'Record Type', type: 'select', options: [{ value: 'debt', label: 'Money I Owe' }, { value: 'receivable', label: 'Money Owed to Me' }] },
    { key: 'amount', label: 'Original Amount', type: 'number', leftDecor: '$', min: '0', step: '0.01' },
    { key: 'remaining', label: 'Remaining Amount', type: 'number', leftDecor: '$', min: '0', step: '0.01' },
    { key: 'dueDate', label: 'Due Date', type: 'date' },
    { key: 'notes', label: 'Notes', type: 'textarea', fullWidth: true, placeholder: 'Record notes' },
];
export function DebtsPage() {
    const [records, setRecords] = useState(mockDebts);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('debt');
    const [editing, setEditing] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const debts = records.filter(d => d.type === 'debt' && !d.isPaid);
    const receivables = records.filter(d => d.type === 'receivable' && !d.isPaid);
    const paid = records.filter(d => d.isPaid);
    const totalDebt = debts.reduce((s, d) => s + d.remaining, 0);
    const totalReceiv = receivables.reduce((s, d) => s + d.remaining, 0);
    const openModal = (type) => {
        setModalType(type);
        setShowModal(true);
    };
    return (<>
      <AddDebtModal open={showModal} onClose={() => setShowModal(false)} defaultType={modalType}/>
      <EditRecordModal open={!!editing} onClose={() => setEditing(null)} title="Edit Debt Record" subtitle="Update this dummy debt or receivable" record={editing} fields={debtFields} iconColor={editing?.type === 'debt' ? '#EF4444' : '#2563EB'} onSave={(next) => setRecords(items => items.map(item => item.id === next.id ? next : item))}/>
      <ConfirmDeleteModal open={!!deleting} onClose={() => setDeleting(null)} itemName={deleting?.borrower} itemType="record" onConfirm={() => setRecords(items => items.filter(item => item.id !== deleting?.id))}/>

      <div className="space-y-6 animate-in">
        {/* Summary */}
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="finova-card text-center">
            <p className="text-xs text-muted-foreground">Total Owed</p>
            <p className="text-2xl font-bold text-red-500 mt-1">{fmt(totalDebt)}</p>
          </div>
          <div className="finova-card text-center">
            <p className="text-xs text-muted-foreground">To Receive</p>
            <p className="text-2xl font-bold text-primary-500 mt-1">{fmt(totalReceiv)}</p>
          </div>
          <div className="finova-card text-center">
            <p className="text-xs text-muted-foreground">Net Debt</p>
            <p className={`text-2xl font-bold mt-1 ${totalDebt - totalReceiv > 0 ? 'text-red-500' : 'text-primary-500'}`}>
              {fmt(totalDebt - totalReceiv)}
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Debts I owe */}
          <div className="finova-card">
            <div className="flex items-center justify-between mb-5">
              <SectionHeader title="💸 Money I Owe" subtitle={`${debts.length} active debts`}/>
              <button onClick={() => openModal('debt')} className="btn-primary flex items-center gap-2 text-sm px-4 py-2">
                <Plus size={16}/>
                Add Debt
              </button>
            </div>

            <div className="space-y-4">
              {debts.map(debt => {
            const paidAmount = debt.amount - debt.remaining;
            const days = Math.ceil((new Date(debt.dueDate).getTime() - Date.now()) / 86_400_000);
            return (<div key={debt.id} className="p-4 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/30 dark:bg-red-900/5 group">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-bold text-foreground">{debt.borrower}</p>
                        <p className="text-xs text-muted-foreground">{debt.notes}</p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setEditing(debt)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground" aria-label={`Edit ${debt.borrower}`}>
                          <Pencil size={12}/>
                        </button>
                        <button onClick={() => setDeleting(debt)} className="p-1.5 rounded hover:bg-red-100 text-muted-foreground hover:text-red-500" aria-label={`Delete ${debt.borrower}`}>
                          <Trash2 size={12}/>
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-baseline mb-2">
                      <span className="text-lg font-bold text-red-500">{fmt(debt.remaining)}</span>
                      <span className="text-sm text-muted-foreground">of {fmt(debt.amount)}</span>
                    </div>

                    <ProgressBar value={paidAmount} max={debt.amount} color="#EF4444" showLabel={false} height={6}/>

                    <div className="flex items-center justify-between mt-2 text-xs">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock size={11}/>
                        <span>Due {fmtDate(debt.dueDate)}</span>
                      </div>
                      <span className={`font-semibold ${days < 14 ? 'text-red-500' : days < 60 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                        {days > 0 ? `${days}d left` : 'Overdue!'}
                      </span>
                    </div>
                  </div>);
        })}
            </div>

            {/* Add debt dashed row */}
            <button onClick={() => openModal('debt')} className="mt-4 w-full py-3 rounded-xl border-2 border-dashed border-red-200 dark:border-red-900/40 hover:border-red-400 text-red-400 hover:text-red-500 transition-all flex items-center justify-center gap-2 text-sm font-medium">
              <Plus size={16}/>
              Record Another Debt
            </button>
          </div>

          {/* Receivables */}
          <div className="finova-card">
            <div className="flex items-center justify-between mb-5">
              <SectionHeader title="💰 Money Owed to Me" subtitle={`${receivables.length} active`}/>
              <button onClick={() => openModal('receivable')} className="btn-primary flex items-center gap-2 text-sm px-4 py-2">
                <Plus size={16}/>
                Add Record
              </button>
            </div>

            <div className="space-y-4">
              {receivables.map(r => {
            const days = Math.ceil((new Date(r.dueDate).getTime() - Date.now()) / 86_400_000);
            return (<div key={r.id} className="p-4 rounded-xl border border-primary-200 dark:border-primary-900/50 bg-primary-50/30 dark:bg-primary-900/5 group">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-bold text-foreground">{r.borrower}</p>
                        <p className="text-xs text-muted-foreground">{r.notes}</p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setRecords(items => items.map(item => item.id === r.id ? { ...item, isPaid: true, remaining: 0 } : item))} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground" aria-label={`Mark ${r.borrower} as settled`}>
                          <CheckCircle2 size={12}/>
                        </button>
                        <button onClick={() => setEditing(r)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground" aria-label={`Edit ${r.borrower}`}>
                          <Pencil size={12}/>
                        </button>
                        <button onClick={() => setDeleting(r)} className="p-1.5 rounded hover:bg-red-100 text-muted-foreground hover:text-red-500" aria-label={`Delete ${r.borrower}`}>
                          <Trash2 size={12}/>
                        </button>
                      </div>
                    </div>

                    <p className="text-2xl font-bold text-primary-500 mb-3">{fmt(r.remaining)}</p>

                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock size={11}/>
                        <span>Expected by {fmtDate(r.dueDate)}</span>
                      </div>
                      <span className={`font-semibold ${days < 14 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                        {days > 0 ? `${days}d` : 'Overdue'}
                      </span>
                    </div>
                  </div>);
        })}
            </div>

            {/* Add receivable dashed row */}
            <button onClick={() => openModal('receivable')} className="mt-4 w-full py-3 rounded-xl border-2 border-dashed border-primary-500/30 hover:border-primary-500 text-primary-500/60 hover:text-primary-500 transition-all flex items-center justify-center gap-2 text-sm font-medium">
              <Plus size={16}/>
              Record Receivable
            </button>

            {/* Settled */}
            {paid.length > 0 && (<div className="mt-6 pt-4 border-t border-border">
                <SectionHeader title="✅ Settled"/>
                <div className="space-y-2">
                  {paid.map(p => (<div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="text-sm font-semibold text-foreground opacity-60">{p.borrower}</p>
                        <p className="text-xs text-muted-foreground">{p.notes}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{fmt(p.amount)}</span>
                        <CheckCircle2 size={16} className="text-primary-500"/>
                      </div>
                    </div>))}
                </div>
              </div>)}
          </div>
        </div>
      </div>
    </>);
}

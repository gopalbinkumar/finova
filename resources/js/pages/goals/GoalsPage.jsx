import { useState } from 'react';
import { Plus, CheckCircle2, Clock, Pencil, Trash2, Zap } from 'lucide-react';
import { ProgressBar, SectionHeader } from '@/components/ui/Cards';
import { ConfirmDeleteModal, EditRecordModal } from '@/components/ui/RecordActions';
import { mockGoals } from '@/data/mockData';
import { AddGoalModal } from '@/components/modals/AddGoalModal';
const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const daysLeft = (deadline) => {
    const diff = new Date(deadline).getTime() - Date.now();
    return Math.ceil(diff / 86_400_000);
};
const goalFields = [
    { key: 'name', label: 'Goal Name', required: true, placeholder: 'Goal name' },
    { key: 'deadline', label: 'Target Date', type: 'date' },
    { key: 'target', label: 'Target Amount', type: 'number', leftDecor: '$', min: '0', step: '100' },
    { key: 'current', label: 'Already Saved', type: 'number', leftDecor: '$', min: '0', step: '100' },
    { key: 'icon', label: 'Icon', placeholder: 'Emoji' },
    { key: 'color', label: 'Goal Color', type: 'color' },
    { key: 'notes', label: 'Notes', type: 'textarea', fullWidth: true, placeholder: 'Goal notes' },
];
export function GoalsPage() {
    const [goals, setGoals] = useState(mockGoals);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const completed = goals.filter(g => g.current >= g.target);
    const active = goals.filter(g => g.current < g.target);
    const totalSaved = goals.reduce((s, g) => s + g.current, 0);
    const totalTarget = goals.reduce((s, g) => s + g.target, 0);
    return (<>
      <AddGoalModal open={showModal} onClose={() => setShowModal(false)}/>
      <EditRecordModal open={!!editing} onClose={() => setEditing(null)} title="Edit Goal" subtitle="Update progress for this dummy goal" record={editing} fields={goalFields} iconColor={editing?.color} onSave={(next) => setGoals(items => items.map(item => item.id === next.id ? next : item))}/>
      <ConfirmDeleteModal open={!!deleting} onClose={() => setDeleting(null)} itemName={deleting?.name} itemType="goal" onConfirm={() => setGoals(items => items.filter(item => item.id !== deleting?.id))}/>

      <div className="space-y-6 animate-in">
        {/* Summary banner */}
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="finova-card text-center">
            <p className="text-xs text-muted-foreground">Total Saved</p>
            <p className="text-2xl font-bold text-primary-500 mt-1">{fmt(totalSaved)}</p>
          </div>
          <div className="finova-card text-center">
            <p className="text-xs text-muted-foreground">Total Target</p>
            <p className="text-2xl font-bold text-foreground mt-1">{fmt(totalTarget)}</p>
          </div>
          <div className="finova-card text-center">
            <p className="text-xs text-muted-foreground">Goals Completed</p>
            <p className="text-2xl font-bold text-foreground mt-1">{completed.length} / {goals.length}</p>
          </div>
        </div>

        {/* Add Goal button */}
        <div className="flex justify-end">
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16}/>
            New Goal
          </button>
        </div>

        {/* Completed Goals */}
        {completed.length > 0 && (<div>
            <SectionHeader title={`🎉 Completed (${completed.length})`}/>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {completed.map(g => (<div key={g.id} className="finova-card border-primary-500/30 bg-primary-50/30 dark:bg-primary-900/10 relative overflow-hidden">
                  <div className="absolute top-3 right-3">
                    <CheckCircle2 className="text-primary-500" size={20}/>
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background: `${g.color}20` }}>
                      {g.icon}
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{g.name}</p>
                      <p className="text-xs text-muted-foreground">{g.notes}</p>
                    </div>
                  </div>
                  <p className="text-xl font-bold text-primary-500">{fmt(g.target)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Completed ✅</p>
                  <div className="mt-3 h-2 rounded-full bg-primary-500"/>
                </div>))}
            </div>
          </div>)}

        {/* Active Goals */}
        <div>
          <SectionHeader title={`🎯 Active Goals (${active.length})`}/>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {active.map(g => {
            const pct = Math.round((g.current / g.target) * 100);
            const days = daysLeft(g.deadline);
            const remaining = g.target - g.current;
            return (<div key={g.id} className="finova-card group relative hover:shadow-lg transition-all">
                  {/* Hover actions */}
                  <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditing(g)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground" aria-label={`Edit ${g.name}`}>
                      <Pencil size={14}/>
                    </button>
                    <button onClick={() => setDeleting(g)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-500" aria-label={`Delete ${g.name}`}>
                      <Trash2 size={14}/>
                    </button>
                  </div>

                  {/* Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: `${g.color}20` }}>
                      {g.icon}
                    </div>
                    <div>
                      <p className="font-bold text-foreground leading-tight">{g.name}</p>
                      <p className="text-xs text-muted-foreground">{g.notes}</p>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mb-3">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-xl font-bold text-foreground">{fmt(g.current)}</span>
                      <span className="text-sm text-muted-foreground">/ {fmt(g.target)}</span>
                    </div>
                    <ProgressBar value={g.current} max={g.target} color={g.color} showLabel={false} height={8}/>
                    <div className="flex justify-between mt-1 text-xs">
                      <span className="font-semibold" style={{ color: g.color }}>{pct}% saved</span>
                      <span className="text-muted-foreground">{fmt(remaining)} to go</span>
                    </div>
                  </div>

                  {/* Deadline */}
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock size={12}/>
                      <span>Due {fmtDate(g.deadline)}</span>
                    </div>
                    <span className={`text-xs font-semibold flex items-center gap-1 ${days < 30 ? 'text-red-500' : days < 90 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                      <Zap size={10}/>
                      {days > 0 ? `${days}d left` : 'Overdue'}
                    </span>
                  </div>

                  {/* Add Funds */}
                  <button className="w-full mt-3 py-2 rounded-lg text-xs font-semibold transition-all border" style={{ borderColor: `${g.color}50`, color: g.color }} onMouseEnter={e => (e.currentTarget.style.background = `${g.color}15`)} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    + Add Funds
                  </button>
                </div>);
        })}

            {/* New goal card */}
            <button onClick={() => setShowModal(true)} className="finova-card border-2 border-dashed border-border hover:border-primary-500 flex flex-col items-center justify-center gap-3 min-h-[220px] text-muted-foreground hover:text-primary-500 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 transition-colors">
                <Plus size={24}/>
              </div>
              <span className="text-sm font-semibold">Create New Goal</span>
            </button>
          </div>
        </div>
      </div>
    </>);
}

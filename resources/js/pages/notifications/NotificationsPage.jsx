import { useState } from 'react';
import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/Cards';
import { mockNotifications } from '@/data/mockData';
const fmtTime = (iso) => {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60)
        return 'Just now';
    if (diff < 3600)
        return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400)
        return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
};
const typeBadge = (type) => {
    const map = {
        budget_alert: 'warning',
        goal_achieved: 'success',
        debt_due: 'danger',
        large_expense: 'info',
    };
    return <Badge variant={map[type] ?? 'neutral'}>{type.replace('_', ' ')}</Badge>;
};
export function NotificationsPage() {
    const [notifications, setNotifications] = useState(mockNotifications);
    const [filter, setFilter] = useState('all');
    const unread = notifications.filter(n => !n.read).length;
    const visible = filter === 'unread' ? notifications.filter(n => !n.read) : notifications;
    const markRead = (id) => setNotifications(ns => ns.map(n => n.id === id ? { ...n, read: true } : n));
    const markAll = () => setNotifications(ns => ns.map(n => ({ ...n, read: true })));
    const dismiss = (id) => setNotifications(ns => ns.filter(n => n.id !== id));
    return (<div className="space-y-6 animate-in max-w-2xl mx-auto">
      {/* Header */}
      <div className="finova-card flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <Bell size={20} className="text-white"/>
          </div>
          <div>
            <h2 className="font-bold text-foreground">Notifications</h2>
            <p className="text-sm text-muted-foreground">{unread} unread alerts</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            {['all', 'unread'].map(f => (<button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${filter === f ? 'bg-primary-500 text-white' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}>
                {f}
              </button>))}
          </div>

          {unread > 0 && (<button onClick={markAll} className="btn-secondary text-sm px-3 py-1.5 flex items-center gap-1.5">
              <CheckCheck size={14}/>
              Mark all read
            </button>)}
        </div>
      </div>

      {/* Notification list */}
      <div className="finova-card !p-0 overflow-hidden">
        {visible.length === 0 ? (<div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-3xl mb-4">🔕</div>
            <p className="font-semibold text-foreground">All caught up!</p>
            <p className="text-sm text-muted-foreground mt-1">No {filter === 'unread' ? 'unread ' : ''}notifications.</p>
          </div>) : (<div>
            {visible.map((notif) => (<div key={notif.id} className={`flex items-start gap-4 p-5 border-b border-border last:border-0 group transition-colors cursor-pointer hover:bg-muted/30
                  ${!notif.read ? 'bg-primary-50/30 dark:bg-primary-900/5' : ''}`} onClick={() => markRead(notif.id)}>
                {/* Icon */}
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-xl flex-shrink-0">
                  {notif.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm leading-snug ${!notif.read ? 'font-bold text-foreground' : 'font-semibold text-foreground/80'}`}>
                      {notif.title}
                    </p>
                    {!notif.read && (<span className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-1.5"/>)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{notif.body}</p>
                  <div className="flex items-center justify-between mt-2">
                    {typeBadge(notif.type)}
                    <span className="text-xs text-muted-foreground">{fmtTime(notif.createdAt)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  {!notif.read && (<button onClick={e => { e.stopPropagation(); markRead(notif.id); }} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Mark read">
                      <Check size={14}/>
                    </button>)}
                  <button onClick={e => { e.stopPropagation(); dismiss(notif.id); }} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-500 transition-colors" title="Dismiss">
                    <Trash2 size={14}/>
                  </button>
                </div>
              </div>))}
          </div>)}
      </div>

      {/* Notification settings hint */}
      <div className="finova-card bg-muted/30 border-dashed text-center py-4">
        <p className="text-sm text-muted-foreground">
          Configure notification preferences in{' '}
          <a href="/profile" className="text-primary-500 hover:underline font-medium">Profile Settings</a>
        </p>
      </div>
    </div>);
}

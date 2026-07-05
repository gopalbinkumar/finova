import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar, MobileSidebar, Topbar, MobileBottomNav } from '@/components/layout/Navigation'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { AddTransactionModal } from '@/components/modals/AddTransactionModal'
import { Plus, ArrowLeftRight, TrendingUp, TrendingDown } from 'lucide-react'

const pageTitles: Record<string, string> = {
  '/dashboard':     'Dashboard',
  '/accounts':      'Accounts',
  '/categories':    'Categories',
  '/transactions':  'Transactions',
  '/budget':        'Budget',
  '/goals':         'Financial Goals',
  '/investments':   'Investments',
  '/debts':         'Debts & Receivables',
  '/reports':       'Reports',
  '/notifications': 'Notifications',
  '/profile':       'Profile & Settings',
}

export function AppLayout() {
  const [collapsed, setCollapsed]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [fabOpen, setFabOpen]       = useState(false)
  const [txModal, setTxModal]       = useState(false)
  const [txType, setTxType]         = useState<'income' | 'expense' | 'transfer'>('expense')

  const { pathname } = useLocation()
  const title = pageTitles[pathname] ?? 'Finova'

  const openTx = (type: 'income' | 'expense' | 'transfer') => {
    setTxType(type)
    setFabOpen(false)
    setTxModal(true)
  }

  return (
    <>
      {/* Global quick-add transaction modal */}
      <AddTransactionModal
        open={txModal}
        onClose={() => setTxModal(false)}
        defaultType={txType}
      />

      <div className="flex h-screen overflow-hidden bg-background">
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex flex-shrink-0">
          <Sidebar collapsed={collapsed} onCollapse={setCollapsed} />
        </div>

        {/* Mobile Sidebar */}
        <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />

        {/* Main content area */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Topbar with theme toggle */}
          <div className="flex items-center">
            <div className="flex-1">
              <Topbar onMenuClick={() => setMobileOpen(true)} pageTitle={title} />
            </div>
            <div className="pr-4 hidden sm:block">
              <ThemeToggle />
            </div>
          </div>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto pb-24 lg:pb-0">
            <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
              <Outlet />
            </div>
          </main>
        </div>

        {/* Mobile bottom nav */}
        <MobileBottomNav />
      </div>

      {/* ─── Floating Action Button (FAB) ─── */}
      <div className="fixed bottom-24 right-5 lg:bottom-8 lg:right-8 z-40 flex flex-col items-end gap-2">
        {/* Quick action items (shown when FAB is open) */}
        {fabOpen && (
          <div className="flex flex-col items-end gap-2 animate-in">
            {[
              { label: 'Income',   type: 'income'   as const, color: '#2563EB', icon: <TrendingUp size={16} /> },
              { label: 'Expense',  type: 'expense'  as const, color: '#EF4444', icon: <TrendingDown size={16} /> },
              { label: 'Transfer', type: 'transfer' as const, color: '#6366F1', icon: <ArrowLeftRight size={16} /> },
            ].map(item => (
              <button
                key={item.type}
                onClick={() => openTx(item.type)}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-full text-white text-sm font-semibold shadow-lg hover:scale-105 transition-all"
                style={{ background: item.color }}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        )}

        {/* FAB button */}
        <button
          onClick={() => setFabOpen(v => !v)}
          className="w-14 h-14 rounded-full gradient-primary text-white shadow-xl hover:shadow-2xl hover:scale-110 transition-all flex items-center justify-center"
          aria-label="Quick add transaction"
        >
          <Plus
            size={26}
            className="transition-transform duration-300"
            style={{ transform: fabOpen ? 'rotate(45deg)' : 'rotate(0deg)' }}
          />
        </button>
      </div>

      {/* FAB backdrop (click to close) */}
      {fabOpen && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setFabOpen(false)}
        />
      )}
    </>
  )
}

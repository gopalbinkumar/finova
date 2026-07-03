import { LogOut, TrendingUp, User } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useLogout } from '@/hooks/useAuth'
import { Logo } from '@/components/common/Logo'
import { ThemeToggle } from '@/components/common/ThemeToggle'

export function DashboardPage() {
  const { user } = useAuthStore()
  const logout = useLogout()

  return (
    <div className="min-h-screen bg-background">
      {/* Topbar */}
      <header className="sticky top-0 z-40 bg-card border-b border-border px-6 py-3 flex items-center justify-between">
        <Logo size="sm" />
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            to="/profile"
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm font-medium text-foreground"
          >
            <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold">
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <span className="hidden sm:inline">{user?.name}</span>
          </Link>
          <button
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Banner */}
        <div className="rounded-2xl gradient-primary p-8 mb-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-white" />
            <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-white" />
          </div>
          <div className="relative">
            <div className="flex items-center gap-2 mb-2 opacity-90">
              <TrendingUp size={20} />
              <span className="text-sm font-medium">Authentication Module Complete</span>
            </div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome to Finova, {user?.name?.split(' ')[0] ?? 'User'}! 👋
            </h1>
            <p className="opacity-90 text-sm">
              You're successfully authenticated. The full dashboard is coming next.
            </p>
          </div>
        </div>

        {/* Module status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: 'Authentication', status: 'Complete', color: 'text-primary-500', icon: '✅' },
            { label: 'Dashboard', status: 'Up Next', color: 'text-amber-500', icon: '🔄' },
            { label: 'Accounts', status: 'Pending', color: 'text-muted-foreground', icon: '⏳' },
            { label: 'Transactions', status: 'Pending', color: 'text-muted-foreground', icon: '⏳' },
            { label: 'Budget', status: 'Pending', color: 'text-muted-foreground', icon: '⏳' },
            { label: 'Goals', status: 'Pending', color: 'text-muted-foreground', icon: '⏳' },
          ].map((m) => (
            <div key={m.label} className="finova-card flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">{m.label}</p>
                <p className={`text-sm font-medium ${m.color}`}>{m.status}</p>
              </div>
              <span className="text-2xl">{m.icon}</span>
            </div>
          ))}
        </div>

        {/* Profile link */}
        <div className="finova-card mt-6 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">Complete your profile</h3>
            <p className="text-muted-foreground text-sm">
              Add your phone, currency, and timezone preferences.
            </p>
          </div>
          <Link
            to="/profile"
            className="btn-primary flex items-center gap-2 flex-shrink-0"
          >
            <User size={16} />
            Go to Profile
          </Link>
        </div>
      </main>
    </div>
  )
}

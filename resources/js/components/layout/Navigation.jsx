import { NavLink, useNavigate } from "react-router-dom";

import {
    LayoutDashboard,
    Wallet,
    Tag,
    ArrowLeftRight,
    PieChart,
    Target,
    TrendingUp,
    CreditCard,
    BarChart2,
    Bell,
    Settings,
    LogOut,
    X,
    ChevronLeft,
    ChevronRight,
    Menu,
} from "lucide-react";

import { Logo } from "@/components/common/Logo";
import { useAuthStore } from "@/store/authStore";
import { useLogout } from "@/hooks/useAuth";
import { mockNotifications } from "@/data/mockData";

const navItems = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/accounts", icon: Wallet, label: "Accounts" },
    { to: "/categories", icon: Tag, label: "Categories" },
    { to: "/transactions", icon: ArrowLeftRight, label: "Transactions" },
    { to: "/budget", icon: PieChart, label: "Budget" },
    { to: "/goals", icon: Target, label: "Goals" },
    { to: "/investments", icon: TrendingUp, label: "Investments" },
    { to: "/debts", icon: CreditCard, label: "Debts" },
    { to: "/reports", icon: BarChart2, label: "Reports" },
    { to: "/notifications", icon: Bell, label: "Notifications" },
];

function UserAvatar({ user, size = "sm" }) {
    const initial = user?.name?.[0]?.toUpperCase() ?? "U";

    const sizeClass = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";

    if (user?.avatar_url) {
        return (
            <img
                src={user.avatar_url}
                alt={user?.name ?? "User avatar"}
                className={`${sizeClass} rounded-full object-cover flex-shrink-0 border border-white/20`}
            />
        );
    }

    return (
        <div
            className={`${sizeClass} rounded-full gradient-primary flex items-center justify-center text-white font-bold flex-shrink-0`}
        >
            {initial}
        </div>
    );
}

export function Sidebar({
    collapsed,
    onCollapse,
    onMobileClose,
    mobile = false,
}) {
    const { user } = useAuthStore();
    const logout = useLogout();

    const unread = mockNotifications.filter((n) => !n.read).length;

    const handleLogout = () => {
        logout.mutate();
    };

    return (
        <aside
            className={`
        flex flex-col h-full transition-all duration-300
        ${collapsed && !mobile ? "w-16" : "w-64"}
      `}
            style={{
                background: "linear-gradient(180deg, #0F172A 0%, #020617 100%)",
            }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-5 border-b border-white/10 flex-shrink-0">
                {(!collapsed || mobile) && <Logo size="sm" variant="full" />}

                {collapsed && !mobile && <Logo size="sm" variant="icon" />}

                {mobile ? (
                    <button
                        onClick={onMobileClose}
                        className="text-white/60 hover:text-white p-1 rounded transition-colors"
                    >
                        <X size={20} />
                    </button>
                ) : (
                    <button
                        onClick={() => onCollapse(!collapsed)}
                        className="text-white/60 hover:text-white p-1 rounded transition-colors ml-auto"
                    >
                        {collapsed ? (
                            <ChevronRight size={18} />
                        ) : (
                            <ChevronLeft size={18} />
                        )}
                    </button>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto no-scrollbar py-4 px-2 space-y-1">
                {navItems.map(({ to, icon: Icon, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        onClick={onMobileClose}
                        className={({ isActive }) => `
              sidebar-item group relative
              ${isActive ? "active" : ""}
              ${collapsed && !mobile ? "justify-center px-2" : ""}
            `}
                        title={collapsed && !mobile ? label : undefined}
                    >
                        <div className="relative flex-shrink-0">
                            <Icon size={18} />

                            {label === "Notifications" && unread > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 bg-primary-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                                    {unread}
                                </span>
                            )}
                        </div>

                        {(!collapsed || mobile) && (
                            <span className="truncate">{label}</span>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Bottom */}
            <div className="border-t border-white/10 px-2 py-3 space-y-1 flex-shrink-0">
                <NavLink
                    to="/profile"
                    onClick={onMobileClose}
                    className={({ isActive }) => `
            sidebar-item
            ${isActive ? "active" : ""}
            ${collapsed && !mobile ? "justify-center px-2" : ""}
          `}
                    title={collapsed && !mobile ? "Settings" : undefined}
                >
                    <Settings size={18} />

                    {(!collapsed || mobile) && <span>Settings</span>}
                </NavLink>

                {/* User info - tampil hanya di sidebar */}
                {(!collapsed || mobile) && (
                    <div className="flex items-center gap-3 px-3 py-2 mt-2 rounded-xl bg-white/5">
                        <UserAvatar user={user} size="sm" />

                        <div className="flex-1 min-w-0">
                            <p className="text-white text-xs font-semibold truncate">
                                {user?.name ?? "User"}
                            </p>

                            <p className="text-white/40 text-[10px] truncate">
                                {user?.email ?? "user@finova.app"}
                            </p>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="text-white/40 hover:text-red-400 transition-colors flex-shrink-0"
                            title="Logout"
                        >
                            <LogOut size={15} />
                        </button>
                    </div>
                )}

                {collapsed && !mobile && (
                    <button
                        onClick={handleLogout}
                        className="sidebar-item justify-center px-2 w-full"
                        title="Logout"
                    >
                        <LogOut size={18} />
                    </button>
                )}
            </div>
        </aside>
    );
}

// ─── Mobile Sidebar Overlay ───────────────────────────────────────────────────

export function MobileSidebar({ open, onClose }) {
    return (
        <>
            {/* Backdrop */}
            <div
                className={`
          fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 lg:hidden
          ${open ? "opacity-100" : "opacity-0 pointer-events-none"}
        `}
                onClick={onClose}
            />

            {/* Drawer */}
            <div
                className={`
          fixed inset-y-0 left-0 z-50 transition-transform duration-300 lg:hidden
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
            >
                <Sidebar
                    collapsed={false}
                    onCollapse={() => {}}
                    onMobileClose={onClose}
                    mobile
                />
            </div>
        </>
    );
}

// ─── Topbar ───────────────────────────────────────────────────────────────────

export function Topbar({ onMenuClick, pageTitle }) {
    const navigate = useNavigate();
    const unread = mockNotifications.filter((n) => !n.read).length;

    return (
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border h-16 flex items-center px-4 lg:px-6 gap-4">
            {/* Mobile menu button */}
            <button
                onClick={onMenuClick}
                className="lg:hidden text-muted-foreground hover:text-foreground transition-colors p-1"
            >
                <Menu size={22} />
            </button>

            {/* Page title */}
            <h2 className="text-base font-semibold text-foreground flex-1 truncate">
                {pageTitle}
            </h2>

            {/* Right actions - hanya lonceng notifikasi */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => navigate("/notifications")}
                    className="relative p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    title="Notifications"
                >
                    <Bell size={20} />

                    {unread > 0 && (
                        <span className="absolute top-1 right-1 bg-primary-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                            {unread}
                        </span>
                    )}
                </button>
            </div>
        </header>
    );
}

// ─── Mobile Bottom Navigation ─────────────────────────────────────────────────

const bottomNavItems = [
    { to: "/transactions", icon: ArrowLeftRight, label: "Txns" },
    { to: "/budget", icon: PieChart, label: "Budget" },
    { to: "/dashboard", icon: LayoutDashboard, label: "Home" },
    { to: "/goals", icon: Target, label: "Goals" },
    { to: "/accounts", icon: Wallet, label: "Accounts" },
];

export function MobileBottomNav() {
    return (
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-card border-t border-border safe-area-bottom">
            <div className="flex">
                {bottomNavItems.map(({ to, icon: Icon, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) => `
              flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium transition-colors
              ${isActive ? "text-primary-500" : "text-muted-foreground"}
            `}
                    >
                        <Icon size={22} />

                        <span className="text-[10px]">{label}</span>
                    </NavLink>
                ))}
            </div>
        </nav>
    );
}

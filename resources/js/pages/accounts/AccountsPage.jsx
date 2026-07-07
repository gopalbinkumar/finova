import { useEffect, useState } from "react";
import {
    Plus,
    Eye,
    EyeOff,
    Wallet,
    CreditCard,
    Smartphone,
    PiggyBank,
    TrendingUp,
} from "lucide-react";
import { SectionHeader, StatCard, Badge } from "@/components/ui/Cards";
import {
    ActionMenu,
    ConfirmDeleteModal,
    EditRecordModal,
} from "@/components/ui/RecordActions";
import { AddAccountModal } from "@/components/modals/AddAccountModal";
import { api } from "@/services/api";

const accountTypeLabels = {
    bank: "Bank",
    credit_card: "Credit Card",
    e_wallet: "E-Wallet",
    cash: "Cash",
    investment: "Investment",
};

const accountTypeIcons = {
    bank: <Wallet size={18} />,
    credit_card: <CreditCard size={18} />,
    e_wallet: <Smartphone size={18} />,
    cash: <PiggyBank size={18} />,
    investment: <TrendingUp size={18} />,
};

const currencyOptions = [
    { value: "USD", label: "USD" },
    { value: "EUR", label: "EUR" },
    { value: "GBP", label: "GBP" },
    { value: "IDR", label: "IDR" },
    { value: "JPY", label: "JPY" },
    { value: "SGD", label: "SGD" },
];

const accountFields = [
    {
        key: "name",
        label: "Account Name",
        required: true,
        placeholder: "Account name",
    },
    {
        key: "type",
        label: "Account Type",
        type: "select",
        options: Object.entries(accountTypeLabels).map(([value, label]) => ({
            value,
            label,
        })),
    },
    {
        key: "balance",
        label: "Current Balance",
        type: "number",
        leftDecor: "$",
        step: "0.01",
    },
    {
        key: "currency",
        label: "Currency",
        type: "select",
        options: currencyOptions,
    },
    {
        key: "color",
        label: "Account Color",
        type: "color",
        fullWidth: true,
    },
    {
        key: "notes",
        label: "Notes",
        placeholder: "Optional description",
        fullWidth: true,
    },
];

const toNumber = (value) => {
    const number = Number(value);

    return Number.isNaN(number) ? 0 : number;
};

const fmt = (value, currency = "USD") => {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
    }).format(toNumber(value));
};

export function AccountsPage() {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pageError, setPageError] = useState("");

    const [hideBalance, setHideBalance] = useState(false);
    const [activeType, setActiveType] = useState("all");

    const [showAddModal, setShowAddModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [deleting, setDeleting] = useState(null);

    const fetchAccounts = async () => {
        try {
            setLoading(true);
            setPageError("");

            const response = await api.get("/accounts");

            setAccounts(response.data.data || []);
        } catch (error) {
            console.error("Failed to fetch accounts:", error);

            setPageError(
                error?.response?.data?.message || "Failed to load accounts.",
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAccounts();
    }, []);

    const handleCreateAccount = async (payload) => {
        try {
            setPageError("");

            const response = await api.post("/accounts", {
                name: payload.name,
                type: payload.type,
                currency: payload.currency,
                balance: payload.balance,
                color: payload.color,
                notes: payload.notes,
            });

            const createdAccount = response.data.data;

            setAccounts((items) => [createdAccount, ...items]);
        } catch (error) {
            console.error("Failed to create account:", error);

            throw error;
        }
    };

    const handleUpdateAccount = async (next) => {
        try {
            setPageError("");

            const response = await api.put(`/accounts/${next.id}`, {
                name: next.name,
                type: next.type,
                currency: next.currency,
                balance: toNumber(next.balance),
                color: next.color,
                notes: next.notes || null,
            });

            const updatedAccount = response.data.data;

            setAccounts((items) =>
                items.map((item) =>
                    item.id === updatedAccount.id ? updatedAccount : item,
                ),
            );

            setEditing(null);
        } catch (error) {
            console.error("Failed to update account:", error);

            setPageError(
                error?.response?.data?.message ||
                    "Failed to update account.",
            );
        }
    };

    const handleDeleteAccount = async () => {
        if (!deleting?.id) return;

        try {
            setPageError("");

            await api.delete(`/accounts/${deleting.id}`);

            setAccounts((items) =>
                items.filter((item) => item.id !== deleting.id),
            );

            setDeleting(null);
        } catch (error) {
            console.error("Failed to delete account:", error);

            setPageError(
                error?.response?.data?.message ||
                    "Failed to delete account.",
            );
        }
    };

    const types = [
        "all",
        ...Array.from(new Set(accounts.map((account) => account.type))),
    ];

    const filtered =
        activeType === "all"
            ? accounts
            : accounts.filter((account) => account.type === activeType);

    const totalBalance = accounts.reduce(
        (sum, account) => sum + toNumber(account.balance),
        0,
    );

    const totalAssets = accounts
        .filter((account) => toNumber(account.balance) > 0)
        .reduce((sum, account) => sum + toNumber(account.balance), 0);

    const totalLiabilities = Math.abs(
        accounts
            .filter((account) => toNumber(account.balance) < 0)
            .reduce((sum, account) => sum + toNumber(account.balance), 0),
    );

    return (
        <>
            <AddAccountModal
                open={showAddModal}
                onClose={() => setShowAddModal(false)}
                onCreate={handleCreateAccount}
            />

            <EditRecordModal
                open={!!editing}
                onClose={() => setEditing(null)}
                title="Edit Account"
                subtitle="Update this account's details"
                icon={<Wallet size={20} />}
                iconColor={editing?.color}
                record={editing}
                fields={accountFields}
                onSave={handleUpdateAccount}
            />

            <ConfirmDeleteModal
                open={!!deleting}
                onClose={() => setDeleting(null)}
                itemName={deleting?.name}
                itemType="account"
                onConfirm={handleDeleteAccount}
            />

            <div className="space-y-6 animate-in">
                {/* Summary cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger">
                    <StatCard
                        title="Net Balance"
                        value={hideBalance ? "••••••" : fmt(totalBalance)}
                        icon={<Wallet size={20} />}
                        accentColor="#2563EB"
                        className="animate-in"
                    />

                    <StatCard
                        title="Total Assets"
                        value={hideBalance ? "••••••" : fmt(totalAssets)}
                        icon={<TrendingUp size={20} />}
                        accentColor="#3B82F6"
                        className="animate-in"
                    />

                    <StatCard
                        title="Total Liabilities"
                        value={hideBalance ? "••••••" : fmt(totalLiabilities)}
                        icon={<CreditCard size={20} />}
                        accentColor="#EF4444"
                        className="animate-in"
                    />
                </div>

                {/* Error */}
                {pageError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-900/40 dark:bg-red-900/20">
                        {pageError}
                    </div>
                )}

                {/* Account list */}
                <div className="finova-card">
                    <div className="flex items-center justify-between mb-5">
                        <SectionHeader
                            title="My Accounts"
                            subtitle={
                                loading
                                    ? "Loading accounts..."
                                    : `${accounts.length} accounts connected`
                            }
                        />

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() =>
                                    setHideBalance((value) => !value)
                                }
                                className="btn-ghost p-2 rounded-lg"
                                title="Toggle visibility"
                            >
                                {hideBalance ? (
                                    <EyeOff
                                        size={18}
                                        className="text-muted-foreground"
                                    />
                                ) : (
                                    <Eye
                                        size={18}
                                        className="text-muted-foreground"
                                    />
                                )}
                            </button>

                            <button
                                onClick={() => setShowAddModal(true)}
                                className="btn-primary flex items-center gap-2 text-sm px-4 py-2"
                            >
                                <Plus size={16} />
                                Add Account
                            </button>
                        </div>
                    </div>

                    {/* Type filter tabs */}
                    <div className="flex gap-2 flex-wrap mb-5">
                        {types.map((type) => (
                            <button
                                key={type}
                                onClick={() => setActiveType(type)}
                                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                                    activeType === type
                                        ? "bg-primary-500 text-white border-primary-500"
                                        : "border-border text-muted-foreground hover:text-foreground hover:border-primary-500"
                                }`}
                            >
                                {type === "all"
                                    ? "All"
                                    : accountTypeLabels[type] || type}
                            </button>
                        ))}
                    </div>

                    {/* Loading */}
                    {loading ? (
                        <div className="py-10 text-center text-sm text-muted-foreground">
                            Loading accounts...
                        </div>
                    ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filtered.map((account) => {
                                const balance = toNumber(account.balance);
                                const currency = account.currency || "USD";

                                return (
                                    <div
                                        key={account.id}
                                        className="relative rounded-xl border border-border p-5 hover:border-primary-500/30 hover:shadow-md transition-all cursor-pointer group"
                                    >
                                        {/* Gradient top strip */}
                                        <div
                                            className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
                                            style={{
                                                background: account.color,
                                            }}
                                        />

                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                                                    style={{
                                                        background: `${account.color}20`,
                                                        color: account.color,
                                                    }}
                                                >
                                                    {accountTypeIcons[
                                                        account.type
                                                    ] ?? <Wallet size={18} />}
                                                </div>

                                                <div>
                                                    <p className="font-semibold text-foreground text-sm leading-tight">
                                                        {account.name}
                                                    </p>

                                                    <p className="text-xs text-muted-foreground">
                                                        {accountTypeLabels[
                                                            account.type
                                                        ] || account.type}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                                <ActionMenu
                                                    onEdit={() =>
                                                        setEditing(account)
                                                    }
                                                    onDelete={() =>
                                                        setDeleting(account)
                                                    }
                                                    label={`Open actions for ${account.name}`}
                                                />
                                            </div>
                                        </div>

                                        {/* Balance */}
                                        <div className="mb-2">
                                            <p className="text-xs text-muted-foreground mb-1">
                                                Current Balance
                                            </p>

                                            <p
                                                className={`text-xl font-bold ${
                                                    balance < 0
                                                        ? "text-red-500"
                                                        : "text-foreground"
                                                }`}
                                            >
                                                {hideBalance
                                                    ? "••••••"
                                                    : fmt(balance, currency)}
                                            </p>
                                        </div>

                                        <Badge
                                            variant={
                                                balance < 0
                                                    ? "danger"
                                                    : "success"
                                            }
                                        >
                                            {balance < 0
                                                ? "Liability"
                                                : "Asset"}
                                        </Badge>
                                    </div>
                                );
                            })}

                            {/* Empty State */}
                            {filtered.length === 0 && (
                                <div className="sm:col-span-2 lg:col-span-3 py-10 text-center text-sm text-muted-foreground border border-dashed border-border rounded-xl">
                                    No accounts found.
                                </div>
                            )}

                            {/* Add account card */}
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="rounded-xl border-2 border-dashed border-border hover:border-primary-500 p-5 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary-500 transition-all min-h-[140px] group"
                            >
                                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 transition-colors">
                                    <Plus size={20} />
                                </div>

                                <span className="text-sm font-medium">
                                    Add New Account
                                </span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
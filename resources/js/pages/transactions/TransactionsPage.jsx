import { useEffect, useMemo, useState } from "react";
import {
    Search,
    Plus,
    Filter,
    Download,
    ArrowUpRight,
    ArrowDownRight,
    ArrowLeftRight,
} from "lucide-react";
import { Badge } from "@/components/ui/Cards";
import {
    ActionMenu,
    ConfirmDeleteModal,
    EditRecordModal,
} from "@/components/ui/RecordActions";
import { AddTransactionModal } from "@/components/modals/AddTransactionModal";
import { api } from "@/services/api";

const typeLabels = {
    income: "Income",
    expense: "Expense",
    transfer: "Transfer",
};

const currencyOptions = [
    { value: "USD", label: "USD" },
    { value: "EUR", label: "EUR" },
    { value: "GBP", label: "GBP" },
    { value: "IDR", label: "IDR" },
    { value: "JPY", label: "JPY" },
    { value: "SGD", label: "SGD" },
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

export function TransactionsPage() {
    const [transactions, setTransactions] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [categories, setCategories] = useState([]);

    const [loading, setLoading] = useState(false);
    const [pageError, setPageError] = useState("");

    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [page, setPage] = useState(1);

    const [showModal, setShowModal] = useState(false);
    const [defaultTxType, setDefaultTxType] = useState("expense");

    const [editing, setEditing] = useState(null);
    const [deleting, setDeleting] = useState(null);

    const perPage = 10;

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            setPageError("");

            const response = await api.get("/transactions");

            const transactionData = Array.isArray(response.data)
                ? response.data
                : response.data.data || [];

            setTransactions(transactionData);
        } catch (error) {
            console.error("Failed to fetch transactions:", error);

            setPageError(
                error?.response?.data?.message ||
                    "Failed to load transactions.",
            );
        } finally {
            setLoading(false);
        }
    };

    const fetchOptions = async () => {
        try {
            const [accountsResponse, categoriesResponse] = await Promise.all([
                api.get("/accounts"),
                api.get("/categories"),
            ]);

            const accountData = Array.isArray(accountsResponse.data)
                ? accountsResponse.data
                : accountsResponse.data.data || [];

            const categoryData = Array.isArray(categoriesResponse.data)
                ? categoriesResponse.data
                : categoriesResponse.data.data || [];

            setAccounts(accountData);
            setCategories(categoryData);
        } catch (error) {
            console.error("Failed to fetch transaction options:", error);
        }
    };

    useEffect(() => {
        fetchTransactions();
        fetchOptions();
    }, []);

    const handleCreateTransaction = async (payload) => {
        try {
            setPageError("");

            const response = await api.post("/transactions", payload);

            const createdTransaction = response.data.data || response.data;

            setTransactions((items) => [createdTransaction, ...items]);

            // Refresh options because account balances may change after transaction.
            fetchOptions();
        } catch (error) {
            console.error("Failed to create transaction:", error);

            throw error;
        }
    };

    const handleUpdateTransaction = async (next) => {
        try {
            setPageError("");

            const payload = {
                type: next.type,
                account_id: Number(next.account_id),
                to_account_id:
                    next.type === "transfer"
                        ? Number(next.to_account_id)
                        : null,
                category_id:
                    next.type === "transfer" ? null : Number(next.category_id),
                amount: toNumber(next.amount),
                date: next.date,
                description: next.description,
                notes: next.notes || null,
            };

            const response = await api.put(`/transactions/${next.id}`, payload);

            const updatedTransaction = response.data.data || response.data;

            setTransactions((items) =>
                items.map((item) =>
                    item.id === updatedTransaction.id
                        ? updatedTransaction
                        : item,
                ),
            );

            setEditing(null);

            // Refresh options because account balances may change after edit.
            fetchOptions();
        } catch (error) {
            console.error("Failed to update transaction:", error);

            setPageError(
                error?.response?.data?.message ||
                    "Failed to update transaction.",
            );
        }
    };

    const handleDeleteTransaction = async () => {
        if (!deleting?.id) return;

        try {
            setPageError("");

            await api.delete(`/transactions/${deleting.id}`);

            setTransactions((items) =>
                items.filter((item) => item.id !== deleting.id),
            );

            setDeleting(null);

            // Refresh options because account balances may change after delete.
            fetchOptions();
        } catch (error) {
            console.error("Failed to delete transaction:", error);

            setPageError(
                error?.response?.data?.message ||
                    "Failed to delete transaction.",
            );
        }
    };

    const openModal = (type = "expense") => {
        setDefaultTxType(type);
        setShowModal(true);
    };

    const accountOptions = useMemo(() => {
        return accounts.map((account) => ({
            value: String(account.id),
            label: `${account.name} (${fmt(account.balance, account.currency)})`,
        }));
    }, [accounts]);

    const incomeCategoryOptions = useMemo(() => {
        return categories
            .filter((category) => category.type === "income")
            .map((category) => ({
                value: String(category.id),
                label: `${category.icon || "🏷️"} ${category.name}`,
            }));
    }, [categories]);

    const expenseCategoryOptions = useMemo(() => {
        return categories
            .filter((category) => category.type === "expense")
            .map((category) => ({
                value: String(category.id),
                label: `${category.icon || "🏷️"} ${category.name}`,
            }));
    }, [categories]);

    const transactionFields = useMemo(() => {
        const selectedType = editing?.type || "expense";

        const categoryOptions =
            selectedType === "income"
                ? incomeCategoryOptions
                : expenseCategoryOptions;

        const toAccountOptions = accountOptions.filter(
            (account) =>
                String(account.value) !== String(editing?.account_id || ""),
        );

        return [
            {
                key: "type",
                label: "Transaction Type",
                type: "select",
                options: [
                    { value: "income", label: "Income" },
                    { value: "expense", label: "Expense" },
                    { value: "transfer", label: "Transfer" },
                ],
            },
            {
                key: "account_id",
                label: selectedType === "transfer" ? "From Account" : "Account",
                type: "select",
                required: true,
                options: accountOptions,
            },
            ...(selectedType === "transfer"
                ? [
                      {
                          key: "to_account_id",
                          label: "To Account",
                          type: "select",
                          required: true,
                          options: toAccountOptions,
                      },
                  ]
                : [
                      {
                          key: "category_id",
                          label: "Category",
                          type: "select",
                          required: true,
                          options: categoryOptions,
                      },
                  ]),
            {
                key: "amount",
                label: "Amount",
                type: "number",
                required: true,
                leftDecor: "$",
                step: "0.01",
            },
            {
                key: "date",
                label: "Date",
                type: "date",
                required: true,
            },
            {
                key: "description",
                label: "Description",
                required: true,
                placeholder: "Description",
            },
            {
                key: "notes",
                label: "Notes",
                placeholder: "Optional notes",
                fullWidth: true,
            },
        ];
    }, [
        editing,
        accountOptions,
        incomeCategoryOptions,
        expenseCategoryOptions,
    ]);

    const normalizedEditing = editing
        ? {
              ...editing,
              account_id: editing.account_id ? String(editing.account_id) : "",
              to_account_id: editing.to_account_id
                  ? String(editing.to_account_id)
                  : "",
              category_id: editing.category_id
                  ? String(editing.category_id)
                  : "",
              amount: String(editing.amount ?? ""),
              date: editing.date || new Date().toISOString().slice(0, 10),
          }
        : null;

    const filtered = transactions.filter((transaction) => {
        const keyword = search.toLowerCase();

        const description = transaction.description || "";
        const category = transaction.category || "";
        const account = transaction.account || "";
        const toAccount = transaction.to_account || "";

        const matchSearch =
            description.toLowerCase().includes(keyword) ||
            category.toLowerCase().includes(keyword) ||
            account.toLowerCase().includes(keyword) ||
            toAccount.toLowerCase().includes(keyword);

        const matchType =
            typeFilter === "all" || transaction.type === typeFilter;

        return matchSearch && matchType;
    });

    const totalIncome = transactions
        .filter((transaction) => transaction.type === "income")
        .reduce((sum, transaction) => sum + toNumber(transaction.amount), 0);

    const totalExpense = transactions
        .filter((transaction) => transaction.type === "expense")
        .reduce((sum, transaction) => sum + toNumber(transaction.amount), 0);

    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));

    const safePage = Math.min(page, totalPages);

    const paginated = filtered.slice(
        (safePage - 1) * perPage,
        safePage * perPage,
    );

    const txTypeIcon = (type) => {
        if (type === "income") return <ArrowUpRight size={15} />;
        if (type === "transfer") return <ArrowLeftRight size={15} />;

        return <ArrowDownRight size={15} />;
    };

    const txBadge = (type) => {
        if (type === "income") {
            return <Badge variant="success">Income</Badge>;
        }

        if (type === "transfer") {
            return <Badge variant="info">Transfer</Badge>;
        }

        return <Badge variant="danger">Expense</Badge>;
    };

    const amountClass = (type) => {
        if (type === "income") return "text-primary-500";
        if (type === "transfer") return "text-blue-500";

        return "text-red-500";
    };

    const amountPrefix = (type) => {
        if (type === "income") return "+";
        if (type === "transfer") return "±";

        return "-";
    };

    const displayAccount = (transaction) => {
        if (transaction.type === "transfer") {
            return `${transaction.account || "-"} → ${
                transaction.to_account || "-"
            }`;
        }

        return transaction.account || "-";
    };

    return (
        <>
            <AddTransactionModal
                open={showModal}
                onClose={() => setShowModal(false)}
                defaultType={defaultTxType}
                onCreate={handleCreateTransaction}
            />

            <EditRecordModal
                open={!!editing}
                onClose={() => setEditing(null)}
                title="Edit Transaction"
                subtitle="Update this transaction"
                icon={<ArrowLeftRight size={20} />}
                iconColor={
                    editing?.type === "income"
                        ? "#2563EB"
                        : editing?.type === "transfer"
                          ? "#6366F1"
                          : "#EF4444"
                }
                record={normalizedEditing}
                fields={transactionFields}
                onSave={handleUpdateTransaction}
            />

            <ConfirmDeleteModal
                open={!!deleting}
                onClose={() => setDeleting(null)}
                itemName={deleting?.type}
                itemType="transaction"
                onConfirm={handleDeleteTransaction}
            />

            <div className="space-y-6 animate-in">
                {/* Summary row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        {
                            label: "Total Income",
                            value: totalIncome,
                            color: "text-primary-500",
                            bg: "bg-primary-50 dark:bg-primary-900/20",
                        },
                        {
                            label: "Total Expenses",
                            value: totalExpense,
                            color: "text-red-500",
                            bg: "bg-red-50 dark:bg-red-900/20",
                        },
                        {
                            label: "Net Cash Flow",
                            value: totalIncome - totalExpense,
                            color:
                                totalIncome - totalExpense >= 0
                                    ? "text-primary-500"
                                    : "text-red-500",
                            bg: "bg-muted",
                        },
                    ].map((summary) => (
                        <div
                            key={summary.label}
                            className={`finova-card text-center ${summary.bg}`}
                        >
                            <p className="text-xs text-muted-foreground">
                                {summary.label}
                            </p>

                            <p
                                className={`text-xl font-bold mt-1 ${summary.color}`}
                            >
                                {fmt(summary.value)}
                            </p>
                        </div>
                    ))}
                </div>

                {pageError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-900/40 dark:bg-red-900/20">
                        {pageError}
                    </div>
                )}

                {/* Filters + Table */}
                <div className="finova-card">
                    {/* Toolbar */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-5">
                        <div className="relative flex-1">
                            <Search
                                size={16}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                            />

                            <input
                                type="text"
                                placeholder="Search transactions..."
                                value={search}
                                onChange={(event) => {
                                    setSearch(event.target.value);
                                    setPage(1);
                                }}
                                className="finova-input pl-9 text-sm"
                            />
                        </div>

                        <div className="flex gap-2 flex-wrap">
                            {["all", "income", "expense", "transfer"].map(
                                (type) => (
                                    <button
                                        key={type}
                                        onClick={() => {
                                            setTypeFilter(type);
                                            setPage(1);
                                        }}
                                        className={`text-xs font-semibold px-3 py-2 rounded-lg border transition-all capitalize ${
                                            typeFilter === type
                                                ? "bg-primary-500 text-white border-primary-500"
                                                : "border-border text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        {type}
                                    </button>
                                ),
                            )}

                            <button className="btn-secondary flex items-center gap-2 text-sm px-3 py-2">
                                <Filter size={14} />
                                Filter
                            </button>

                            <button className="btn-secondary flex items-center gap-2 text-sm px-3 py-2">
                                <Download size={14} />
                                Export
                            </button>

                            {/* Quick add buttons */}
                            <button
                                onClick={() => openModal("income")}
                                className="text-xs font-semibold px-3 py-2 rounded-lg border border-primary-500/50 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
                            >
                                + Income
                            </button>

                            <button
                                onClick={() => openModal("expense")}
                                className="text-xs font-semibold px-3 py-2 rounded-lg border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                            >
                                + Expense
                            </button>

                            <button
                                onClick={() => openModal("expense")}
                                className="btn-primary flex items-center gap-2 text-sm px-3 py-2"
                            >
                                <Plus size={14} />
                                Add
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="finova-table">
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Category</th>
                                    <th>Account</th>
                                    <th>Date</th>
                                    <th>Description</th>
                                    <th className="text-right">Amount</th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="text-center text-muted-foreground py-8"
                                        >
                                            Loading transactions...
                                        </td>
                                    </tr>
                                ) : paginated.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="text-center text-muted-foreground py-8"
                                        >
                                            No transactions found.
                                        </td>
                                    </tr>
                                ) : (
                                    paginated.map((transaction) => (
                                        <tr
                                            key={transaction.id}
                                            className="cursor-pointer"
                                        >
                                            <td>{txBadge(transaction.type)}</td>

                                            <td className="text-muted-foreground text-sm">
                                                {transaction.type === "transfer"
                                                    ? "-"
                                                    : transaction.category ||
                                                      "-"}
                                            </td>

                                            <td className="text-muted-foreground text-sm">
                                                {displayAccount(transaction)}
                                            </td>

                                            <td className="text-muted-foreground text-sm whitespace-nowrap">
                                                {transaction.date}
                                            </td>

                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                                            transaction.type ===
                                                            "income"
                                                                ? "bg-primary-50 dark:bg-primary-900/20 text-primary-500"
                                                                : transaction.type ===
                                                                    "transfer"
                                                                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-500"
                                                                  : "bg-red-50 dark:bg-red-900/20 text-red-500"
                                                        }`}
                                                    >
                                                        {txTypeIcon(
                                                            transaction.type,
                                                        )}
                                                    </div>

                                                    <span className="font-medium text-foreground max-w-[180px] truncate text-sm">
                                                        {
                                                            transaction.description
                                                        }
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="text-right">
                                                <span
                                                    className={`font-bold text-sm ${amountClass(
                                                        transaction.type,
                                                    )}`}
                                                >
                                                    {amountPrefix(
                                                        transaction.type,
                                                    )}
                                                    {fmt(transaction.amount)}
                                                </span>
                                            </td>

                                            <td className="text-right">
                                                <ActionMenu
                                                    onEdit={() =>
                                                        setEditing(transaction)
                                                    }
                                                    onDelete={() =>
                                                        setDeleting(transaction)
                                                    }
                                                    label={`Open actions for ${transaction.description}`}
                                                />
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {filtered.length > 0 && totalPages > 1 && (
                        <div className="flex items-center justify-between mt-5 pt-4 border-t border-border">
                            <p className="text-sm text-muted-foreground">
                                Showing {(safePage - 1) * perPage + 1}–
                                {Math.min(safePage * perPage, filtered.length)}{" "}
                                of {filtered.length}
                            </p>

                            <div className="flex gap-2">
                                <button
                                    disabled={safePage === 1}
                                    onClick={() =>
                                        setPage((current) =>
                                            Math.max(1, current - 1),
                                        )
                                    }
                                    className="btn-secondary text-sm px-3 py-1.5 disabled:opacity-50"
                                >
                                    Prev
                                </button>

                                <button
                                    disabled={safePage === totalPages}
                                    onClick={() =>
                                        setPage((current) =>
                                            Math.min(totalPages, current + 1),
                                        )
                                    }
                                    className="btn-secondary text-sm px-3 py-1.5 disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

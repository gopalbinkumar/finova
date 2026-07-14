import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { SectionHeader, Badge } from "@/components/ui/Cards";
import {
    ConfirmDeleteModal,
    EditRecordModal,
} from "@/components/ui/RecordActions";
import { AddCategoryModal } from "@/components/modals/AddCategoryModal";
import { CategoryGridSkeleton } from "@/components/ui/Skeleton";
import { api } from "@/services/api";

const categoryFields = [
    {
        key: "name",
        label: "Category Name",
        required: true,
        placeholder: "Category name",
    },
    {
        key: "type",
        label: "Category Type",
        type: "select",
        options: [
            { value: "income", label: "Income" },
            { value: "expense", label: "Expense" },
        ],
    },
    {
        key: "icon",
        label: "Icon",
        placeholder: "Emoji",
    },
    {
        key: "color",
        label: "Category Color",
        type: "color",
    },
];

export function CategoriesPage() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pageError, setPageError] = useState("");

    const [search, setSearch] = useState("");
    const [tab, setTab] = useState("all");

    const [showModal, setShowModal] = useState(false);
    const [defaultType, setDefaultType] = useState("expense");

    const [editing, setEditing] = useState(null);
    const [deleting, setDeleting] = useState(null);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            setPageError("");

            const response = await api.get("/categories");

            setCategories(response.data.data || []);
        } catch (error) {
            console.error("Failed to fetch categories:", error);

            setPageError(
                error?.response?.data?.message || "Failed to load categories.",
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleCreateCategory = async (payload) => {
        try {
            setPageError("");

            const response = await api.post("/categories", {
                name: payload.name,
                type: payload.type,
                icon: payload.icon,
                color: payload.color,
            });

            const createdCategory = response.data.data;

            setCategories((items) => [createdCategory, ...items]);
        } catch (error) {
            console.error("Failed to create category:", error);

            throw error;
        }
    };

    const handleUpdateCategory = async (next) => {
        try {
            setPageError("");

            const response = await api.put(`/categories/${next.id}`, {
                name: next.name,
                type: next.type,
                icon: next.icon,
                color: next.color,
            });

            const updatedCategory = response.data.data;

            setCategories((items) =>
                items.map((item) =>
                    item.id === updatedCategory.id ? updatedCategory : item,
                ),
            );

            setEditing(null);
        } catch (error) {
            console.error("Failed to update category:", error);

            setPageError(
                error?.response?.data?.message || "Failed to update category.",
            );
        }
    };

    const handleDeleteCategory = async () => {
        if (!deleting?.id) return;

        try {
            setPageError("");

            await api.delete(`/categories/${deleting.id}`);

            setCategories((items) =>
                items.filter((item) => item.id !== deleting.id),
            );

            setDeleting(null);
        } catch (error) {
            console.error("Failed to delete category:", error);

            setPageError(
                error?.response?.data?.message || "Failed to delete category.",
            );
        }
    };

    const openModal = (type = "expense") => {
        setDefaultType(type);
        setShowModal(true);
    };

    const filtered = categories.filter((category) => {
        const name = category.name || "";
        const matchSearch = name.toLowerCase().includes(search.toLowerCase());

        const matchTab = tab === "all" || category.type === tab;

        return matchSearch && matchTab;
    });

    const income = categories.filter((category) => category.type === "income");
    const expense = categories.filter(
        (category) => category.type === "expense",
    );

    return (
        <>
            <AddCategoryModal
                open={showModal}
                onClose={() => setShowModal(false)}
                defaultType={defaultType}
                onCreate={handleCreateCategory}
            />

            <EditRecordModal
                open={!!editing}
                onClose={() => setEditing(null)}
                title="Edit Category"
                subtitle="Update this category"
                record={editing}
                fields={categoryFields}
                iconColor={editing?.color}
                onSave={handleUpdateCategory}
            />

            <ConfirmDeleteModal
                open={!!deleting}
                onClose={() => setDeleting(null)}
                itemName={deleting?.name}
                itemType="category"
                onConfirm={handleDeleteCategory}
            />

            <div className="space-y-6 animate-in">
                {/* Header */}
                <div className="finova-card flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex-1">
                        <h2 className="text-base font-bold text-foreground">
                            Category Management
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            {income.length} income · {expense.length} expense
                            categories
                        </p>
                    </div>

                    <button
                        onClick={() => openModal("expense")}
                        className="btn-primary flex items-center gap-2 text-sm px-4 py-2 flex-shrink-0"
                    >
                        <Plus size={16} />
                        New Category
                    </button>
                </div>

                {/* Error */}
                {pageError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-900/40 dark:bg-red-900/20">
                        {pageError}
                    </div>
                )}

                {/* Filters */}
                <div className="finova-card">
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search
                                size={16}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                            />

                            <input
                                type="text"
                                placeholder="Search categories..."
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                className="finova-input pl-9 text-sm"
                            />
                        </div>

                        {/* Tabs */}
                        <div className="flex rounded-lg border border-border overflow-hidden">
                            {["all", "income", "expense"].map((item) => (
                                <button
                                    key={item}
                                    onClick={() => setTab(item)}
                                    className={`px-4 py-2 text-sm font-medium transition-colors capitalize ${
                                        tab === item
                                            ? "bg-primary-500 text-white"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                    }`}
                                >
                                    {item}
                                </button>
                            ))}
                        </div>
                    </div>

                    <SectionHeader
                        title={
                            loading
                                ? "Preparing categories..."
                                : `${filtered.length} Categories`
                        }
                        subtitle="Click pencil icon to edit"
                    />

                    {/* Loading */}
                    {loading ? (
                        <CategoryGridSkeleton />
                    ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {filtered.map((category) => (
                                <div
                                    key={category.id}
                                    className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-primary-500/30 hover:shadow-md transition-all group cursor-pointer"
                                >
                                    {/* Icon */}
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 transition-transform group-hover:scale-110"
                                        style={{
                                            background: `${category.color}20`,
                                        }}
                                    >
                                        {category.icon}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-foreground text-sm truncate">
                                            {category.name}
                                        </p>

                                        <Badge
                                            variant={
                                                category.type === "income"
                                                    ? "success"
                                                    : "danger"
                                            }
                                        >
                                            {category.type}
                                        </Badge>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                setEditing(category);
                                            }}
                                            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                            aria-label={`Edit ${category.name}`}
                                        >
                                            <Pencil size={14} />
                                        </button>

                                        <button
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                setDeleting(category);
                                            }}
                                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-500 transition-colors"
                                            aria-label={`Delete ${category.name}`}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {/* Empty State */}
                            {filtered.length === 0 && (
                                <div className="sm:col-span-2 lg:col-span-3 py-10 text-center text-sm text-muted-foreground border border-dashed border-border rounded-xl">
                                    No categories found.
                                </div>
                            )}

                            {/* Add income category */}
                            <button
                                onClick={() => openModal("income")}
                                className="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-primary-500/30 hover:border-primary-500 text-primary-500/60 hover:text-primary-500 transition-all group min-h-[72px]"
                            >
                                <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
                                    <Plus size={18} />
                                </div>

                                <span className="text-sm font-medium">
                                    Add Income Category
                                </span>
                            </button>

                            {/* Add expense category */}
                            <button
                                onClick={() => openModal("expense")}
                                className="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-red-200 dark:border-red-900/40 hover:border-red-400 text-red-400/60 hover:text-red-500 transition-all group min-h-[72px]"
                            >
                                <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                                    <Plus size={18} />
                                </div>

                                <span className="text-sm font-medium">
                                    Add Expense Category
                                </span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

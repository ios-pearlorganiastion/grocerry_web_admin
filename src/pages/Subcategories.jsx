import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Image as ImageIcon,
  ImagePlus,
  CheckCircle2,
  XCircle,
  RefreshCw,
  FolderTree,
  Tag,
  ChevronRight,
  X,
  Loader2,
  Layers,
  ArrowRight,
  Package,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { getCategories } from "../api/categoriesApis";
import {
  getSubcategories,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
} from "../api/subcategoryApis";
import { useToast } from "../components/ui/Toast";

const slugify = (value) =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const normalizeList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.items)) return response.items;
  return [];
};

const EMPTY_FORM = {
  name: "",
  slug: "",
  description: "",
  categoryId: "",
  imageUrl: "",
  isActive: true,
};

const FILTERS = [
  ["all", "All"],
  ["active", "Active"],
  ["inactive", "Inactive"],
];

const STATUS_STYLE = {
  Active: "bg-[#eef5e7] text-[#315d32]",
  Inactive: "bg-[#f8ecea] text-[#b35a54]",
};

const pageVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" },
  },
};

const inputClass =
  "h-11 w-full rounded-xl border border-[#dceacb] bg-[#f7f8f2] px-3 text-xs font-semibold text-[#202a20] outline-none transition placeholder:font-normal placeholder:text-[#92998e] sm:text-sm";

export default function Subcategories() {
  const showToast = useToast();
  const fileInputRef = useRef(null);

  const [subcategories, setSubcategories] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError("");

      const [subcatsRes, catsRes] = await Promise.all([
        getSubcategories(),
        getCategories(),
      ]);

      setSubcategories(normalizeList(subcatsRes));
      setCategories(normalizeList(catsRes));
    } catch (err) {
      console.error("Failed to load subcategories:", err);
      const msg = err.message || "Failed to load subcategories";
      setError(msg);
      showToast?.(msg, "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredSubcategories = useMemo(() => {
    return subcategories.filter((sub) => {
      const matchesSearch =
        !search.trim() ||
        sub.name.toLowerCase().includes(search.toLowerCase()) ||
        sub.slug?.toLowerCase().includes(search.toLowerCase()) ||
        sub.category?.name?.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        categoryFilter === "all" || sub.categoryId === categoryFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && sub.isActive) ||
        (statusFilter === "inactive" && !sub.isActive);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [subcategories, search, categoryFilter, statusFilter]);

  const handleOpenAdd = () => {
    setSelectedSubcategory(null);
    setFormData({
      ...EMPTY_FORM,
      categoryId: categories.length > 0 ? categories[0].id : "",
    });
    setImageFile(null);
    setImagePreview("");
    setModalOpen(true);
  };

  const handleOpenEdit = (sub) => {
    setSelectedSubcategory(sub);
    setFormData({
      name: sub.name || "",
      slug: sub.slug || "",
      description: sub.description || "",
      categoryId: sub.categoryId || "",
      imageUrl: sub.imageUrl || "",
      isActive: sub.isActive ?? true,
    });
    setImageFile(null);
    setImagePreview(sub.imageUrl || "");
    setModalOpen(true);
  };

  const handleOpenView = (sub) => {
    setSelectedSubcategory(sub);
    setViewModalOpen(true);
  };

  const handleOpenDelete = (sub) => {
    setSelectedSubcategory(sub);
    setDeleteModalOpen(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleNameChange = (name) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: !selectedSubcategory ? slugify(name) : prev.slug,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast?.("Subcategory name is required", "error");
      return;
    }
    if (!formData.categoryId) {
      showToast?.("Parent category is required", "error");
      return;
    }

    try {
      setSaving(true);
      const payload = new FormData();
      payload.append("name", formData.name.trim());
      payload.append("slug", formData.slug.trim() || slugify(formData.name));
      payload.append("categoryId", formData.categoryId);
      if (formData.description) {
        payload.append("description", formData.description.trim());
      }
      payload.append("isActive", String(formData.isActive));

      if (imageFile) {
        payload.append("file", imageFile);
      } else if (formData.imageUrl) {
        payload.append("imageUrl", formData.imageUrl);
      }

      if (selectedSubcategory) {
        await updateSubcategory(selectedSubcategory.id, payload);
        showToast?.("Subcategory updated successfully!", "success");
      } else {
        await createSubcategory(payload);
        showToast?.("Subcategory created successfully!", "success");
      }

      setModalOpen(false);
      loadData(true);
    } catch (err) {
      console.error("Save error:", err);
      showToast?.(err.message || "Failed to save subcategory", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSubcategory) return;
    try {
      setDeleting(true);
      await deleteSubcategory(selectedSubcategory.id);
      showToast?.("Subcategory deleted successfully!", "success");
      setDeleteModalOpen(false);
      loadData(true);
    } catch (err) {
      console.error("Delete error:", err);
      showToast?.(err.message || "Failed to delete subcategory", "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleStatus = async (sub) => {
    try {
      await updateSubcategory(sub.id, { isActive: !sub.isActive });
      showToast?.(
        `Subcategory marked ${!sub.isActive ? "active" : "inactive"}`,
        "success"
      );
      setSubcategories((prev) =>
        prev.map((item) =>
          item.id === sub.id ? { ...item, isActive: !item.isActive } : item
        )
      );
    } catch (err) {
      showToast?.(err.message || "Failed to update status", "error");
    }
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 pb-12"
    >
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#eef5e7] text-[#315d32]">
              <FolderTree className="h-4 w-4" />
            </span>
            <span className="text-[11px] font-black uppercase tracking-wider text-[#315d32]">
              Quick Commerce Hierarchy
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-[#202a20] sm:text-3xl">
            Subcategories
          </h1>
          <p className="mt-1 text-xs text-[#667065] sm:text-sm">
            Organize products within categories for seamless Blinkit-style navigation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#dceacb] bg-white px-3.5 text-xs font-bold text-[#315d32] shadow-sm transition hover:bg-[#f7f8f2] disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#315d32] px-4 text-xs font-bold text-white shadow-[0_8px_20px_rgba(49,93,50,0.2)] transition hover:bg-[#274d29]"
          >
            <Plus className="h-4 w-4" />
            Add Subcategory
          </button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4"
      >
        <div className="rounded-2xl border border-[#dceacb] bg-white p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#667065]">
            Total Subcategories
          </p>
          <p className="mt-1.5 text-2xl font-black text-[#202a20]">
            {subcategories.length}
          </p>
        </div>

        <div className="rounded-2xl border border-[#dceacb] bg-white p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#667065]">
            Active Subcategories
          </p>
          <p className="mt-1.5 text-2xl font-black text-[#315d32]">
            {subcategories.filter((s) => s.isActive).length}
          </p>
        </div>

        <div className="col-span-2 rounded-2xl border border-[#dceacb] bg-white p-4 shadow-sm sm:col-span-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#667065]">
            Linked Categories
          </p>
          <p className="mt-1.5 text-2xl font-black text-[#202a20]">
            {new Set(subcategories.map((s) => s.categoryId)).size}
          </p>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col gap-3 rounded-2xl border border-[#dceacb] bg-white p-4 shadow-sm sm:flex-row sm:items-center"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#92998e]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subcategory by name, slug or category..."
            className="h-10 w-full rounded-xl border border-[#dfe8e1] bg-[#f8faf8] pl-10 pr-3 text-xs font-semibold text-[#202a20] outline-none transition placeholder:text-[#92998e] focus:border-[#315d32] focus:bg-white"
          />
        </div>

        {/* Category selector */}
        <div className="w-full sm:w-48">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-10 w-full rounded-xl border border-[#dfe8e1] bg-[#f8faf8] px-3 text-xs font-semibold text-[#202a20] outline-none transition focus:border-[#315d32] focus:bg-white"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto rounded-xl bg-[#f7f8f2] p-1">
          {FILTERS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatusFilter(key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                statusFilter === key
                  ? "bg-[#315d32] text-white shadow-sm"
                  : "text-[#667065] hover:text-[#202a20]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Subcategory List / Table */}
      <motion.div
        variants={itemVariants}
        className="overflow-hidden rounded-2xl border border-[#dceacb] bg-white shadow-sm"
      >
        {loading ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#315d32]" />
            <p className="text-xs font-semibold text-[#667065]">
              Loading subcategories...
            </p>
          </div>
        ) : filteredSubcategories.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 p-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef5e7] text-[#315d32]">
              <FolderTree className="h-7 w-7" />
            </div>
            <h3 className="text-base font-black text-[#202a20]">
              No subcategories found
            </h3>
            <p className="max-w-md text-xs text-[#667065]">
              {search || categoryFilter !== "all" || statusFilter !== "all"
                ? "Try adjusting your search or filters to find what you are looking for."
                : "Get started by adding your first subcategory linked to a category."}
            </p>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="mt-2 inline-flex h-10 items-center gap-2 rounded-xl bg-[#315d32] px-4 text-xs font-bold text-white shadow-sm transition hover:bg-[#274d29]"
            >
              <Plus className="h-4 w-4" />
              Add First Subcategory
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#edf1e9] bg-[#fdfefd] text-[10px] font-bold uppercase tracking-wider text-[#667065]">
                <tr>
                  <th className="px-4 py-3.5 sm:px-6">Subcategory</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Products</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right sm:px-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf1e9]">
                {filteredSubcategories.map((sub) => {
                  const statusLabel = sub.isActive ? "Active" : "Inactive";
                  return (
                    <tr
                      key={sub.id}
                      className="transition-colors hover:bg-[#fbfdf9]"
                    >
                      <td className="px-4 py-3.5 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#dceacb] bg-[#f7f8f2]">
                            {sub.imageUrl ? (
                              <img
                                src={sub.imageUrl}
                                alt={sub.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <FolderTree className="h-4 w-4 text-[#92998e]" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-bold text-[#202a20]">
                              {sub.name}
                            </p>
                            <p className="truncate text-[10px] text-[#92998e]">
                              /{sub.slug}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#dceacb] bg-[#eef5e7] px-2.5 py-1 text-[11px] font-bold text-[#315d32]">
                          <Tag className="h-3 w-3" />
                          {sub.category?.name || "Unassigned"}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#667065]">
                          <Package className="h-3.5 w-3.5 text-[#92998e]" />
                          {sub._count?.products ?? 0} items
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(sub)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold transition hover:opacity-80 ${STATUS_STYLE[statusLabel]}`}
                          title="Click to toggle status"
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              sub.isActive ? "bg-[#315d32]" : "bg-[#b35a54]"
                            }`}
                          />
                          {statusLabel}
                        </button>
                      </td>

                      <td className="px-4 py-3.5 text-right sm:px-6">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenView(sub)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#667065] transition hover:bg-[#eef5e7] hover:text-[#315d32]"
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(sub)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#667065] transition hover:bg-[#eef5e7] hover:text-[#315d32]"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenDelete(sub)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#667065] transition hover:bg-[#f8ecea] hover:text-[#b35a54]"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-lg overflow-hidden rounded-2xl border border-[#dceacb] bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-[#edf1e9] px-6 py-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#eef5e7] text-[#315d32]">
                    <FolderTree className="h-4 w-4" />
                  </div>
                  <h3 className="text-base font-black text-[#202a20]">
                    {selectedSubcategory
                      ? "Edit Subcategory"
                      : "Add New Subcategory"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[#92998e] transition hover:bg-[#f7f8f2] hover:text-[#202a20]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4 p-6">
                {/* Parent Category */}
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#667065]">
                    Parent Category *
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, categoryId: e.target.value }))
                    }
                    required
                    className={inputClass}
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subcategory Name & Slug */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#667065]">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      required
                      placeholder="e.g. Milk & Cream"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#667065]">
                      Slug
                    </label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, slug: e.target.value }))
                      }
                      placeholder="e.g. milk-cream"
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#667065]">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, description: e.target.value }))
                    }
                    placeholder="Brief description of subcategory items..."
                    className="w-full rounded-xl border border-[#dceacb] bg-[#f7f8f2] p-3 text-xs font-semibold text-[#202a20] outline-none transition placeholder:text-[#92998e] sm:text-sm"
                  />
                </div>

                {/* Image upload */}
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#667065]">
                    Subcategory Image
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#dceacb] bg-[#f7f8f2]">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="preview"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="h-6 w-6 text-[#92998e]" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#dceacb] bg-white px-3 text-xs font-bold text-[#315d32] shadow-sm transition hover:bg-[#f7f8f2]"
                      >
                        <ImagePlus className="h-3.5 w-3.5" />
                        Upload Image
                      </button>
                      <p className="text-[10px] text-[#92998e]">
                        Supports JPG, PNG, WEBP up to 25MB
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status Toggle */}
                <div className="flex items-center justify-between rounded-xl border border-[#dceacb] bg-[#f7f8f2] p-3">
                  <div>
                    <p className="text-xs font-bold text-[#202a20]">
                      Active Status
                    </p>
                    <p className="text-[10px] text-[#92998e]">
                      Visible to customers on the quick commerce website
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, isActive: e.target.checked }))
                    }
                    className="h-5 w-5 accent-[#315d32]"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#edf1e9]">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="h-10 rounded-xl border border-[#dceacb] bg-white px-4 text-xs font-bold text-[#667065] transition hover:bg-[#f7f8f2]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#315d32] px-5 text-xs font-bold text-white shadow-sm transition hover:bg-[#274d29] disabled:opacity-50"
                  >
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    {selectedSubcategory ? "Update Subcategory" : "Create Subcategory"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Modal */}
      <AnimatePresence>
        {viewModalOpen && selectedSubcategory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md overflow-hidden rounded-2xl border border-[#dceacb] bg-white p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-4 border-b border-[#edf1e9]">
                <h3 className="text-base font-black text-[#202a20]">
                  Subcategory Details
                </h3>
                <button
                  type="button"
                  onClick={() => setViewModalOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[#92998e] hover:bg-[#f7f8f2]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#dceacb] bg-[#f7f8f2]">
                    {selectedSubcategory.imageUrl ? (
                      <img
                        src={selectedSubcategory.imageUrl}
                        alt={selectedSubcategory.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <FolderTree className="h-6 w-6 text-[#92998e]" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-base font-black text-[#202a20]">
                      {selectedSubcategory.name}
                    </h4>
                    <p className="text-xs text-[#92998e]">
                      /{selectedSubcategory.slug}
                    </p>
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-[#eef5e7] px-2 py-0.5 text-[10px] font-bold text-[#315d32]">
                      <Tag className="h-2.5 w-2.5" />
                      {selectedSubcategory.category?.name || "Unassigned"}
                    </span>
                  </div>
                </div>

                {selectedSubcategory.description && (
                  <div className="rounded-xl bg-[#f7f8f2] p-3 text-xs text-[#667065]">
                    {selectedSubcategory.description}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-[#dceacb] p-3 text-center">
                    <p className="text-[10px] font-bold uppercase text-[#92998e]">
                      Products Count
                    </p>
                    <p className="mt-1 text-lg font-black text-[#202a20]">
                      {selectedSubcategory._count?.products ?? 0}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#dceacb] p-3 text-center">
                    <p className="text-[10px] font-bold uppercase text-[#92998e]">
                      Status
                    </p>
                    <p
                      className={`mt-1 text-sm font-black ${
                        selectedSubcategory.isActive
                          ? "text-[#315d32]"
                          : "text-[#b35a54]"
                      }`}
                    >
                      {selectedSubcategory.isActive ? "Active" : "Inactive"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setViewModalOpen(false)}
                  className="h-10 rounded-xl bg-[#315d32] px-5 text-xs font-bold text-white transition hover:bg-[#274d29]"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModalOpen && selectedSubcategory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm overflow-hidden rounded-2xl border border-[#efd3d0] bg-white p-6 shadow-2xl"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f8ecea] text-[#b35a54]">
                <Trash2 className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-base font-black text-[#202a20]">
                Delete Subcategory?
              </h3>
              <p className="mt-1 text-xs text-[#667065]">
                Are you sure you want to delete{" "}
                <span className="font-bold text-[#202a20]">
                  "{selectedSubcategory.name}"
                </span>
                ? This action cannot be undone. Products linked to this subcategory
                will retain their parent category.
              </p>
              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(false)}
                  className="h-10 rounded-xl border border-[#dceacb] bg-white px-4 text-xs font-bold text-[#667065] hover:bg-[#f7f8f2]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleDelete}
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#b35a54] px-4 text-xs font-bold text-white transition hover:bg-[#9f4b46] disabled:opacity-50"
                >
                  {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

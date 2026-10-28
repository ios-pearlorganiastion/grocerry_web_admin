import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X, Eye,
  Percent,
  Users,
  Wallet,
  CheckCircle2,
  RotateCcw,
  Pencil,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";


import {
  getAllAffiliates,
  updateAffiliateCommission,
  resetAffiliateCommission,
  getAffiliateById,
} from "../api/Affiliatecommissioncontroller";



const PAGE_LIMIT = 10;

const DEFAULT_META = { total: 0, page: 1, limit: PAGE_LIMIT, totalPages: 1 };

const STATUS_STYLES = {
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  rejected: "bg-red-50 text-red-600 border-red-200",
};

const FALLBACK_STATUS_STYLE = "bg-slate-50 text-slate-600 border-slate-200";

const formatINR = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

// customerName null ho sakta hai -> upiName -> phone
const getDisplayName = (a) =>
  a.customerName || a.upiName || a.customerPhone || "Unknown";

const getInitials = (name) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const getErrorMessage = (err, fallback) =>
  err?.response?.data?.message || err?.message || fallback;

/* ---------------- Animations ---------------- */

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

/* ---------------- Page ---------------- */

export default function AffiliateCommission() {
  // API data
  const [affiliates, setAffiliates] = useState([]);
  const [meta, setMeta] = useState(DEFAULT_META);
  const [page, setPage] = useState(1);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Edit modal (sirf customCommissionRate)
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ customCommissionRate: "" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [viewAffiliate, setViewAffiliate] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewError, setViewError] = useState("");
  const [viewAffiliateId, setViewAffiliateId] = useState(null);
  // Reset
  const [resettingId, setResettingId] = useState(null);
  const [resetAffiliate, setResetAffiliate] = useState(null);
  const fetchAffiliates = useCallback(
    async ({ silent = false } = {}) => {
      try {
        if (!silent) setLoading(true);
        setError("");

        const res = await getAllAffiliates(page, PAGE_LIMIT);

        setAffiliates(res?.data?.items ?? []);
        setMeta(res?.data?.meta ?? { ...DEFAULT_META, page });
      } catch (err) {
        setError(getErrorMessage(err, "Affiliates load nahi ho paye"));
      } finally {
        setLoading(false);
      }
    },
    [page]
  );

  useEffect(() => {
    fetchAffiliates();
  }, [fetchAffiliates]);

  // success notice 3 sec baad hat jaye
  useEffect(() => {
    if (!notice) return undefined;
    const t = setTimeout(() => setNotice(""), 3000);
    return () => clearTimeout(t);
  }, [notice]);

  /* ----- derived data ----- */

  const statusOptions = useMemo(() => {
    const set = new Set(
      affiliates.map((a) => (a.status || "").toLowerCase()).filter(Boolean)
    );
    return ["all", ...Array.from(set)];
  }, [affiliates]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return affiliates.filter((a) => {
      const matchesStatus =
        statusFilter === "all" || (a.status || "").toLowerCase() === statusFilter;

      const matchesSearch =
        !q ||
        getDisplayName(a).toLowerCase().includes(q) ||
        (a.customerPhone || "").toLowerCase().includes(q) ||
        (a.referralCode || "").toLowerCase().includes(q) ||
        (a.upiId || "").toLowerCase().includes(q) ||
        (a.id || "").toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [affiliates, search, statusFilter]);

  const stats = useMemo(() => {
    const lifetimeEarned = affiliates.reduce(
      (sum, a) => sum + (Number(a.balances?.lifetimeEarned) || 0),
      0
    );
    const available = affiliates.reduce(
      (sum, a) => sum + (Number(a.balances?.availableBalance) || 0),
      0
    );
    const avgRate = affiliates.length
      ? affiliates.reduce(
        (sum, a) => sum + (Number(a.effectiveCommissionRate) || 0),
        0
      ) / affiliates.length
      : 0;

    return { lifetimeEarned, available, avgRate };
  }, [affiliates]);

  const editingAffiliate = useMemo(
    () => affiliates.find((a) => a.id === editingId) || null,
    [affiliates, editingId]
  );
  const handleViewAffiliate = async (affiliate) => {

    try {
      setViewAffiliateId(affiliate.id);
      setViewAffiliate(null);
      setViewLoading(true);
      setViewError("");

      const res = await getAffiliateById(affiliate.id);

      // API response structure ke according data adjust karein
      setViewAffiliate(res?.data?.affiliate ?? res?.data ?? res);
    } catch (err) {
      setViewError(
        getErrorMessage(err, "Failed to load affiliate details")
      );
    } finally {
      setViewLoading(false);
    }
  };
  /* ----- edit (PATCH /affiliates/:id/commission) ----- */

  const openEditModal = (affiliate) => {
    setEditingId(affiliate.id);
    setFormError("");
    setEditForm({
      customCommissionRate: affiliate.isCustomRate
        ? affiliate.customCommissionRate
        : affiliate.effectiveCommissionRate,
    });
  };

  const closeEditModal = () => {
    if (saving) return;
    setEditingId(null);
    setFormError("");
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    const value = Number(editForm.customCommissionRate);

    if (
      editForm.customCommissionRate === "" ||
      Number.isNaN(value) ||
      value < 0 ||
      value > 100
    ) {
      setFormError("Rate 0 se 100 ke beech hona chahiye");
      return;
    }

    try {
      setSaving(true);
      setFormError("");

      await updateAffiliateCommission(editingId, value);

      setEditingId(null);
      setNotice("Commission rate updated successfully");
      await fetchAffiliates({ silent: true });
    } catch (err) {
      setFormError(getErrorMessage(err, "Failed to update the commission rate"));
    } finally {
      setSaving(false);
    }
  };

  const handleReset = (affiliate) => {
    setResetAffiliate(affiliate);
  };

  const confirmReset = async () => {
    if (!resetAffiliate) return;

    const affiliate = resetAffiliate;
    setResetAffiliate(null);

    try {
      setResettingId(affiliate.id);
      setError("");

      await resetAffiliateCommission(affiliate.id);

      setNotice("Affiliate commission rate successfully reset to the default rate.");
      await fetchAffiliates({ silent: true });
    } catch (err) {
      setError(
        getErrorMessage(err, "Failed to reset affiliate commission rate.")
      );
    } finally {
      setResettingId(null);
    }
  };

  const STAT_CARDS = [
    {
      label: "Total Affiliates",
      value: String(meta.total ?? affiliates.length),
      icon: Users,
    },
    {
      label: "Lifetime Earned",
      value: formatINR(stats.lifetimeEarned),
      icon: Wallet,
    },
    {
      label: "Available Balance",
      value: formatINR(stats.available),
      icon: CheckCircle2,
    },
    {
      label: "Avg. Rate",
      value: `${stats.avgRate.toFixed(1)}%`,
      icon: Percent,
    },
  ];

  const TABLE_HEADS = [
    "Affiliate",
    "Referral Code",
    "UPI",
    "Channel",
    "Referrals",
    "Earned",
    "Available",
    "Rate",
    "Status",
    "Joined",
    "Actions",
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="min-h-screen bg-[#f7f8f2] p-4 sm:p-6 lg:p-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-6">
        <h1 className="text-xl font-black tracking-tight text-[#202a20]">
          Affiliate Commission
        </h1>
        <p className="mt-0.5 text-[12px] font-medium text-[#667065]">
          Track affiliate commissions and manage custom rates.
        </p>
      </motion.div>

      {/* Notice / Error */}
      <AnimatePresence>
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[12px] font-bold text-emerald-700"
          >
            <CheckCircle2 className="h-4 w-4" />
            {notice}
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mb-4 flex items-center justify-between gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[12px] font-bold text-red-600"
          >
            <span className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </span>
            <button
              onClick={() => fetchAffiliates()}
              className="rounded-lg border border-red-200 bg-white px-2.5 py-1 text-[11px] font-bold text-red-600 transition hover:bg-red-100"
            >
              Retry
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stat cards */}
      <motion.div
        variants={itemVariants}
        className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        {STAT_CARDS.map((card) => {
          const Icon = card.icon;

          return (
            <motion.div
              key={card.label}
              whileHover={{ y: -3 }}
              className="relative overflow-hidden rounded-2xl border border-[#dceacb] bg-white p-4 shadow-[0_5px_18px_rgba(49,93,50,0.04)]"
            >
              <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-[#eef5e7]" />

              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#92998e]">
                    {card.label}
                  </p>
                  <p className="mt-1.5 text-lg font-black text-[#202a20]">
                    {card.value}
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#315d32] text-white">
                  <Icon className="h-[18px] w-[18px]" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Filters */}
      <motion.div
        variants={itemVariants}
        className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#92998e]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, phone, referral code ya UPI search karein..."
            className="w-full rounded-xl border border-[#dceacb] bg-white py-2.5 pl-10 pr-3 text-[12px] font-medium text-[#202a20] outline-none transition focus:border-[#315d32] focus:ring-2 focus:ring-[#315d32]/15"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 rounded-xl border border-[#dceacb] bg-white p-1">
          {statusOptions.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-lg px-3 py-1.5 text-[11px] font-bold capitalize transition ${statusFilter === status
                ? "bg-[#315d32] text-white"
                : "text-[#667065] hover:bg-[#eef5e7] hover:text-[#315d32]"
                }`}
            >
              {status}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        variants={itemVariants}
        className="overflow-hidden rounded-2xl border border-[#dceacb] bg-white shadow-[0_5px_18px_rgba(49,93,50,0.04)]"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-left">
            <thead className="bg-[#eef5e7]">
              <tr>
                {TABLE_HEADS.map((head) => (
                  <th
                    key={head}
                    className="whitespace-nowrap px-4 py-3 text-[9px] font-black uppercase tracking-[0.14em] text-[#315d32]"
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={TABLE_HEADS.length}
                    className="px-4 py-14 text-center"
                  >
                    <div className="flex items-center justify-center gap-2 text-[12px] font-bold text-[#92998e]">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Affiliates load ho rahe hain...
                    </div>
                  </td>
                </tr>
              ) : (
                <AnimatePresence initial={false}>
                  {filtered.map((a) => {
                    const name = getDisplayName(a);
                    const statusKey = (a.status || "").toLowerCase();
                    const isResetting = resettingId === a.id;

                    return (
                      <motion.tr
                        key={a.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="border-t border-[#edf1e9] transition hover:bg-[#f7f8f2]"
                      >
                        {/* Affiliate */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#315d32] text-[10px] font-black text-white">
                              {getInitials(name)}
                            </div>
                            <div>
                              <p className="text-[12px] font-black text-[#202a20]">
                                {name}
                              </p>
                              <p className="text-[9px] font-medium text-[#92998e]">
                                {a.customerPhone || "—"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Referral code */}
                        <td className="px-4 py-3 text-[12px] font-bold tracking-wide text-[#667065]">
                          {a.referralCode || "—"}
                        </td>

                        {/* UPI */}
                        <td className="px-4 py-3">
                          <p className="text-[12px] font-bold text-[#202a20]">
                            {a.upiId || "—"}
                          </p>
                          <p className="text-[9px] font-medium text-[#92998e]">
                            {a.upiName || ""}
                          </p>
                        </td>

                        {/* Channel */}
                        <td className="px-4 py-3">
                          <p className="text-[12px] font-bold text-[#667065]">
                            {a.primaryChannel || "—"}
                          </p>
                          <p className="text-[9px] font-medium text-[#92998e]">
                            {a.audienceSize ? `Audience: ${a.audienceSize}` : ""}
                          </p>
                        </td>

                        {/* Referrals */}
                        <td className="px-4 py-3">
                          <p className="text-[12px] font-bold text-[#202a20]">
                            {a.referredCount ?? 0} referred
                          </p>
                          <p className="text-[9px] font-medium text-[#92998e]">
                            {a.completedOrdersCount ?? 0} orders completed
                          </p>
                        </td>

                        {/* Earned */}
                        <td className="px-4 py-3 text-[12px] font-black text-[#315d32]">
                          {formatINR(a.balances?.lifetimeEarned)}
                        </td>

                        {/* Available */}
                        <td className="px-4 py-3">
                          <p className="text-[12px] font-bold text-[#202a20]">
                            {formatINR(a.balances?.availableBalance)}
                          </p>
                          <p className="text-[9px] font-medium text-[#92998e]">
                            Pending: {formatINR(a.balances?.pendingBalance)}
                          </p>
                        </td>

                        {/* Rate */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[12px] font-bold text-[#667065]">
                              {a.effectiveCommissionRate ?? 0}%
                            </span>
                            {a.isCustomRate && (
                              <span className="rounded-full border border-[#dceacb] bg-[#eef5e7] px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide text-[#315d32]">
                                Custom
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold capitalize ${STATUS_STYLES[statusKey] || FALLBACK_STATUS_STYLE
                              }`}
                          >
                            {statusKey || "—"}
                          </span>
                        </td>

                        {/* Joined */}
                        <td className="whitespace-nowrap px-4 py-3 text-[11px] font-medium text-[#667065]">
                          {a.createdAt
                            ? new Date(a.createdAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                            : "—"}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewAffiliate(a)}
                              disabled={viewLoading || isResetting}
                              className="flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-[11px] font-bold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View
                            </button>
                            <button
                              onClick={() => openEditModal(a)}
                              disabled={isResetting}
                              className="flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-[#dceacb] bg-white px-2.5 py-1.5 text-[11px] font-bold text-[#315d32] transition hover:bg-[#eef5e7] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Edit
                            </button>

                            <button
                              onClick={() => handleReset(a)}
                              disabled={!a.isCustomRate || isResetting}
                              title={
                                a.isCustomRate
                                  ? "Custom rate hata kar default rate par wapas karein"
                                  : "Is affiliate par already default rate lag raha hai"
                              }
                              className="flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] font-bold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-amber-50"
                            >
                              {isResetting ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <RotateCcw className="h-3.5 w-3.5" />
                              )}
                              Reset Affiliate
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              )}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={TABLE_HEADS.length}
                    className="px-4 py-12 text-center text-[12px] font-bold text-[#92998e]"
                  >
                    Koi affiliate nahi mila
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col gap-2 border-t border-[#edf1e9] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] font-bold text-[#92998e]">
            Page {meta.page ?? page} of {meta.totalPages || 1} · Total{" "}
            {meta.total ?? 0} affiliates
          </p>

          <div className="flex gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={loading || page <= 1}
              className="flex items-center gap-1 rounded-lg border border-[#dceacb] bg-white px-3 py-1.5 text-[11px] font-bold text-[#315d32] transition hover:bg-[#eef5e7] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Prev
            </button>

            <button
              onClick={() =>
                setPage((p) => Math.min(meta.totalPages || 1, p + 1))
              }
              disabled={loading || page >= (meta.totalPages || 1)}
              className="flex items-center gap-1 rounded-lg border border-[#dceacb] bg-white px-3 py-1.5 text-[11px] font-bold text-[#315d32] transition hover:bg-[#eef5e7] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* View Affiliate Details Modal */}
      <AnimatePresence>
        {(viewAffiliate || viewLoading || viewError) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            onClick={() => {
              if (!viewLoading) {
                setViewAffiliate(null);
                setViewError("");
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#dceacb] bg-white p-5 shadow-2xl"
            >
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-[#202a20]">
                    Affiliate Details
                  </h2>
                  <p className="text-xs text-[#92998e]">
                    Complete information about this affiliate
                  </p>
                </div>

                <button
                  onClick={() => {
                    if (!viewLoading) {
                      setViewAffiliate(null);
                      setViewError("");
                    }
                  }}
                  disabled={viewLoading}
                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {viewLoading ? (
                <div className="flex items-center justify-center gap-2 py-12 text-sm font-bold text-[#667065]">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading affiliate details...
                </div>
              ) : viewError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
                  {viewError}
                  <button
                    onClick={() => {
                      const affiliate = affiliates.find(
                        (a) => a.id === viewAffiliateId
                      );

                      if (affiliate) handleViewAffiliate(affiliate);
                    }}
                    className="ml-3 underline"
                  >
                    Retry
                  </button>
                </div>
              ) : viewAffiliate ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    ["Affiliate ID", viewAffiliate.id],
                    ["Name", getDisplayName(viewAffiliate)],
                    ["Phone", viewAffiliate.customerPhone],
                    ["Referral Code", viewAffiliate.referralCode],
                    ["UPI ID", viewAffiliate.upiId],
                    ["UPI Name", viewAffiliate.upiName],
                    ["Primary Channel", viewAffiliate.primaryChannel],
                    ["Audience Size", viewAffiliate.audienceSize],
                    ["Total Referrals", viewAffiliate.referredCount],
                    ["Completed Orders", viewAffiliate.completedOrdersCount],
                    ["Lifetime Earned", formatINR(viewAffiliate.balances?.lifetimeEarned)],
                    ["Available Balance", formatINR(viewAffiliate.balances?.availableBalance)],
                    ["Pending Balance", formatINR(viewAffiliate.balances?.pendingBalance)],
                    ["Commission Rate", `${viewAffiliate.effectiveCommissionRate ?? 0}%`],
                    ["Custom Rate", viewAffiliate.isCustomRate ? "Yes" : "No"],
                    ["Custom Commission Rate", viewAffiliate.customCommissionRate != null
                      ? `${viewAffiliate.customCommissionRate}%`
                      : "—"],
                    ["Status", viewAffiliate.status],
                    [
                      "Joined",
                      viewAffiliate.createdAt
                        ? new Date(viewAffiliate.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                        : "—",
                    ],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-xl border border-[#dceacb] bg-[#f7f8f2] p-3"
                    >
                      <p className="mb-1 text-[9px] font-black uppercase tracking-wider text-[#92998e]">
                        {label}
                      </p>
                      <p className="break-words text-sm font-bold text-[#202a20]">
                        {value === null || value === undefined || value === ""
                          ? "—"
                          : String(value)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="mt-5 flex justify-end">
                <button
                  onClick={() => {
                    setViewAffiliate(null);
                    setViewError("");
                  }}
                  disabled={viewLoading}
                  className="rounded-xl bg-[#315d32] px-5 py-2 text-sm font-bold text-white hover:bg-[#2a4f2b]"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Reset Affiliate Confirmation Modal */}
      <AnimatePresence>
        {resetAffiliate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            onClick={() => setResetAffiliate(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl border border-[#dceacb] bg-white p-5 shadow-2xl"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                    <RotateCcw className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="text-base font-black text-[#202a20]">
                      Reset Affiliate Rate
                    </h2>
                    <p className="text-xs text-[#92998e]">
                      Confirm your action
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setResetAffiliate(null)}
                  className="rounded-lg p-1 text-gray-500 hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="mb-5 text-sm leading-6 text-[#667065]">
                Are you sure you want to remove the custom commission rate for{" "}
                <span className="font-bold text-[#202a20]">
                  {getDisplayName(resetAffiliate)}
                </span>{" "}
                and restore the default commission rate?
              </p>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setResetAffiliate(null)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  onClick={confirmReset}
                  className="rounded-xl bg-[#315d32] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#2a4f2b]"
                >
                  Yes, Reset
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingAffiliate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-[#202a20]/40 p-4 backdrop-blur-sm"
            onClick={closeEditModal}
          >
            <motion.form
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              onSubmit={handleEditSubmit}
              className="w-full max-w-sm rounded-2xl border border-[#dceacb] bg-white p-5 shadow-2xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-[15px] font-black text-[#202a20]">
                    Edit Commission Rate
                  </h2>
                  <p className="mt-0.5 text-[11px] font-medium text-[#92998e]">
                    {getDisplayName(editingAffiliate)} ·{" "}
                    {editingAffiliate.referralCode}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeEditModal}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[#92998e] transition hover:bg-[#eef5e7] hover:text-[#315d32]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3">
                <Field label="Custom Commission Rate (%)">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    autoFocus
                    value={editForm.customCommissionRate}
                    onChange={(e) =>
                      setEditForm({ customCommissionRate: e.target.value })
                    }
                    placeholder="8.5"
                    required
                    className="w-full rounded-xl border border-[#dceacb] bg-white px-3 py-2.5 text-[12px] font-semibold text-[#202a20] outline-none transition focus:border-[#315d32] focus:ring-[3px] focus:ring-[#315d32]/15"
                  />
                </Field>

                <div className="flex items-center justify-between rounded-xl border border-[#dceacb] bg-[#eef5e7] px-3 py-2.5">
                  <div className="flex items-center gap-2 text-[11px] font-bold text-[#315d32]">
                    <Percent className="h-4 w-4" />
                    Current Effective Rate
                  </div>
                  <span className="text-[14px] font-black text-[#315d32]">
                    {editingAffiliate.effectiveCommissionRate ?? 0}%
                  </span>
                </div>

                {formError && (
                  <p className="flex items-center gap-1.5 text-[11px] font-bold text-red-600">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {formError}
                  </p>
                )}
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={saving}
                  className="rounded-xl px-4 py-2 text-[12px] font-bold text-[#667065] transition hover:bg-[#eef5e7] disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-[#315d32] px-4 py-2 text-[12px] font-bold text-white shadow-[0_8px_22px_rgba(49,93,50,0.18)] transition hover:bg-[#2a4f2b] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>


    </motion.div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[9px] font-black uppercase tracking-[0.14em] text-[#92998e]">
        {label}
      </span>
      {children}
    </label>
  );
}
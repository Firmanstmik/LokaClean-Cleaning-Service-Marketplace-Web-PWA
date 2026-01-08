/**
 * ADMIN package management with premium UI, advanced animations, and professional effects.
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  CheckCircle2,
  DollarSign,
} from "lucide-react";

import { api } from "../../lib/api";
import { getApiErrorMessage } from "../../lib/apiError";
import { AnimatedCard } from "../../components/AnimatedCard";
import { getPackageGradient } from "../../utils/packageIcon";
import { getPackageImage, getPackageImageAlt } from "../../utils/packageImage";
import { PackageForm } from "../../components/admin/PackageForm";
import type { PaketCleaning } from "../../types/api";

export function AdminPackagesPage() {
  const [items, setItems] = useState<PaketCleaning[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; package: PaketCleaning | null }>({
    show: false,
    package: null
  });

  async function refresh() {
    const resp = await api.get("/admin/packages");
    setItems(resp.data.data.items as PaketCleaning[]);
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const resp = await api.get("/admin/packages");
        if (alive) setItems(resp.data.data.items as PaketCleaning[]);
      } catch (err) {
        if (alive) setError(getApiErrorMessage(err));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const handleCreate = async (formData: FormData) => {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
        await api.post("/admin/packages", formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
        setSuccess("Package created successfully!");
        setShowAddForm(false);
        await refresh();
        setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
        setError(getApiErrorMessage(err));
    } finally {
        setBusy(false);
    }
  };

  const handleUpdate = async (id: number, formData: FormData) => {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
        await api.put(`/admin/packages/${id}`, formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
        setSuccess("Package updated successfully!");
        setEditingId(null);
        await refresh();
        setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
        setError(getApiErrorMessage(err));
    } finally {
        setBusy(false);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Compact Header - Consistent with other pages */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-wrap items-start justify-between gap-3"
      >
        <div>
          <h1 className="flex items-center gap-3 text-2xl sm:text-3xl font-black bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <Package className="h-7 w-7 sm:h-8 sm:w-8 text-indigo-600" />
            </motion.div>
            Cleaning Packages
          </h1>
          <p className="mt-2 text-sm text-slate-600 font-medium">Manage packages and pricing</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-sm font-black text-white shadow-lg transition-all hover:shadow-xl"
        >
          {showAddForm ? (
            <>
              <X className="h-4 w-4" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Add Package
            </>
          )}
        </motion.button>
      </motion.div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex items-center gap-3 rounded-xl border-2 border-red-200 bg-gradient-to-r from-red-50 to-rose-50 p-4 text-sm font-semibold text-red-700 shadow-lg"
          >
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success message */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex items-center gap-3 rounded-xl border-2 border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50 p-4 text-sm font-semibold text-emerald-700 shadow-lg"
          >
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            <span>{success}</span>
            <button
              onClick={() => setSuccess(null)}
              className="ml-auto text-emerald-600 hover:text-emerald-800"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm.show && deleteConfirm.package && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setDeleteConfirm({ show: false, package: null })}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            >
              {/* Warning Icon */}
              <div className="mb-4 flex justify-center">
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 0.5 }}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-red-100 to-rose-100"
                >
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </motion.div>
              </div>

              {/* Title */}
              <h3 className="mb-2 text-center text-xl font-black text-slate-900">
                Hapus Paket?
              </h3>

              {/* Warning Message */}
              <p className="mb-1 text-center text-sm font-semibold text-slate-700">
                Anda yakin ingin menghapus paket:
              </p>
              <p className="mb-4 text-center text-base font-bold text-red-600">
                "{deleteConfirm.package.name}"
              </p>
              <p className="mb-6 text-center text-xs text-slate-600">
                Tindakan ini tidak dapat dibatalkan. Paket akan dihapus secara permanen.
              </p>

              {/* Buttons */}
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setDeleteConfirm({ show: false, package: null })}
                  className="flex-1 rounded-lg border-2 border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-all hover:border-slate-400 hover:bg-slate-50"
                >
                  Batal
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={async () => {
                    const pkg = deleteConfirm.package!;
                    setDeleteConfirm({ show: false, package: null });
                    setBusy(true);
                    setError(null);
                    setSuccess(null);
                    try {
                      await api.delete(`/admin/packages/${pkg.id}`);
                      setSuccess(`Paket "${pkg.name}" berhasil dihapus!`);
                      await refresh();
                      // Auto-hide success message after 3 seconds
                      setTimeout(() => setSuccess(null), 3000);
                    } catch (err) {
                      setError(getApiErrorMessage(err));
                    } finally {
                      setBusy(false);
                    }
                  }}
                  disabled={busy}
                  className="flex-1 rounded-lg bg-gradient-to-r from-red-600 to-rose-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:from-red-700 hover:to-rose-700 hover:shadow-xl disabled:opacity-60"
                >
                  {busy ? (
                    <span className="flex items-center justify-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                      />
                      Menghapus...
                    </span>
                  ) : (
                    "Ya, Hapus"
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Package Card - Only show when showAddForm is true */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <AnimatedCard delay={0} className="card-lombok relative w-full">
              <div className="relative z-10 w-full">
                <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600">
                  <Plus className="h-4 w-4" />
                  Create New Package
                </div>
                <div className="text-base font-bold text-slate-900 mb-4">Add a new cleaning package</div>
                
                <PackageForm 
                    onSubmit={handleCreate}
                    onCancel={() => setShowAddForm(false)}
                    busy={busy}
                    submitLabel="Create Package"
                    loadingLabel="Creating..."
                />
              </div>
            </AnimatedCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Packages List */}
      <div className="space-y-4">
        {loading && items.length === 0 ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="h-48 rounded-2xl bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 animate-shimmer"
              />
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {items.map((p, index) => {
              const isEditing = editingId === p.id;
              return (
                <AnimatedCard
                  key={p.id}
                  delay={index * 0.05}
                  className="card-lombok group relative w-full"
                >
                  <div className="relative z-10 w-full">
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4 w-full">
                      <div className="flex-1 min-w-0 w-full sm:flex-1 sm:min-w-0">
                        <div className="flex items-start gap-2.5 w-full">
                          <motion.div
                            whileHover={{ rotate: [0, -10, 10, 0], scale: 1.05 }}
                            className={`flex h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${getPackageGradient(p.name)} shadow-lg shadow-black/10 overflow-hidden`}
                          >
                            <motion.img
                              src={getPackageImage(p.name, p.image)}
                              alt={getPackageImageAlt(p.name)}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                // Fallback to default image if upload fails
                                const target = e.target as HTMLImageElement;
                                target.src = getPackageImage(p.name);
                              }}
                            />
                          </motion.div>
                          <div className="flex-1 min-w-0">
                            <motion.h3
                              className="text-base sm:text-lg font-black text-slate-900 break-words pr-2"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                            >
                              {p.name}
                            </motion.h3>
                            <p className="mt-1 text-xs sm:text-sm font-medium text-slate-600 leading-relaxed break-words line-clamp-2 pr-2">{p.description}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2 py-1">
                                <DollarSign className="h-3.5 w-3.5 flex-shrink-0 text-emerald-600" />
                                <span className="text-xs sm:text-sm font-bold text-emerald-700 whitespace-nowrap">
                                  Rp {p.price.toLocaleString("id-ID")}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-shrink-0 flex-wrap gap-2 mt-2 sm:mt-0 w-full sm:w-auto">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex items-center gap-1.5 rounded-lg border-2 border-indigo-200 bg-white px-3 py-2 text-xs font-bold text-indigo-700 transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:shadow-sm"
                          onClick={() => {
                            if (isEditing) {
                              setEditingId(null);
                              return;
                            }
                            setEditingId(p.id);
                          }}
                        >
                          {isEditing ? (
                            <>
                              <X className="h-4 w-4" />
                              Cancel
                            </>
                          ) : (
                            <>
                              <Edit2 className="h-4 w-4" />
                              Edit
                            </>
                          )}
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex items-center gap-1.5 rounded-lg border-2 border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-700 transition-all hover:border-red-300 hover:bg-red-50 hover:shadow-sm disabled:opacity-60"
                          disabled={busy}
                          onClick={() => {
                            setDeleteConfirm({ show: true, package: p });
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </motion.button>
                      </div>
                    </div>

                    {/* Edit form */}
                    <AnimatePresence>
                      {isEditing && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 rounded-lg border-2 border-indigo-200 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 p-4"
                        >
                          <div className="mb-3 flex items-center gap-2 text-xs font-bold text-indigo-700">
                            <Edit2 className="h-3.5 w-3.5" />
                            Edit Package
                          </div>
                          
                          <PackageForm 
                            initialValues={p}
                            onSubmit={(data) => handleUpdate(p.id, data)}
                            onCancel={() => setEditingId(null)}
                            busy={busy}
                            submitLabel="Save Changes"
                            loadingLabel="Saving..."
                            isEditing={true}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </AnimatedCard>
              );
            })}
          </AnimatePresence>
        )}

        {/* Empty state */}
        {!loading && items.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-12 text-center"
          >
            <Package className="h-16 w-16 text-slate-300" />
            <p className="mt-4 text-base font-black text-slate-600">No packages yet</p>
            <p className="mt-1 text-sm font-semibold text-slate-500">Create your first cleaning package above</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

import { useMemo, useState } from "react";
import { DollarSign, FileText, ImageIcon, Loader2, Plus, Save, Upload, X } from "lucide-react";

import { toAbsoluteUrl } from "../../lib/urls";
import type { PaketCleaning } from "../../types/api";

interface PackageFormProps {
  initialValues?: Partial<PaketCleaning>;
  onSubmit: (data: FormData) => Promise<void>;
  onCancel: () => void;
  busy: boolean;
  submitLabel?: string;
  loadingLabel?: string;
  isEditing?: boolean;
}

const formatRupiah = (amount: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);

export function PackageForm({
  initialValues,
  onSubmit,
  onCancel,
  busy,
  submitLabel = "Save",
  loadingLabel = "Saving...",
  isEditing = false,
}: PackageFormProps) {
  const [name, setName] = useState(initialValues?.name || "");
  const [description, setDescription] = useState(initialValues?.description || "");

  const initialBasePrice =
    typeof initialValues?.base_price === "number" && initialValues.base_price > 0
      ? String(initialValues.base_price)
      : "";
  const [basePriceInput, setBasePriceInput] = useState(initialBasePrice);
  const [discountPercentage, setDiscountPercentage] = useState<number>(initialValues?.discount_percentage ?? 0);
  const [discountEdition, setDiscountEdition] = useState(initialValues?.discount_edition ?? "");
  const [pricingNote, setPricingNote] = useState(initialValues?.pricing_note ?? "");

  const [image, setImage] = useState<File | null>(null);

  const initialPreview = (() => {
    if (!initialValues?.image) return null;
    const absolute = toAbsoluteUrl(initialValues.image);
    return absolute || initialValues.image;
  })();

  const [imagePreview, setImagePreview] = useState<string | null>(initialPreview);

  const basePrice = useMemo(() => {
    const raw = basePriceInput.trim();
    if (!raw) return 0;
    const num = Number(raw);
    return Number.isFinite(num) && num > 0 ? Math.floor(num) : 0;
  }, [basePriceInput]);

  const resolvedDiscount = useMemo(() => {
    if (basePrice <= 0) return 0;
    const num = Number.isFinite(discountPercentage) ? discountPercentage : 0;
    return Math.max(0, Math.min(100, Math.floor(num)));
  }, [basePrice, discountPercentage]);

  const finalPrice = useMemo(() => {
    if (basePrice <= 0) return 0;
    return Math.max(0, Math.round(basePrice - (basePrice * resolvedDiscount) / 100));
  }, [basePrice, resolvedDiscount]);

  const canSubmit =
    name.trim().length > 0 &&
    description.trim().length > 0 &&
    (basePrice > 0 || pricingNote.trim().length > 0);

  const handleSubmit = async () => {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);

    formData.append("base_price", String(basePrice));
    formData.append("discount_percentage", String(resolvedDiscount));

    formData.append("discount_edition", discountEdition.trim());
    formData.append("pricing_note", pricingNote.trim());

    if (image) {
      formData.append("image", image);
    }

    await onSubmit(formData);
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="block sm:col-span-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-1.5">
          <FileText className="h-3.5 w-3.5 text-slate-500" />
          Package Name
        </div>
        <input
          className="w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Pembersihan Mendalam"
        />
      </label>

      <label className="block sm:col-span-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-1.5">
          <FileText className="h-3.5 w-3.5 text-slate-500" />
          Description
        </div>
        <textarea
          className="w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none resize-none"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what this package includes..."
        />
      </label>

      <label className="block">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-1.5">
          <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
          Original Price
        </div>
        <input
          className="w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
          type="number"
          min={0}
          value={basePriceInput}
          onChange={(e) => setBasePriceInput(e.target.value)}
          placeholder="200000"
        />
      </label>

      <label className="block">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-1.5">
          <FileText className="h-3.5 w-3.5 text-slate-500" />
          Discount (%)
        </div>
        <input
          className="w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none disabled:opacity-60"
          type="number"
          min={0}
          max={100}
          step={1}
          disabled={basePrice <= 0}
          value={resolvedDiscount}
          onChange={(e) => setDiscountPercentage(Number(e.target.value))}
          placeholder="0"
        />
      </label>

      <label className="block">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-1.5">
          <FileText className="h-3.5 w-3.5 text-slate-500" />
          Final Price
        </div>
        <input
          className="w-full rounded-lg border-2 border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900"
          readOnly
          value={basePrice > 0 ? formatRupiah(finalPrice) : ""}
          placeholder="Auto-calculated"
        />
      </label>

      <label className="block">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-1.5">
          <FileText className="h-3.5 w-3.5 text-slate-500" />
          Edisi Discount (Optional)
        </div>
        <input
          className="w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
          value={discountEdition}
          onChange={(e) => setDiscountEdition(e.target.value)}
          placeholder="e.g., Ramadhan, Lebaran, Year End Sale"
        />
      </label>

      <label className="block sm:col-span-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-1.5">
          <FileText className="h-3.5 w-3.5 text-slate-500" />
          Pricing Note (Optional)
        </div>
        <input
          className="w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
          value={pricingNote}
          onChange={(e) => setPricingNote(e.target.value)}
          placeholder="e.g., Price negotiable based on property size"
        />
      </label>

      <label className="block sm:col-span-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-1.5">
          <ImageIcon className="h-3.5 w-3.5 text-slate-500" />
          Package Image (Optional)
        </div>
        <div className="space-y-2">
          {imagePreview ? (
            <div className="relative">
              <label className="block cursor-pointer">
                <div className="relative w-full h-40 overflow-hidden rounded-lg border-2 border-slate-200">
                  <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                    <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-slate-50">
                      klik untuk ubah gambar
                    </span>
                  </div>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setImage(file);
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setImagePreview(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
              <button
                type="button"
                onClick={() => {
                  setImage(null);
                  setImagePreview(null);
                }}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="h-8 w-8 mb-2 text-slate-400" />
                <p className="mb-2 text-sm text-slate-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-slate-500">PNG, JPG, GIF (MAX. 5MB)</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setImage(file);
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setImagePreview(reader.result as string);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </label>
          )}
        </div>
      </label>

      <div className="flex items-end sm:col-span-2 gap-2">
        {isEditing && (
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
          >
            Cancel
          </button>
        )}
        <button
          className="relative flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
          disabled={busy || !canSubmit}
          onClick={handleSubmit}
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {loadingLabel}
              </>
            ) : (
              <>
                {isEditing ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {submitLabel}
              </>
            )}
          </span>
        </button>
      </div>
    </div>
  );
}

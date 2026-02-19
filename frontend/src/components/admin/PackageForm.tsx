import { useState, useEffect } from "react";
import {
  FileText,
  DollarSign,
  ImageIcon,
  Upload,
  X,
  Save,
  Plus,
  Loader2,
} from "lucide-react";
import { simpleTranslate } from "../../utils/translateHelper";
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
  const [nameEn, setNameEn] = useState(initialValues?.name_en || "");
  const [description, setDescription] = useState(initialValues?.description || "");
  const [descriptionEn, setDescriptionEn] = useState(initialValues?.description_en || "");
  const [price, setPrice] = useState<number>(initialValues?.price || 0);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    initialValues?.image
      ? `${import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api"}${initialValues.image}`
      : null
  );

  const [isTranslatingName, setIsTranslatingName] = useState(false);
  const [isTranslatingDesc, setIsTranslatingDesc] = useState(false);

  const handleAutoTranslate = async (text: string, field: "name" | "description") => {
    if (!text) return;
    
    // Only translate if English field is empty
    if (field === "name" && nameEn.trim() !== "") return;
    if (field === "description" && descriptionEn.trim() !== "") return;

    if (field === "name") setIsTranslatingName(true);
    else setIsTranslatingDesc(true);

    try {
      // Use local helper instead of API
      const translated = await simpleTranslate(text, "en");
      
      if (field === "name") setNameEn(translated);
      else setDescriptionEn(translated);
    } catch (e) {
      console.error("Auto-translate failed", e);
    } finally {
      if (field === "name") setIsTranslatingName(false);
      else setIsTranslatingDesc(false);
    }
  };

  const handleSubmit = async () => {
    const formData = new FormData();
    formData.append("name", name);
    if (nameEn) formData.append("name_en", nameEn);
    formData.append("description", description);
    if (descriptionEn) formData.append("description_en", descriptionEn);
    formData.append("price", String(price));
    if (image) {
      formData.append("image", image);
    }
    await onSubmit(formData);
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="block">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-1.5">
          <FileText className="h-3.5 w-3.5 text-slate-500" />
          Package Name (ID)
        </div>
        <input
          className="w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => handleAutoTranslate(name, "name")}
          placeholder="e.g., Pembersihan Mendalam"
        />
      </label>

      <label className="block">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-1.5">
          <FileText className="h-3.5 w-3.5 text-slate-500" />
          Package Name (EN){" "}
          {isTranslatingName ? (
            <span className="flex items-center gap-1 ml-auto text-[10px] text-indigo-500 font-medium">
              <Loader2 className="h-3 w-3 animate-spin" />
              Translating...
            </span>
          ) : (
            <span className="text-[10px] text-slate-400 font-normal ml-auto">
              Auto-translate if empty
            </span>
          )}
        </div>
        <input
          className="w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
          value={nameEn}
          onChange={(e) => setNameEn(e.target.value)}
          placeholder="e.g., Deep Clean Premium"
        />
      </label>

      <label className="block">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-1.5">
          <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
          Price (Rp)
        </div>
        <input
          className="w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
          type="number"
          min={0}
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          placeholder="500000"
        />
      </label>

      <label className="block sm:col-span-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-1.5">
          <FileText className="h-3.5 w-3.5 text-slate-500" />
          Description (ID)
        </div>
        <textarea
          className="w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none resize-none"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={() => handleAutoTranslate(description, "description")}
          placeholder="Describe what this package includes..."
        />
      </label>

      <label className="block sm:col-span-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-1.5">
          <FileText className="h-3.5 w-3.5 text-slate-500" />
          Description (EN){" "}
          {isTranslatingDesc ? (
            <span className="flex items-center gap-1 ml-auto text-[10px] text-indigo-500 font-medium">
              <Loader2 className="h-3 w-3 animate-spin" />
              Translating...
            </span>
          ) : (
            <span className="text-[10px] text-slate-400 font-normal ml-auto">
              Auto-translate if empty
            </span>
          )}
        </div>
        <textarea
          className="w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none resize-none"
          rows={2}
          value={descriptionEn}
          onChange={(e) => setDescriptionEn(e.target.value)}
          placeholder="Description in English..."
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
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg border-2 border-slate-200"
              />
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
          disabled={busy}
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

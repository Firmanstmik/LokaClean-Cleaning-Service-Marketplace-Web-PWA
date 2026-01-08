import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
      <motion.label whileFocus={{ scale: 1.02 }} className="block">
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
      </motion.label>

      <motion.label whileFocus={{ scale: 1.02 }} className="block">
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
      </motion.label>

      <motion.label whileFocus={{ scale: 1.02 }} className="block">
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
      </motion.label>

      <motion.label whileFocus={{ scale: 1.02 }} className="block sm:col-span-2">
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
      </motion.label>

      <motion.label whileFocus={{ scale: 1.02 }} className="block sm:col-span-2">
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
      </motion.label>

      {/* Image Upload */}
      <motion.label whileFocus={{ scale: 1.02 }} className="block sm:col-span-2">
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
      </motion.label>

      <div className="flex items-end sm:col-span-2 gap-2">
        {isEditing && (
            <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onCancel}
            className="flex-1 rounded-lg border-2 border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-all hover:border-slate-400 hover:bg-slate-50"
            >
            Cancel
            </motion.button>
        )}
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className={`group relative flex-1 overflow-hidden rounded-lg bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-60`}
          disabled={busy}
          onClick={handleSubmit}
        >
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{
              x: ["-100%", "200%"],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 1,
              ease: "linear",
            }}
          />
          <span className="relative z-10 flex items-center justify-center gap-2">
            {busy ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                />
                {loadingLabel}
              </>
            ) : (
              <>
                {isEditing ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {submitLabel}
              </>
            )}
          </span>
        </motion.button>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { X, Home, Briefcase, MapPin, Camera, FileText, Star, ShieldCheck } from "lucide-react";
import { t } from "../lib/i18n";

type SaveAddressModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  address: string;
  details: {
    street?: string;
    village?: string;
    district?: string;
    city?: string;
  };
  coordinates: { lat: number; lng: number };
  existingAddresses: any[];
};

export function SaveAddressModal({
  isOpen,
  onClose,
  onSave,
  address,
  details,
  coordinates,
  existingAddresses
}: SaveAddressModalProps) {
  const [label, setLabel] = useState("Home");
  const [customLabel, setCustomLabel] = useState("");
  const [notes, setNotes] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Editable address fields
  const [street, setStreet] = useState(details.street || "");
  const [village, setVillage] = useState(details.village || "");
  const [district, setDistrict] = useState(details.district || "");
  const [city, setCity] = useState(details.city || "");

  // Reset form when opened
  useEffect(() => {
    if (isOpen) {
      // Logic: If no addresses, force Primary. If addresses exist, default to Backup (Primary = false).
      if (existingAddresses.length === 0) {
        setIsPrimary(true);
      } else {
        setIsPrimary(false);
      }
      
      // Reset other fields
      setLabel("Home");
      setCustomLabel("");
      setNotes("");
      setPhotoUrl("");
    }
  }, [isOpen]);

  // Update address fields from props
  useEffect(() => {
    if (isOpen) {
      setStreet(details.street || "");
      setVillage(details.village || "");
      setDistrict(details.district || "");
      setCity(details.city || "");
    }
  }, [isOpen, details]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      if (!address) {
        alert(t("map.saveAddress.failed"));
        setIsSubmitting(false);
        return;
      }
      const finalLabel = label === "Custom" ? customLabel : label;
      await onSave({
        label: finalLabel,
        address,
        street,
        village,
        district,
        city,
        notes,
        gate_photo_url: photoUrl,
        is_primary: isPrimary,
        lat: coordinates.lat,
        lng: coordinates.lng
      });
      onClose();
    } catch (e: any) {
      console.error(e);
      // Show specific error from backend if available, otherwise generic
      const msg = e.response?.data?.message || e.message || t("map.saveAddress.failed");
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const LABELS = ["Home", "Office", "Villa", "Custom"];

  return (
    <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-10 duration-300">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div>
            <h3 className="text-lg font-bold text-slate-800">{t("map.saveAddress.title")}</h3>
            <p className="text-xs text-slate-500">{t("map.saveAddress.addressDetails")}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 bg-slate-50/50">
          
          {/* Address Preview */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex gap-3 items-start">
            <MapPin className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-indigo-800 uppercase tracking-wide mb-1">{t("map.approxAddress")}</p>
              <p className="text-sm text-slate-700 leading-snug">{address}</p>
              <p className="text-[10px] text-slate-500 mt-1 font-mono">
                {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
              </p>
            </div>
          </div>

          {/* Label Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">{t("map.saveAddress.label")}</label>
            <div className="flex flex-wrap gap-2">
              {LABELS.map(l => (
                <button
                  key={l}
                  onClick={() => setLabel(l)}
                  className={`
                    px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 border
                    ${label === l 
                      ? 'bg-slate-800 text-white border-slate-800 shadow-md transform scale-105' 
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'}
                  `}
                >
                  {l === "Home" && <Home className="w-4 h-4" />}
                  {l === "Office" && <Briefcase className="w-4 h-4" />}
                  {l === "Villa" && <Star className="w-4 h-4" />}
                  {l === "Custom" ? t("map.saveAddress.customLabel") : t(`map.saveAddress.labels.${l.toLowerCase()}`)}
                </button>
              ))}
            </div>
            {label === "Custom" && (
              <input
                type="text"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                placeholder={t("map.saveAddress.customLabel")}
                className="mt-3 w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-800 focus:outline-none text-sm"
                autoFocus
              />
            )}
          </div>

          {/* Detailed Address Fields */}
          <div className="space-y-3">
             <div className="grid grid-cols-1 gap-3">
                <div className="grid grid-cols-2 gap-3">
                   <input
                     type="text"
                     value={village}
                     onChange={(e) => setVillage(e.target.value)}
                     placeholder={t("map.saveAddress.villagePlaceholder")}
                     className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm bg-white"
                   />
                   <input
                     type="text"
                     value={district}
                     onChange={(e) => setDistrict(e.target.value)}
                     placeholder={t("map.saveAddress.districtPlaceholder")}
                     className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm bg-white"
                   />
                </div>
             </div>
          </div>

          {/* Notes & Photo */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                {t("map.saveAddress.notes")} <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t("map.saveAddress.notesPlaceholder")}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm min-h-[80px] bg-white resize-none"
                />
                <FileText className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                {t("map.saveAddress.photo")} <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder={t("map.saveAddress.photoPlaceholder")}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm bg-white"
                />
                <Camera className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Primary/Backup Toggle */}
          <div className="bg-slate-100 rounded-xl p-4 flex items-center justify-between">
             <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isPrimary ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 text-slate-500'}`}>
                   {isPrimary ? <Star className="w-5 h-5 fill-amber-600" /> : <ShieldCheck className="w-5 h-5" />}
                </div>
                <div>
                   <p className="text-sm font-bold text-slate-800">
                     {isPrimary ? t("map.saveAddress.primary") : t("map.saveAddress.backup")}
                   </p>
                   <p className="text-xs text-slate-500">
                     {isPrimary ? t("map.saveAddress.primaryDesc") : t("map.saveAddress.backupDesc")}
                   </p>
                </div>
             </div>
             {/* Only allow toggling if we have other addresses. If 0, must be primary. */}
             {existingAddresses.length > 0 && (
               <button
                 onClick={() => setIsPrimary(!isPrimary)}
                 className={`
                   relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none
                   ${isPrimary ? 'bg-indigo-600' : 'bg-slate-300'}
                 `}
               >
                 <span
                   className={`
                     pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                     ${isPrimary ? 'translate-x-5' : 'translate-x-0'}
                   `}
                 />
               </button>
             )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-white flex gap-3 sticky bottom-0 z-10">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl text-slate-700 font-bold hover:bg-slate-50 transition-colors"
          >
            {t("map.saveAddress.cancel")}
          </button>
          <button
            onClick={handleSave}
            disabled={isSubmitting || (!label && !customLabel)}
            className="flex-[2] px-4 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
               <>{t("common.loading")}</>
            ) : (
               <>
                 <Star className="w-4 h-4 fill-white/20" />
                 {t("map.saveAddress.save")}
               </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

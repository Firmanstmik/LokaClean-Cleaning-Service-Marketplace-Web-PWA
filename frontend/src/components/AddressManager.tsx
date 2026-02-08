import { useState, useEffect } from "react";
import { 
  MapPin, Plus, Home, Briefcase, Star, MoreVertical, 
  Trash2, Edit2, CheckCircle2, Navigation, Building2, 
  ArrowLeft, Loader2, Check, Save, AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../lib/api";
import { MapPicker, LatLng } from "./MapPicker";
import { SavedAddress } from "../types/address";
import { t } from "../lib/i18n";

export function AddressManager() {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "map" | "form">("list");
  
  // Form State
  const [tempLocation, setTempLocation] = useState<{lat: number, lng: number, address: string} | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    label: "Home",
    address: "",
    notes: "",
    floor_number: "",
    building_name: "",
    is_primary: false,
    customLabel: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Map Picker State
  const [pickerValue, setPickerValue] = useState<LatLng | null>(null);
  const [tempNotes, setTempNotes] = useState("");
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      const res = await api.get("/address/list");
      setAddresses(res.data.data);
    } catch (e) {
      console.error("Failed to load addresses", e);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddNew = () => {
    setEditingId(null);
    setPickerValue(null); // Start fresh
    setTempNotes("");
    setFormData({
      label: "Home",
      address: "",
      notes: "",
      floor_number: "",
      building_name: "",
      is_primary: addresses.length === 0, // Default to primary if no addresses
      customLabel: ""
    });
    setView("map");
  };

  const handleEdit = (addr: SavedAddress) => {
    setEditingId(addr.id);
    setPickerValue({ lat: addr.latitude, lng: addr.longitude });
    setTempLocation({ lat: addr.latitude, lng: addr.longitude, address: addr.address });
    
    // Determine label type
    const isStandard = ["home", "office", "apartment", "kost"].includes(addr.label.toLowerCase());
    
    setFormData({
      label: isStandard ? addr.label : "Other",
      customLabel: isStandard ? "" : addr.label,
      address: addr.address,
      notes: addr.notes || "",
      floor_number: addr.floor_number || "",
      building_name: addr.building_name || "",
      is_primary: addr.is_primary
    });
    setView("form"); // Skip map for edit, go straight to form (can edit map from form if needed, but let's keep simple)
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus alamat ini?")) return;
    try {
      await api.delete(`/address/${id}`);
      setAddresses(prev => prev.filter(a => a.id !== id));
    } catch (e) {
      alert("Gagal menghapus alamat");
    }
  };

  const handleSetPrimary = async (id: number) => {
    try {
      // Optimistic update
      setAddresses(prev => prev.map(a => ({
        ...a,
        is_primary: a.id === id
      })).sort((a, b) => (a.id === id ? -1 : 1)));

      await api.patch(`/address/${id}/set-primary`);
      loadAddresses(); // Sync to be sure
    } catch (e) {
      alert("Gagal mengatur alamat utama");
      loadAddresses(); // Revert
    }
  };

  const handleMapSave = (data: { lat: number; lng: number; address: string }) => {
    setTempLocation(data);
    setFormData(prev => ({ ...prev, address: data.address, notes: tempNotes }));
    setView("form");
  };

  const handleSubmit = async () => {
    if (!tempLocation) return;
    setIsSubmitting(true);

    const finalLabel = formData.label === "Other" ? formData.customLabel : formData.label;
    
    const payload = {
      label: finalLabel || "Saved Address",
      address: formData.address, // Allow user to edit address text if they want
      lat: tempLocation.lat,
      lng: tempLocation.lng,
      is_primary: formData.is_primary,
      notes: formData.notes,
      floor_number: formData.floor_number,
      building_name: formData.building_name
    };

    try {
      let savedAddress: SavedAddress;
      if (editingId) {
        const res = await api.put(`/address/${editingId}`, payload);
        savedAddress = res.data.data;
      } else {
        const res = await api.post("/address/save", payload);
        savedAddress = res.data.data;
      }

      // Immediate State Update (Optimistic)
      setAddresses(prev => {
        let newList = editingId 
          ? prev.map(a => a.id === editingId ? savedAddress : a)
          : [...prev, savedAddress];
          
        if (savedAddress.is_primary) {
            newList = newList.map(a => a.id === savedAddress.id ? a : { ...a, is_primary: false });
        }
        return newList.sort((a, b) => (a.is_primary === b.is_primary ? 0 : a.is_primary ? -1 : 1));
      });

      setView("list");
      showToast("Alamat berhasil disimpan", "success");
      loadAddresses(); // Background sync
    } catch (e) {
      showToast("Gagal menyimpan alamat", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- RENDERERS ---

  const renderIcon = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes("home") || l.includes("rumah")) return <Home className="w-5 h-5 text-indigo-600" />;
    if (l.includes("office") || l.includes("kantor")) return <Briefcase className="w-5 h-5 text-indigo-600" />;
    return <Star className="w-5 h-5 text-indigo-600" />;
  };

  if (view === "map") {
    return (
      <div className="fixed inset-0 z-[100] bg-white flex flex-col">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3 bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <button onClick={() => setView("list")} className="p-2 -ml-2 hover:bg-slate-100 rounded-full">
            <ArrowLeft className="w-6 h-6 text-slate-700" />
          </button>
          <h2 className="font-bold text-lg text-slate-800">Pilih Lokasi</h2>
        </div>
        <div className="flex-1 relative bg-slate-50 flex flex-col">
           <div className="flex-1 p-4">
             <MapPicker 
               value={pickerValue}
               onChange={setPickerValue}
               onDetailsChange={(d) => setTempNotes(d.notes || "")}
               isOpen={true}
               onSaveRequest={handleMapSave}
               onRefresh={loadAddresses}
               label="Geser pin ke lokasi tepat"
               helperText="Pastikan pin berada tepat di depan lokasi Anda"
               mapHeight="h-[calc(100vh-180px)]"
               savedAddresses={addresses}
             />
           </div>
        </div>
      </div>
    );
  }

  if (view === "form") {
    return (
      <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in slide-in-from-bottom-10 duration-300">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3 bg-white sticky top-0 z-10">
          <button onClick={() => setView(editingId ? "list" : "map")} className="p-2 -ml-2 hover:bg-slate-100 rounded-full">
            <ArrowLeft className="w-6 h-6 text-slate-700" />
          </button>
          <h2 className="font-bold text-lg text-slate-800">{editingId ? "Edit Alamat" : "Detail Alamat"}</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Map Preview (Small) */}
          <div className="aspect-[21/9] rounded-2xl overflow-hidden relative shadow-sm border border-slate-100 bg-slate-100">
             {/* We could render a mini static map or just a placeholder with coordinates */}
             <div className="absolute inset-0 flex items-center justify-center text-slate-400 bg-slate-50">
                <MapPin className="w-6 h-6 mr-2" />
                <span className="text-xs font-mono">{tempLocation?.lat.toFixed(5)}, {tempLocation?.lng.toFixed(5)}</span>
             </div>
             <button 
               onClick={() => { setPickerValue(tempLocation); setView("map"); }}
               className="absolute bottom-2 right-2 px-3 py-1.5 bg-white text-xs font-bold text-indigo-600 rounded-lg shadow-sm border border-slate-200"
             >
               Ubah Posisi
             </button>
          </div>

          {/* Address Text */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Alamat Lengkap</label>
            <textarea 
              value={formData.address}
              onChange={e => setFormData({...formData, address: e.target.value})}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none min-h-[80px]"
            />
          </div>

          {/* Label Selection */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-700">Label</label>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {["Home", "Office", "Kost", "Other"].map(l => (
                <button
                  key={l}
                  onClick={() => setFormData({...formData, label: l})}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                    formData.label === l 
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" 
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
            {formData.label === "Other" && (
               <input 
                 type="text" 
                 placeholder="Contoh: Rumah Nenek, Gudang..."
                 value={formData.customLabel}
                 onChange={e => setFormData({...formData, customLabel: e.target.value})}
                 className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
               />
            )}
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
               <label className="text-sm font-medium text-slate-600">Nomor Lantai <span className="text-slate-400 font-normal">(Opsional)</span></label>
               <input 
                 type="text"
                 value={formData.floor_number}
                 onChange={e => setFormData({...formData, floor_number: e.target.value})}
                 className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition-colors"
                 placeholder="Lantai 1, 2..."
               />
             </div>
             <div className="space-y-2">
               <label className="text-sm font-medium text-slate-600">Nama Gedung <span className="text-slate-400 font-normal">(Opsional)</span></label>
               <input 
                 type="text"
                 value={formData.building_name}
                 onChange={e => setFormData({...formData, building_name: e.target.value})}
                 className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition-colors"
                 placeholder="Tower A..."
               />
             </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">{t("map.saveAddress.notes")} <span className="text-slate-400 font-normal">({t("common.optional")})</span></label>
            <input 
              type="text"
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
              className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition-colors"
              placeholder={t("map.saveAddress.notesPlaceholder")}
            />
          </div>

          {/* Set Primary Toggle */}
          <div className="flex items-center justify-between p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
             <div className="flex gap-3 items-center">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-indigo-600 shadow-sm">
                   <Navigation className="w-5 h-5" />
                </div>
                <div>
                   <div className="text-sm font-bold text-slate-800">Alamat Utama</div>
                   <div className="text-xs text-slate-500">Gunakan sebagai lokasi default</div>
                </div>
             </div>
             <button 
               onClick={() => setFormData(p => ({...p, is_primary: !p.is_primary}))}
               className={`w-12 h-7 rounded-full transition-colors relative ${formData.is_primary ? "bg-indigo-600" : "bg-slate-300"}`}
             >
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${formData.is_primary ? "left-6" : "left-1"}`} />
             </button>
          </div>
        </div>

        <div className="p-5 border-t border-slate-100 bg-white pb-8">
           <button 
             onClick={handleSubmit}
             disabled={isSubmitting}
             className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold rounded-xl shadow-xl shadow-indigo-200 transition-all flex items-center justify-center gap-2"
           >
             {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
             Simpan Alamat
           </button>
        </div>
      </div>
    );
  }

  // --- LIST VIEW ---
  const primaryAddress = addresses.find(a => a.is_primary);
  const otherAddresses = addresses.filter(a => !a.is_primary);

  return (
    <div className="min-h-screen bg-white">
      {/* List Header */}
      <div className="px-5 py-6">
        <h2 className="text-xl font-bold text-slate-900 mb-1">Alamat Tersimpan</h2>
        <p className="text-sm text-slate-500">Kelola lokasi pengantaran Anda</p>
      </div>

      <div className="px-5 space-y-8">
        {loading ? (
           <div className="space-y-4">
             {[1,2].map(i => <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />)}
           </div>
        ) : (
          <>
            {/* Primary Section */}
            <section>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 ml-1">Lokasi Utama</h3>
              {primaryAddress ? (
                <div className="group relative bg-white border border-indigo-100 rounded-3xl p-5 shadow-lg shadow-indigo-100/50 ring-1 ring-indigo-50">
                  <div className="absolute top-4 right-4">
                     <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-lg flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Utama
                     </span>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                       {renderIcon(primaryAddress.label)}
                    </div>
                    <div className="flex-1 pr-16">
                       <h4 className="font-bold text-slate-900 text-lg mb-1">{primaryAddress.label}</h4>
                       <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">{primaryAddress.address}</p>
                       {primaryAddress.notes && (
                         <div className="mt-1 text-xs text-slate-500 font-medium">
                            Catatan: {primaryAddress.notes}
                         </div>
                       )}
                    </div>
                  </div>
                  <div className="mt-5 flex gap-3 border-t border-slate-100 pt-4">
                    <button 
                      onClick={() => handleEdit(primaryAddress)}
                      className="flex-1 py-2 text-sm font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                      Edit Detail
                    </button>
                  </div>
                </div>
              ) : (
                <div onClick={handleAddNew} className="border-2 border-dashed border-slate-200 rounded-3xl p-6 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all cursor-pointer">
                   <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                     <Plus className="w-5 h-5" />
                   </div>
                   <span className="text-sm font-medium">Belum ada lokasi utama</span>
                </div>
              )}
            </section>

            {/* Other Addresses */}
            <section className="pb-24">
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 ml-1">Lokasi Lainnya</h3>
               <div className="space-y-3">
                 {otherAddresses.map(addr => (
                   <div key={addr.id} className="bg-white border border-slate-100 rounded-2xl p-4 flex items-start gap-4 hover:shadow-md transition-all">
                      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-500 shrink-0">
                         {renderIcon(addr.label)}
                      </div>
                      <div className="flex-1 min-w-0">
                         <div className="flex justify-between items-start">
                            <h4 className="font-bold text-slate-800">{addr.label}</h4>
                            <div className="flex gap-1">
                               <button onClick={() => handleEdit(addr)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                 <Edit2 className="w-4 h-4" />
                               </button>
                               <button onClick={() => handleDelete(addr.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                                 <Trash2 className="w-4 h-4" />
                               </button>
                            </div>
                         </div>
                         <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{addr.address}</p>
                         {addr.notes && (
                           <div className="mt-1.5 flex items-start gap-1 bg-slate-50 p-1.5 rounded border border-slate-100/50">
                              <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">{t("map.saveAddress.notes")}:</span>
                              <span className="text-[10px] text-slate-600 italic line-clamp-1">{addr.notes}</span>
                           </div>
                         )}
                         <button 
                           onClick={() => handleSetPrimary(addr.id)}
                           className="mt-3 text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                         >
                           Set sebagai Utama <Navigation className="w-3 h-3" />
                         </button>
                      </div>
                   </div>
                 ))}
                 
                 {primaryAddress && (
                   <button 
                     onClick={handleAddNew}
                     className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center gap-2 text-slate-500 font-bold hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all"
                   >
                      <Plus className="w-5 h-5" />
                      Tambah Alamat Cadangan
                   </button>
                 )}
               </div>
            </section>
          </>
        )}
      </div>
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-xl font-bold text-sm flex items-center gap-2 z-[150] ${
              toast.type === "success" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
            }`}
          >
            {toast.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

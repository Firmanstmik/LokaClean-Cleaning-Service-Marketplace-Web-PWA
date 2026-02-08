import { AddressManager } from "../../components/AddressManager";
import { PageHeaderCard } from "../../components/PageHeaderCard";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export function AddressesPage() {
  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 py-3 flex items-center gap-3">
        <Link to="/profile" className="p-2 -ml-2 rounded-full hover:bg-slate-50 text-slate-700">
           <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-lg font-bold text-slate-800">Daftar Alamat</h1>
      </div>
      
      <AddressManager />
    </div>
  );
}

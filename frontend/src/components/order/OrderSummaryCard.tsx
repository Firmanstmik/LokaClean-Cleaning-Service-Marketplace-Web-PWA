import { MapPin, Calendar, Package } from "lucide-react";
import { formatDateTimeWITA } from "../../utils/date";
import type { Pesanan } from "../../types/api";
import { t } from "../../lib/i18n";

interface OrderSummaryCardProps {
  order: Pesanan;
  packageName: string;
  orderNumber: string;
}

export function OrderSummaryCard({ order, packageName, orderNumber }: OrderSummaryCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'CANCELLED': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return t('orderDetail.statusSteps.waiting');
      case 'IN_PROGRESS': return t('orderDetail.statusSteps.inProgress');
      case 'COMPLETED': return t('orderDetail.statusSteps.completed');
      case 'CANCELLED': return t('orderDetail.statusSteps.cancelled');
      default: return status;
    }
  };

  return (
    <div className="mx-4 bg-white/90 rounded-xl shadow-md border border-white/50 p-5 backdrop-blur-sm">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-500" />
            {packageName}
          </h3>
          <p className="text-xs text-slate-500 mt-1">ID: {orderNumber}</p>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(order.status)}`}>
          {getStatusLabel(order.status)}
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-indigo-50 rounded-full shrink-0">
            <MapPin className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500">{t('orderDetail.location')}</p>
            <p className="text-sm text-slate-700 leading-snug line-clamp-2">{order.address}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="p-2 bg-indigo-50 rounded-full shrink-0">
            <Calendar className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">{t('orderDetail.scheduleTime')}</p>
            <p className="text-sm text-slate-700">{formatDateTimeWITA(order.scheduled_date)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

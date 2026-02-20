import { MapPin, Calendar, Package, Receipt } from "lucide-react";
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
    <div className="mx-4 rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <Package className="h-4 w-4" />
            </div>
            <h3 className="text-[15px] font-semibold leading-snug text-slate-900">
              {packageName}
            </h3>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            {t("orderDetail.scheduled")}: {formatDateTimeWITA(order.scheduled_date)}
          </p>
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${getStatusColor(order.status)}`}>
          {getStatusLabel(order.status)}
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="shrink-0 rounded-full bg-indigo-50 p-2">
            <MapPin className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500">{t("orderDetail.location")}</p>
            <p className="line-clamp-2 text-sm leading-snug text-slate-700">{order.address}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="shrink-0 rounded-full bg-indigo-50 p-2">
            <Calendar className="h-4 w-4 text-indigo-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">{t("orderDetail.scheduleTime")}</p>
            <p className="text-sm text-slate-700">{formatDateTimeWITA(order.scheduled_date)}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="shrink-0 rounded-full bg-slate-50 p-2">
            <Receipt className="h-4 w-4 text-slate-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">{t("orderDetail.orderNumber")}</p>
            <p className="text-sm font-medium text-slate-800">{orderNumber}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

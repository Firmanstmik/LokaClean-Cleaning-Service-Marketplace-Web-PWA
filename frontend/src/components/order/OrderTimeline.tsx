import { Check } from "lucide-react";
import { t } from "../../lib/i18n";

interface OrderTimelineProps {
  status: string;
}

export function OrderTimeline({ status }: OrderTimelineProps) {
  const steps = [
    { id: 'PENDING', label: t('orderDetail.statusSteps.created') },
    { id: 'PROCESSING', label: t('orderDetail.statusSteps.confirmed') }, 
    { id: 'IN_PROGRESS', label: t('orderDetail.statusSteps.cleanerOnWay') },
    { id: 'COMPLETED', label: t('orderDetail.statusSteps.completed') },
  ];

  const getCurrentStepIndex = () => {
    if (status === 'CANCELLED') return 0;
    
    // Map status to step index
    // If PENDING, index 0
    // If PROCESSING (or PAID but not yet IN_PROGRESS), index 1
    // If IN_PROGRESS, index 2
    // If COMPLETED, index 3
    
    const index = steps.findIndex(s => s.id === status);
    
    // Special handling if status doesn't match exactly (e.g. PAID)
    if (index === -1) {
        if (status === 'PAID') return 1; // Treat PAID as confirmed
        return 0;
    }
    return index;
  };

  const currentIndex = getCurrentStepIndex();

  return (
    <div className="mx-4 mt-2 rounded-2xl border border-slate-100 bg-white px-4 py-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {t('orderDetail.orderStatus')}
      </h3>
      <div className="mt-4">
        <div className="relative">
          <div className="absolute left-4 right-4 top-4 h-0.5 bg-slate-100" />
          <div className="relative flex items-start justify-between">
            {steps.map((step, idx) => {
              const isCompleted = idx <= currentIndex;
              const isCurrent = idx === currentIndex;

              return (
                <div key={step.id} className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold ${
                      isCompleted
                        ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm shadow-emerald-200'
                        : 'border-slate-200 bg-white text-slate-300'
                    }`}
                  >
                    {isCompleted ? <Check className="h-4 w-4" /> : <div className="h-2 w-2 rounded-full bg-slate-200" />}
                  </div>
                  <p
                    className={`text-[10px] leading-tight ${
                      isCurrent ? 'font-semibold text-slate-800' : 'font-medium text-slate-500'
                    }`}
                  >
                    {step.label}
                  </p>
                  {isCurrent && status !== 'COMPLETED' && (
                    <p className="text-[10px] font-medium text-emerald-600">
                      {t('orderDetail.working')}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

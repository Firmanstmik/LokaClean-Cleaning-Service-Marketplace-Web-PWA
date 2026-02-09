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
    <div className="px-6 py-6">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">{t('orderDetail.statusTitle')}</h3>
      <div className="relative pl-2">
        {/* Vertical Line */}
        <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-slate-100" />
        
        <div className="space-y-6">
          {steps.map((step, idx) => {
            const isCompleted = idx <= currentIndex;
            const isCurrent = idx === currentIndex;
            
            return (
              <div key={step.id} className="relative flex items-center gap-4">
                <div className={`
                  relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 
                  ${isCompleted 
                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-200' 
                    : 'bg-white border-slate-200 text-slate-300'}
                  transition-all duration-300
                `}>
                  {isCompleted ? <Check className="w-4 h-4" /> : <div className="w-2 h-2 rounded-full bg-slate-200" />}
                </div>
                <div className={`${isCurrent ? 'opacity-100' : 'opacity-60'} transition-opacity flex-1`}>
                  <p className={`text-sm ${isCurrent ? 'font-bold text-slate-800' : 'font-medium text-slate-600'}`}>
                    {step.label}
                  </p>
                  {isCurrent && status !== 'COMPLETED' && (
                    <p className="text-xs text-emerald-600 animate-pulse font-medium mt-0.5">{t('orderDetail.working')}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

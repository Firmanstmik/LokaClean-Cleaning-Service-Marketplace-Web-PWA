import { Camera, Image as ImageIcon, Upload } from "lucide-react";
import { motion } from "framer-motion";
import { t } from "../../lib/i18n";

interface BeforeAfterPhotosProps {
  beforePhotos: string[];
  afterPhotos: string[];
  onUploadClick: () => void;
  canUpload: boolean;
  afterPhotoPreviews?: string[];
}

export function BeforeAfterPhotos({ beforePhotos, afterPhotos, onUploadClick, canUpload, afterPhotoPreviews = [] }: BeforeAfterPhotosProps) {
  // Use previews if available, otherwise use URLs (for existing photos)
  const displayAfterPhoto = afterPhotoPreviews.length > 0 ? afterPhotoPreviews[0] : (afterPhotos.length > 0 ? afterPhotos[0] : null);

  return (
    <div className="px-4 py-4 space-y-4">
      <h3 className="text-sm font-semibold text-slate-900 px-2">{t('orderDetail.documentation')}</h3>
      
      <div className="grid grid-cols-2 gap-3">
        {/* Before Photo Card */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500 text-center">{t('orderDetail.beforePhoto')}</p>
          <div className="aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm relative group">
            {beforePhotos.length > 0 ? (
              <img 
                src={beforePhotos[0]} 
                alt="Before" 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 p-2 text-center">
                <ImageIcon className="w-6 h-6 mb-1" />
                <span className="text-[10px]">{t('orderDetail.noPhoto')}</span>
              </div>
            )}
          </div>
        </div>

        {/* After Photo Card */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500 text-center">{t('orderDetail.afterPhoto')}</p>
          <div 
            className={`aspect-square rounded-xl overflow-hidden border shadow-sm relative transition-all group
              ${displayAfterPhoto
                ? 'bg-slate-100 border-slate-200' 
                : 'bg-emerald-50 border-emerald-200 border-dashed cursor-pointer hover:bg-emerald-100'}
            `}
            onClick={!displayAfterPhoto && canUpload ? onUploadClick : undefined}
          >
            {displayAfterPhoto ? (
              <img 
                src={displayAfterPhoto} 
                alt="After" 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-emerald-600 p-2 text-center">
                {canUpload ? (
                  <>
                    <Upload className="w-6 h-6 mb-1" />
                    <span className="text-[10px] font-bold">{t('orderDetail.uploadResult')}</span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-6 h-6 mb-1 text-slate-400" />
                    <span className="text-[10px] text-slate-400">{t('orderDetail.notAvailable')}</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {canUpload && !displayAfterPhoto && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onUploadClick}
          className="w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold shadow-md shadow-emerald-200 flex items-center justify-center gap-2 mt-2"
        >
          <Camera className="w-4 h-4" />
          {t('orderDetail.uploadCleaningResult')}
        </motion.button>
      )}
    </div>
  );
}

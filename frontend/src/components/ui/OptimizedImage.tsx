import React, { useState, useEffect } from 'react';
import { ImageOff } from 'lucide-react';

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className,
  fallbackSrc = '/img/packages/clean.png', // Default fallback
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  useEffect(() => {
    // Reset state when src changes
    setIsLoading(true);
    setError(false);
    setCurrentSrc(src);
    
    // Preload image
    const img = new Image();
    img.src = src;
    
    img.onload = () => {
      setIsLoading(false);
    };
    
    img.onerror = () => {
      setError(true);
      setIsLoading(false);
    };

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  if (error) {
    return (
      <div className={cn("flex items-center justify-center bg-gray-100 text-gray-400", className)}>
        {fallbackSrc ? (
           <img 
             src={fallbackSrc} 
             alt={alt} 
             className={cn("w-full h-full object-cover", className)}
           />
        ) : (
          <ImageOff className="w-8 h-8" />
        )}
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden bg-gray-200", className)}>
      {/* Blur Placeholder / Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 animate-pulse z-10">
           {/* Optional: Add a small spinner or just keep the pulse effect */}
        </div>
      )}

      <img
        src={currentSrc}
        alt={alt}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-500",
          isLoading ? "opacity-0" : "opacity-100"
        )}
        {...props}
      />
    </div>
  );
};

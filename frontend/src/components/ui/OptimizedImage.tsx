import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  priority?: boolean;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className,
  fallbackSrc = '/img/packages/clean.png', // Default fallback
  priority = false,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(!priority); // If priority, don't show loading state initially to prevent flash
  const [error, setError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setError(true);
    setIsLoading(false);
  };

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
    <div className={cn("relative overflow-hidden bg-gray-100", className)}>
      {/* Loading Skeleton */}
      {isLoading && !priority && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse z-10" />
      )}

      <img
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        // @ts-ignore - fetchPriority is standard but missing in React types currently
        fetchPriority={priority ? "high" : "auto"}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          "w-full h-full object-cover",
          // Only fade in if not priority. Priority images should show immediately.
          !priority && "transition-opacity duration-300",
          isLoading && !priority ? "opacity-0" : "opacity-100"
        )}
        {...props}
      />
    </div>
  );
};

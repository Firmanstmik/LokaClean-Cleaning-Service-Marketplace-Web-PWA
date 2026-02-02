import { motion } from "framer-motion";

interface CircularLoaderProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function CircularLoader({ size = "md", className = "" }: CircularLoaderProps) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-6 w-6 border-[3px]",
    lg: "h-10 w-10 border-4",
    xl: "h-16 w-16 border-[5px]",
  };

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <motion.div
        className={`${sizeClasses[size]} rounded-full border-slate-200/30 border-t-tropical-500 border-r-ocean-500 border-b-purple-500 border-l-tropical-300`}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear",
        }}
        style={{ willChange: "transform" }}
      />
    </div>
  );
}

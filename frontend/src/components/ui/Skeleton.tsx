import type { ReactNode } from "react";

interface SkeletonProps {
  className?: string;
  children?: ReactNode;
}

export function Skeleton({ className, children }: SkeletonProps) {
  const merged = className ? "skeleton-base " + className : "skeleton-base";
  return <div className={merged}>{children}</div>;
}

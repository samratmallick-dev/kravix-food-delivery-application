import { memo } from "react";
import type { CSSProperties } from "react";

const Bone = ({ className = "", style }: { className?: string; style?: CSSProperties }) => (
  <div className={`shimmer-bg rounded-xl ${className}`} style={style} />
);

export const DashboardSkeleton = memo(() => (
  <div className="space-y-4 p-4 rider-page-enter">
    <div className="bg-white rounded-2xl p-5 space-y-3">
      <div className="flex items-center gap-4">
        <Bone className="w-16 h-16 rounded-full" />
        <div className="flex-1 space-y-2">
          <Bone className="h-4 w-32" />
          <Bone className="h-3 w-20" />
        </div>
      </div>
      <Bone className="h-12 w-full" />
    </div>
    <div className="grid grid-cols-2 gap-3">
      {[...Array(4)].map((_, i) => <Bone key={i} className="h-24" />)}
    </div>
    <Bone className="h-40 w-full" />
  </div>
));

export const OrdersSkeleton = memo(() => (
  <div className="space-y-3 p-4 rider-page-enter">
    <Bone className="h-10 w-full" />
    {[...Array(4)].map((_, i) => (
      <div key={i} className="bg-white rounded-2xl p-4 space-y-2">
        <div className="flex justify-between">
          <Bone className="h-4 w-28" />
          <Bone className="h-4 w-16" />
        </div>
        <Bone className="h-3 w-40" />
        <Bone className="h-3 w-24" />
      </div>
    ))}
  </div>
));

export const EarningsSkeleton = memo(() => (
  <div className="space-y-4 p-4 rider-page-enter">
    <div className="grid grid-cols-2 gap-3">
      {[...Array(4)].map((_, i) => <Bone key={i} className="h-24" />)}
    </div>
    <Bone className="h-48 w-full" />
    <Bone className="h-32 w-full" />
  </div>
));

export const ProfileSkeleton = memo(() => (
  <div className="space-y-4 p-4 rider-page-enter">
    <div className="bg-white rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-4">
        <Bone className="w-20 h-20 rounded-full" />
        <div className="flex-1 space-y-2">
          <Bone className="h-5 w-36" />
          <Bone className="h-3 w-24" />
        </div>
      </div>
      {[...Array(4)].map((_, i) => <Bone key={i} className="h-12 w-full" />)}
    </div>
  </div>
));

export const MapSkeleton = memo(() => (
  <div className="shimmer-bg rounded-2xl w-full h-64 border-2 border-gray-100" />
));

export const ChartSkeleton = memo(() => (
  <div className="bg-white rounded-2xl p-5 space-y-3">
    <Bone className="h-4 w-32" />
    <div className="flex items-end gap-2 h-24">
      {[60, 40, 80, 30, 70, 50, 90].map((h, i) => (
        <Bone key={i} className="flex-1 rounded-t-md" style={{ height: `${h}%` } as any} />
      ))}
    </div>
  </div>
));

DashboardSkeleton.displayName = "DashboardSkeleton";
OrdersSkeleton.displayName = "OrdersSkeleton";
EarningsSkeleton.displayName = "EarningsSkeleton";
ProfileSkeleton.displayName = "ProfileSkeleton";
MapSkeleton.displayName = "MapSkeleton";
ChartSkeleton.displayName = "ChartSkeleton";

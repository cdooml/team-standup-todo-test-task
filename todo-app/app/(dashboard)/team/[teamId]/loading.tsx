import { LoadingSkeleton } from "@/components/loading-skeleton";

export default function Loading() {
  return (
    <div>
      <div className="mb-6 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64" />
      </div>
      <LoadingSkeleton />
    </div>
  );
}

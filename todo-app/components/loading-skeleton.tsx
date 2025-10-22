export function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
      {[1, 2, 3].map((col) => (
        <div
          key={col}
          className="rounded-lg border-2 p-4 bg-gray-50 dark:bg-gray-900"
        >
          <div className="mb-4">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((task) => (
              <div
                key={task}
                className="bg-white dark:bg-gray-800 rounded-lg p-3 border"
              >
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

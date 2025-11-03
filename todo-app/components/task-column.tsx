"use client";

import { useDroppable } from "@dnd-kit/core";
import { TaskCard } from "@/components/task-card";
import type { Database } from "@/types/database.types";

type Task = Database["public"]["Tables"]["tasks"]["Row"] & {
  user: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
};

const colorClasses = {
  blue: "border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20",
  green:
    "border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20",
  red: "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20",
};

const headerColorClasses = {
  blue: "text-blue-700 dark:text-blue-400",
  green: "text-green-700 dark:text-green-400",
  red: "text-red-700 dark:text-red-400",
};

export function TaskColumn({
  id,
  title,
  description,
  tasks,
  teamId,
  userId,
  color,
  onOptimisticDelete,
}: {
  id: string;
  title: string;
  description: string;
  tasks: Task[];
  teamId: string;
  userId: string;
  color: "blue" | "green" | "red";
  onOptimisticDelete?: (taskId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg border-2 p-4 transition-colors ${
        colorClasses[color]
      } ${
        isOver
          ? "border-dashed border-gray-400 dark:border-gray-600 ring-2 ring-gray-300 dark:ring-gray-700"
          : ""
      }`}
    >
      <div className="mb-4">
        <h3 className={`text-lg font-semibold ${headerColorClasses[color]}`}>
          {title}
        </h3>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          {description}
        </p>
        <div className="text-xs text-gray-500 mt-1">{tasks.length} tasks</div>
      </div>

      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-400 dark:text-gray-600">
            No tasks yet
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              teamId={teamId}
              userId={userId}
              onOptimisticDelete={onOptimisticDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}

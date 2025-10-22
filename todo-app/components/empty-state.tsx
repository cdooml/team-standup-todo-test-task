import { Plus, Users, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";

type EmptyStateProps = {
  type: "no-tasks" | "no-teams" | "column-empty";
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
};

const icons = {
  "no-tasks": Inbox,
  "no-teams": Users,
  "column-empty": Inbox,
};

export function EmptyState({
  type,
  title,
  description,
  action,
}: EmptyStateProps) {
  const Icon = icons[type];

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-6 mb-4">
        <Icon className="h-12 w-12 text-gray-400 dark:text-gray-600" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 max-w-sm">
        {description}
      </p>
      {action && (
        <Button onClick={action.onClick} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          {action.label}
        </Button>
      )}
    </div>
  );
}

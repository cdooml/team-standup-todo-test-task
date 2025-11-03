"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, ChevronDown } from "lucide-react";
import { createTask } from "@/actions/tasks";
import { nanoid } from "nanoid";
import type { Database } from "@/types/database.types";

type Section = "yesterday" | "today" | "blockers";

type Task = Database["public"]["Tables"]["tasks"]["Row"] & {
  user: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
};

const sections: { value: Section; label: string }[] = [
  { value: "yesterday", label: "Yesterday" },
  { value: "today", label: "Today" },
  { value: "blockers", label: "Blockers" },
];

export function TaskForm({
  teamId,
  userId,
  currentUser,
  onOptimisticAdd,
}: {
  teamId: string;
  userId: string;
  currentUser: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
  onOptimisticAdd?: (task: Task) => void;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [section, setSection] = useState<Section>("today");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        !isAdding &&
        document.activeElement?.tagName !== "INPUT"
      ) {
        e.preventDefault();
        setIsAdding(true);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isAdding]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);

    // Create optimistic task with temporary ID
    const tempId = `temp-${nanoid()}`;
    const now = new Date().toISOString();
    const optimisticTask: Task = {
      id: tempId,
      team_id: teamId,
      user_id: userId,
      title: title.trim(),
      description: null,
      section,
      status: "pending",
      position: 0,
      created_at: now,
      updated_at: now,
      user: currentUser,
    };

    // Optimistic update - show task immediately
    onOptimisticAdd?.(optimisticTask);

    // Reset form immediately for better UX
    setTitle("");
    setIsAdding(false);
    setSection("today");

    // Server update
    const result = await createTask({
      team_id: teamId,
      user_id: userId,
      title: optimisticTask.title,
      section,
      status: "pending",
      position: 0,
    });

    setLoading(false);

    // If there's an error, the realtime sync will handle removing the optimistic task
    // and showing the actual one from the server
  };

  const handleCancel = () => {
    setTitle("");
    setIsAdding(false);
  };

  if (!isAdding) {
    return (
      <Button onClick={() => setIsAdding(true)} className="gap-2">
        <Plus className="h-4 w-4" />
        Add task
        <span className="text-xs opacity-60 ml-1">(Press /)</span>
      </Button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 w-full max-w-2xl"
    >
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What needs to be done?"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Escape") handleCancel();
        }}
        className="flex-1"
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="gap-2">
            {sections.find((s) => s.value === section)?.label}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {sections.map((s) => (
            <DropdownMenuItem key={s.value} onClick={() => setSection(s.value)}>
              {s.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button type="submit" disabled={loading || !title.trim()}>
        {loading ? "Adding..." : "Add"}
      </Button>
      <Button type="button" variant="ghost" onClick={handleCancel}>
        Cancel
      </Button>
    </form>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useDraggable } from "@dnd-kit/core";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, GripVertical } from "lucide-react";
import { updateTask, deleteTask } from "@/actions/tasks";
import type { Database } from "@/types/database.types";

type Task = Database["public"]["Tables"]["tasks"]["Row"] & {
  user: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
};

export function TaskCard({
  task,
  teamId,
  userId,
  isDragging = false,
}: {
  task: Task;
  teamId: string;
  userId: string;
  isDragging?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCheckAnimation, setShowCheckAnimation] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging: isCurrentlyDragging,
  } = useDraggable({
    id: task.id,
  });

  useEffect(() => {
    if (task.status === "done") {
      const timer = setTimeout(() => {
        setShowCheckAnimation(true);
        setTimeout(() => setShowCheckAnimation(false), 1000);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [task.status]);

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const handleSave = async () => {
    if (title.trim() && title !== task.title) {
      await updateTask(task.id, { title: title.trim() });
    }
    setEditing(false);
  };

  const handleToggleStatus = async () => {
    const newStatus = task.status === "done" ? "pending" : "done";
    await updateTask(task.id, { status: newStatus });
  };

  const handleDelete = async () => {
    if (confirm("Delete this task?")) {
      setIsDeleting(true);
      await deleteTask(task.id, teamId);
    }
  };

  const userInitials = task.user.full_name
    ? task.user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : task.user.email.slice(0, 2).toUpperCase();

  const isOwner = task.user_id === userId;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`group hover:shadow-md transition-all duration-200 ${
        isCurrentlyDragging || isDragging ? "opacity-50 scale-105" : ""
      } ${task.status === "done" ? "opacity-60" : ""} ${
        isDeleting ? "opacity-0 scale-95" : ""
      } ${showCheckAnimation ? "ring-2 ring-green-500" : ""}`}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <button
            {...listeners}
            {...attributes}
            className="cursor-grab active:cursor-grabbing touch-none text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mt-1"
          >
            <GripVertical className="h-4 w-4" />
          </button>

          <Checkbox
            checked={task.status === "done"}
            onCheckedChange={handleToggleStatus}
            className="mt-1"
          />

          <div className="flex-1 min-w-0">
            {editing ? (
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleSave}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                  if (e.key === "Escape") {
                    setTitle(task.title);
                    setEditing(false);
                  }
                }}
                autoFocus
                className="h-7 text-sm"
              />
            ) : (
              <p
                onClick={() => isOwner && setEditing(true)}
                className={`text-sm cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 ${
                  task.status === "done" ? "line-through" : ""
                }`}
              >
                {task.title}
              </p>
            )}
            {task.description && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {task.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs bg-blue-600 text-white">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            {isOwner && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleDelete}
              >
                <Trash2 className="h-3 w-3 text-red-500" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

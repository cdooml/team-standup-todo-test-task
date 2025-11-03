"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { TaskColumn } from "@/components/task-column";
import { TaskCard } from "@/components/task-card";
import { TaskForm } from "@/components/task-form";
import { PresenceIndicator } from "@/components/presence-indicator";
import { useRealtimeTasks } from "@/lib/hooks/use-realtime-tasks";
import { useRealtimeMembers } from "@/lib/hooks/use-realtime-members";
import { usePresence } from "@/lib/hooks/use-presence";
import { moveTask } from "@/actions/tasks";
import type { Database } from "@/types/database.types";

type Task = Database["public"]["Tables"]["tasks"]["Row"] & {
  user: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
};

type Member = {
  id: string;
  role: string;
  joined_at: string;
  user: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
};

type Section = "yesterday" | "today" | "blockers";

export function StandupBoard({
  teamId,
  userId,
  initialTasks,
  members: initialMembers,
}: {
  teamId: string;
  userId: string;
  initialTasks: Task[];
  members: Member[];
}) {
  const tasks = useRealtimeTasks(teamId, initialTasks);
  const members = useRealtimeMembers(teamId, initialMembers);
  const onlineUsers = usePresence(teamId, userId);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [optimisticTasks, setOptimisticTasks] = useState<Task[]>([]);

  // Get current user data for optimistic updates
  const currentUser = members.find((m) => m.user.id === userId)?.user || {
    id: userId,
    full_name: "You",
    email: "",
    avatar_url: null,
  };

  useEffect(() => {
    setOptimisticTasks(tasks);
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = optimisticTasks.find((t) => t.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const newSection = over.id as Section;
    const task = optimisticTasks.find((t) => t.id === taskId);

    if (!task || task.section === newSection) return;

    // Optimistic update
    setOptimisticTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, section: newSection } : t))
    );

    // Server update
    const result = await moveTask(taskId, newSection, 0, teamId);

    if (result.error) {
      // Revert on error
      setOptimisticTasks(tasks);
    }
  };

  const handleOptimisticAdd = (task: Task) => {
    setOptimisticTasks((prev) => [...prev, task]);
  };

  const handleOptimisticDelete = (taskId: string) => {
    setOptimisticTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const yesterdayTasks = optimisticTasks.filter(
    (t) => t.section === "yesterday"
  );
  const todayTasks = optimisticTasks.filter((t) => t.section === "today");
  const blockerTasks = optimisticTasks.filter((t) => t.section === "blockers");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <TaskForm
          teamId={teamId}
          userId={userId}
          currentUser={currentUser}
          onOptimisticAdd={handleOptimisticAdd}
        />
        <PresenceIndicator members={members} onlineUserIds={onlineUsers} />
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <TaskColumn
            id="yesterday"
            title="Yesterday"
            description="What you accomplished"
            tasks={yesterdayTasks}
            teamId={teamId}
            userId={userId}
            color="blue"
            onOptimisticDelete={handleOptimisticDelete}
          />
          <TaskColumn
            id="today"
            title="Today"
            description="What you're working on"
            tasks={todayTasks}
            teamId={teamId}
            userId={userId}
            color="green"
            onOptimisticDelete={handleOptimisticDelete}
          />
          <TaskColumn
            id="blockers"
            title="Blockers"
            description="What's blocking you"
            tasks={blockerTasks}
            teamId={teamId}
            userId={userId}
            color="red"
            onOptimisticDelete={handleOptimisticDelete}
          />
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="rotate-3 opacity-80">
              <TaskCard
                task={activeTask}
                teamId={teamId}
                userId={userId}
                isDragging
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

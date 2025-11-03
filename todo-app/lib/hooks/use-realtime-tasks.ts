"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database.types";
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";

type Task = Database["public"]["Tables"]["tasks"]["Row"] & {
  user: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
};

export function useRealtimeTasks(teamId: string, initialTasks: Task[]) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  // Sync with initialTasks when they change
  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  useEffect(() => {
    const supabase = createClient();
    // Set up realtime subscription
    const channel: RealtimeChannel = supabase
      .channel(`tasks:${teamId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "tasks",
          filter: `team_id=eq.${teamId}`,
        },
        async (
          payload: RealtimePostgresChangesPayload<
            Database["public"]["Tables"]["tasks"]["Row"]
          >
        ) => {
          // Fetch the full task with user data
          const newRow =
            payload.new as Database["public"]["Tables"]["tasks"]["Row"];
          const { data: newTask } = await supabase
            .from("tasks")
            .select(
              `
              *,
              user:profiles(id, full_name, email, avatar_url)
            `
            )
            .eq("id", newRow.id)
            .single();

          if (newTask) {
            setTasks((prev) => {
              // Remove any temporary optimistic tasks before adding the real one
              const withoutTemp = prev.filter((t) => !t.id.startsWith("temp-"));
              return [...withoutTemp, newTask as Task];
            });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tasks",
          filter: `team_id=eq.${teamId}`,
        },
        async (
          payload: RealtimePostgresChangesPayload<
            Database["public"]["Tables"]["tasks"]["Row"]
          >
        ) => {
          // Fetch the full task with user data
          const newRow =
            payload.new as Database["public"]["Tables"]["tasks"]["Row"];
          const { data: updatedTask } = await supabase
            .from("tasks")
            .select(
              `
              *,
              user:profiles(id, full_name, email, avatar_url)
            `
            )
            .eq("id", newRow.id)
            .single();

          if (updatedTask) {
            setTasks((prev) =>
              prev.map((task) =>
                task.id === newRow.id ? (updatedTask as Task) : task
              )
            );
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "tasks",
          filter: `team_id=eq.${teamId}`,
        },
        (
          payload: RealtimePostgresChangesPayload<
            Database["public"]["Tables"]["tasks"]["Row"]
          >
        ) => {
          const oldRow =
            payload.old as Database["public"]["Tables"]["tasks"]["Row"];
          setTasks((prev) => prev.filter((task) => task.id !== oldRow.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId]);

  return tasks;
}

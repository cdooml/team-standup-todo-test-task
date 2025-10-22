"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Database } from "@/types/database.types";

export async function createTask(taskData: {
  team_id: string;
  user_id: string;
  title: string;
  section: "yesterday" | "today" | "blockers";
  status?: "pending" | "in_progress" | "done";
  description?: string | null;
  position?: number;
}) {
  const supabase = await createClient();

  const { data: task, error } = await supabase
    .from("tasks")
    .insert(taskData)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/team/${taskData.team_id}`);
  return { data: task };
}

export async function updateTask(
  id: string,
  updates: {
    title?: string;
    description?: string | null;
    section?: "yesterday" | "today" | "blockers";
    status?: "pending" | "in_progress" | "done";
    position?: number;
  }
) {
  const supabase = await createClient();

  const { data: task, error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error || !task) {
    return { error: error?.message || "Failed to update task" };
  }

  const updatedTask = task as Database["public"]["Tables"]["tasks"]["Row"];
  revalidatePath(`/team/${updatedTask.team_id}`);
  return { data: updatedTask };
}

export async function deleteTask(id: string, teamId: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("tasks").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/team/${teamId}`);
  return { success: true };
}

export async function moveTask(
  id: string,
  section: "yesterday" | "today" | "blockers",
  position: number,
  teamId: string
) {
  const supabase = await createClient();

  const { data: task, error } = await supabase
    .from("tasks")
    .update({ section, position })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/team/${teamId}`);
  return { data: task };
}

export async function getTasks(teamId: string) {
  const supabase = await createClient();

  const { data: tasks, error } = await supabase
    .from("tasks")
    .select(
      `
      *,
      user:profiles(id, full_name, email, avatar_url)
    `
    )
    .eq("team_id", teamId)
    .order("position", { ascending: true });

  if (error) {
    return { error: error.message };
  }

  return { data: tasks };
}

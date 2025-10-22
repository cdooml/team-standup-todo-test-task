"use server";

import { createClient } from "@/lib/supabase/server";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import type { Database } from "@/types/database.types";

export async function createTeam(name: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const inviteCode = nanoid(10);

  const { data: team, error: teamError } = await supabase
    .from("teams")
    .insert({
      name,
      invite_code: inviteCode,
      created_by: user.id,
    })
    .select()
    .single();

  if (teamError || !team) {
    return { error: teamError?.message || "Failed to create team" };
  }

  const createdTeam = team as Database["public"]["Tables"]["teams"]["Row"];

  // Add creator as admin
  const { error: memberError } = await supabase.from("team_members").insert({
    team_id: createdTeam.id,
    user_id: user.id,
    role: "admin",
  });

  if (memberError) {
    return { error: memberError.message };
  }

  revalidatePath("/");
  return { data: createdTeam };
}

export async function joinTeam(inviteCode: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Find team by invite code
  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select()
    .eq("invite_code", inviteCode)
    .single();

  if (teamError || !team) {
    return { error: "Invalid invite code" };
  }

  const foundTeam = team as Database["public"]["Tables"]["teams"]["Row"];

  // Check if already a member
  const { data: existingMember } = await supabase
    .from("team_members")
    .select()
    .eq("team_id", foundTeam.id)
    .eq("user_id", user.id)
    .single();

  if (existingMember) {
    return { data: foundTeam, alreadyMember: true };
  }

  // Add as member
  const { error: memberError } = await supabase.from("team_members").insert({
    team_id: foundTeam.id,
    user_id: user.id,
    role: "member",
  });

  if (memberError) {
    return { error: memberError.message };
  }

  revalidatePath("/");
  return { data: foundTeam };
}

export async function getUserTeams() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: teamMembers, error } = await supabase
    .from("team_members")
    .select(
      `
      team_id,
      role,
      teams (
        id,
        name,
        invite_code,
        created_by,
        created_at
      )
    `
    )
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  const teams = teamMembers.map(
    (tm: {
      teams: Database["public"]["Tables"]["teams"]["Row"];
      role: string;
    }) => ({
      ...tm.teams,
      role: tm.role,
    })
  );

  return { data: teams };
}

export async function getTeamMembers(teamId: string) {
  const supabase = await createClient();

  const { data: members, error } = await supabase
    .from("team_members")
    .select(
      `
      id,
      role,
      joined_at,
      user:profiles(id, full_name, email, avatar_url)
    `
    )
    .eq("team_id", teamId);

  if (error) {
    return { error: error.message };
  }

  return { data: members };
}

export async function deleteTeam(teamId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Check if user is an admin of this team
  const { data: membership } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", teamId)
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.role !== "admin") {
    return { error: "Only team admins can delete teams" };
  }

  // Delete the team (cascade will delete related data)
  const { error } = await supabase.from("teams").delete().eq("id", teamId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  return { success: true };
}

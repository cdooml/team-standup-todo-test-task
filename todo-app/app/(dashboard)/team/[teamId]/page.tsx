import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { StandupBoard } from "@/components/standup-board";
import { DeleteTeamButton } from "@/components/delete-team-button";
import { TeamDeletionListener } from "@/components/team-deletion-listener";
import { getTeamMembers } from "@/actions/teams";
import type { Database } from "@/types/database.types";

export default async function TeamPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const supabase = await createClient();

  // Verify team access
  const { data: team } = await supabase
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .single();

  if (!team) {
    notFound();
  }

  const verifiedTeam = team as Database["public"]["Tables"]["teams"]["Row"];

  // Get team members
  const { data: members } = await getTeamMembers(teamId);

  // Get initial tasks
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if current user is an admin
  const { data: currentMembership } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", teamId)
    .eq("user_id", user?.id || "")
    .single();

  const isAdmin = currentMembership?.role === "admin";

  const { data: tasks } = await supabase
    .from("tasks")
    .select(
      `
      *,
      user:profiles(id, full_name, email, avatar_url)
    `
    )
    .eq("team_id", teamId)
    .order("position", { ascending: true });

  return (
    <div>
      <TeamDeletionListener teamId={teamId} />

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">{verifiedTeam.name}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Invite code:{" "}
            <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
              {verifiedTeam.invite_code}
            </code>
          </p>
        </div>
        {isAdmin && (
          <DeleteTeamButton teamId={teamId} teamName={verifiedTeam.name} />
        )}
      </div>

      <StandupBoard
        teamId={teamId}
        userId={user?.id || ""}
        initialTasks={tasks || []}
        members={members || []}
      />
    </div>
  );
}

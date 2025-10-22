import { redirect } from "next/navigation";
import { getUserTeams } from "@/actions/teams";

export default async function DashboardPage() {
  const { data: teams } = await getUserTeams();

  // Redirect to first team or show onboarding
  if (teams && teams.length > 0) {
    redirect(`/team/${teams[0].id}`);
  }

  // No teams - show onboarding
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h2 className="text-3xl font-bold mb-4">Welcome to Team Standup Todo!</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
        You&apos;re not part of any team yet. Create a new team or join an
        existing one to get started.
      </p>
      <div className="text-sm text-gray-500">
        Use the team selector in the header to create or join a team.
      </div>
    </div>
  );
}

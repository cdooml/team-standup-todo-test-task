"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown, Plus, UserPlus } from "lucide-react";
import { createTeam, joinTeam } from "@/actions/teams";

type Team = {
  id: string;
  name: string;
  invite_code: string;
  role: string;
};

export function TeamSelector({ teams }: { teams: Team[] }) {
  const router = useRouter();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await createTeam(teamName);

    if (result.error) {
      alert(result.error);
    } else if (result.data) {
      setCreateDialogOpen(false);
      setTeamName("");
      router.push(`/team/${result.data.id}`);
      router.refresh();
    }

    setLoading(false);
  };

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await joinTeam(inviteCode);

    if (result.error) {
      alert(result.error);
    } else if (result.data) {
      setJoinDialogOpen(false);
      setInviteCode("");
      router.push(`/team/${result.data.id}`);
      router.refresh();
    }

    setLoading(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <span>Teams</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Your Teams</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {teams.map((team) => (
            <DropdownMenuItem
              key={team.id}
              onClick={() => router.push(`/team/${team.id}`)}
            >
              {team.name}
            </DropdownMenuItem>
          ))}
          {teams.length === 0 && (
            <div className="px-2 py-3 text-sm text-gray-500">No teams yet</div>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create team
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setJoinDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Join team
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Create Team Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <form onSubmit={handleCreateTeam}>
            <DialogHeader>
              <DialogTitle>Create a new team</DialogTitle>
              <DialogDescription>
                Create a team to collaborate with your teammates.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="team-name">Team name</Label>
              <Input
                id="team-name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="My Awesome Team"
                required
                className="mt-2"
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create team"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Join Team Dialog */}
      <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
        <DialogContent>
          <form onSubmit={handleJoinTeam}>
            <DialogHeader>
              <DialogTitle>Join a team</DialogTitle>
              <DialogDescription>
                Enter the invite code shared by your team admin.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="invite-code">Invite code</Label>
              <Input
                id="invite-code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="ABC123XYZ"
                required
                className="mt-2"
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? "Joining..." : "Join team"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

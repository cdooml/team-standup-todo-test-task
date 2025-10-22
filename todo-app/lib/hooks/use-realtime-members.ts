"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

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

export function useRealtimeMembers(teamId: string, initialMembers: Member[]) {
  const [members, setMembers] = useState<Member[]>(initialMembers);

  useEffect(() => {
    const supabase = createClient();

    // Fetch fresh members data
    const fetchMembers = async () => {
      const { data } = await supabase
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

      if (data) {
        setMembers(data as Member[]);
      }
    };

    // Set up realtime subscription
    const channel: RealtimeChannel = supabase
      .channel(`team_members:${teamId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "team_members",
          filter: `team_id=eq.${teamId}`,
        },
        async () => {
          // Fetch updated members list when someone joins
          await fetchMembers();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "team_members",
          filter: `team_id=eq.${teamId}`,
        },
        async () => {
          // Fetch updated members list when someone leaves
          await fetchMembers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId]);

  return members;
}

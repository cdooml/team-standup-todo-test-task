"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export function TeamDeletionListener({ teamId }: { teamId: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    // Set up realtime subscription to listen for team deletion
    const channel: RealtimeChannel = supabase
      .channel(`team_deletion:${teamId}`)
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "teams",
          filter: `id=eq.${teamId}`,
        },
        () => {
          // Team was deleted, redirect to home with message
          router.push("/?message=team_deleted");
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId, router]);

  return null;
}

"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

type PresenceState = {
  [key: string]: {
    user_id: string;
    online_at: string;
  }[];
};

export function usePresence(teamId: string, userId: string) {
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const heartbeatRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    const supabase = createClient();
    const channel: RealtimeChannel = supabase.channel(`presence:${teamId}`, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state: PresenceState = channel.presenceState();
        // Include ALL users (including current user) in the online list
        const users = Object.keys(state);
        setOnlineUsers(users);
      })
      .on("presence", { event: "join" }, ({ key }) => {
        setOnlineUsers((prev) => [...new Set([...prev, key])]);
      })
      .on("presence", { event: "leave" }, ({ key }) => {
        setOnlineUsers((prev) => prev.filter((id) => id !== key));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          // Initial tracking
          await channel.track({
            user_id: userId,
            online_at: new Date().toISOString(),
          });

          // Send heartbeat every 30 seconds to maintain presence
          // even when tab is in background
          heartbeatRef.current = setInterval(() => {
            channel.track({
              user_id: userId,
              online_at: new Date().toISOString(),
            });
          }, 30000); // 30 seconds
        }
      });

    return () => {
      // Clear heartbeat interval
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [teamId, userId]);

  return onlineUsers;
}

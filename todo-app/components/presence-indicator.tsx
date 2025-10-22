"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users } from "lucide-react";

type Member = {
  id: string;
  role: string;
  user: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
};

export function PresenceIndicator({
  members,
  onlineUserIds,
}: {
  members: Member[];
  onlineUserIds: string[];
}) {
  const onlineMembers = members.filter((m) =>
    onlineUserIds.includes(m.user.id)
  );

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <Users className="h-4 w-4" />
        <span>
          {onlineMembers.length} online, {members.length} total
        </span>
      </div>

      <div className="flex -space-x-2">
        {members.slice(0, 5).map((member) => {
          const isOnline = onlineUserIds.includes(member.user.id);
          const initials = member.user.full_name
            ? member.user.full_name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
            : member.user.email.slice(0, 2).toUpperCase();

          return (
            <div key={member.user.id} className="relative">
              <Avatar
                className={`h-8 w-8 border-2 ${
                  isOnline ? "border-green-500" : "border-gray-300"
                }`}
              >
                <AvatarFallback className="text-xs bg-blue-600 text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {isOnline && (
                <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-white dark:border-gray-900" />
              )}
            </div>
          );
        })}
        {members.length > 5 && (
          <Avatar className="h-8 w-8 border-2 border-gray-300">
            <AvatarFallback className="text-xs bg-gray-600 text-white">
              +{members.length - 5}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  );
}

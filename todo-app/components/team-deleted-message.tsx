"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { X } from "lucide-react";

export function TeamDeletedMessage() {
  const searchParams = useSearchParams();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (searchParams.get("message") === "team_deleted") {
      let hideTimer: NodeJS.Timeout | undefined;

      const showTimer = setTimeout(() => {
        setShow(true);

        // Remove the message from URL after showing it
        const url = new URL(window.location.href);
        url.searchParams.delete("message");
        window.history.replaceState({}, "", url.toString());

        // Auto-hide after 5 seconds
        hideTimer = setTimeout(() => setShow(false), 5000);
      }, 0);

      return () => {
        clearTimeout(showTimer);
        if (hideTimer) clearTimeout(hideTimer);
      };
    }
  }, [searchParams]);

  if (!show) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-md">
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200 px-4 py-3 rounded-lg shadow-lg flex items-start justify-between animate-in slide-in-from-top">
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-5 h-5 mt-0.5">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <p className="font-semibold">Team Deleted</p>
            <p className="text-sm">The team has been permanently deleted.</p>
          </div>
        </div>
        <button
          onClick={() => setShow(false)}
          className="shrink-0 text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

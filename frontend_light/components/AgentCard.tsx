"use client";

import { Agent } from "@/lib/api";

interface AgentCardProps {
  agent: Agent;
}

export function AgentCard({ agent }: AgentCardProps) {
  const isOnline = agent.status === "online";

  return (
    <div
      className={`group bg-white dark:bg-slate-800 rounded-xl border p-4 transition-all duration-200 ${
        isOnline
          ? "border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-green-300 dark:hover:border-green-700"
          : "border-gray-100 dark:border-gray-800"
      }`}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        {/* Agent Icon */}
        <div
          className={`shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-lg font-bold ${
            isOnline
              ? "bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/50 dark:to-primary-800/50 text-primary-700 dark:text-primary-300"
              : "bg-gray-100 dark:bg-gray-800 text-gray-400"
          }`}
        >
          {agent.iconUrl ? (
            <img
              src={agent.iconUrl}
              alt={agent.name}
              className="w-6 h-6 sm:w-7 sm:h-7 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            agent.name?.charAt(0).toUpperCase() || "A"
          )}
        </div>

        {/* Name & Status */}
        <div className="flex-1 min-w-0">
          <h3
            className={`font-semibold line-clamp-1 text-sm sm:text-base ${
              isOnline
                ? "text-gray-900 dark:text-white"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {agent.name}
          </h3>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isOnline ? "bg-green-500 animate-pulse" : "bg-gray-400"
              }`}
            ></span>
            <span
              className={`text-xs ${
                isOnline
                  ? "text-green-600 dark:text-green-400"
                  : "text-gray-500 dark:text-gray-500"
              }`}
            >
              {isOnline ? "Online" : "Offline"}
            </span>
          </div>
        </div>
      </div>

      {/* Description */}
      {agent.description && (
        <p
          className={`text-sm line-clamp-2 mb-3 ${
            isOnline
              ? "text-gray-600 dark:text-gray-400"
              : "text-gray-400 dark:text-gray-500"
          }`}
        >
          {agent.description}
        </p>
      )}

      {/* Capabilities & Provider */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          {agent.capabilities?.streaming && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400 rounded-full">
              <svg
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              Stream
            </span>
          )}
        </div>
        {agent.provider?.organization && (
          <span className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[100px]">
            {agent.provider.organization}
          </span>
        )}
      </div>
    </div>
  );
}

"use client";

import { Workflow } from "@/lib/api";

interface WorkflowCardProps {
  workflow: Workflow;
}

export function WorkflowCard({ workflow }: WorkflowCardProps) {
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      analysis: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400",
      automation: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400",
      research: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400",
      creative: "bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-400",
      support: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400",
      default: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
    };
    return colors[category?.toLowerCase()] || colors.default;
  };

  return (
    <div className="group bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-700 transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 text-sm sm:text-base">
          {workflow.name}
        </h3>
        {workflow.isCustom && (
          <span className="shrink-0 px-2 py-0.5 text-xs font-medium bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-400 rounded-full">
            Custom
          </span>
        )}
      </div>

      {/* Description */}
      {workflow.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
          {workflow.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
        <span
          className={`px-2 py-0.5 text-xs font-medium rounded-full ${getCategoryColor(
            workflow.category
          )}`}
        >
          {workflow.category || "General"}
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {workflow.steps?.length || 0} steps
        </span>
      </div>
    </div>
  );
}

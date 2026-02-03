"use client";

import { Workflow, Agent } from "@/lib/api";

// Status for each required agent in the workflow
export interface AgentStatus {
  agentName: string;
  isOnline: boolean;
  isEnabled: boolean;
}

interface WorkflowCardProps {
  workflow: Workflow;
  isActivated?: boolean;
  isLoading?: boolean;
  agentStatuses?: AgentStatus[];
  onToggle?: () => void;
}

export function WorkflowCard({ 
  workflow, 
  isActivated = false, 
  isLoading = false,
  agentStatuses = [],
  onToggle 
}: WorkflowCardProps) {
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

  // Determine workflow status based on agent availability
  const getWorkflowStatus = (): 'ready' | 'partial' | 'unavailable' | 'disabled' => {
    if (!isActivated) return 'disabled';
    if (agentStatuses.length === 0) return 'ready';
    
    const onlineCount = agentStatuses.filter(s => s.isOnline).length;
    if (onlineCount === agentStatuses.length) return 'ready';
    if (onlineCount > 0) return 'partial';
    return 'unavailable';
  };

  const status = getWorkflowStatus();

  // Border and background colors based on status
  const getStatusStyles = () => {
    if (isLoading) {
      return "border-gray-300 dark:border-gray-600 animate-pulse";
    }
    switch (status) {
      case 'ready':
        return "border-green-400 dark:border-green-600 bg-green-50/50 dark:bg-green-900/20";
      case 'partial':
        return "border-yellow-400 dark:border-yellow-600 bg-yellow-50/50 dark:bg-yellow-900/20";
      case 'unavailable':
        return "border-red-400 dark:border-red-600 bg-red-50/50 dark:bg-red-900/20";
      default:
        return "border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800";
    }
  };

  return (
    <div 
      onClick={onToggle}
      className={`group relative rounded-xl border p-4 transition-all duration-200 ${getStatusStyles()} ${
        onToggle ? 'cursor-pointer hover:shadow-lg' : ''
      }`}
    >
      {/* Activated checkmark badge */}
      {isActivated && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-md">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className={`font-semibold line-clamp-2 text-sm sm:text-base ${
          isActivated ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
        }`}>
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
        <p className={`text-sm line-clamp-2 mb-3 ${
          isActivated ? 'text-gray-600 dark:text-gray-400' : 'text-gray-400 dark:text-gray-500'
        }`}>
          {workflow.description}
        </p>
      )}

      {/* Agent status chips - only show when activated */}
      {isActivated && agentStatuses.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {agentStatuses.slice(0, 4).map((agent, idx) => (
            <span 
              key={idx}
              className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                agent.isOnline 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${
                agent.isOnline ? 'bg-green-500' : 'bg-red-500'
              }`} />
              {agent.agentName.length > 12 ? agent.agentName.slice(0, 10) + '...' : agent.agentName}
            </span>
          ))}
          {agentStatuses.length > 4 && (
            <span className="px-2 py-0.5 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-full">
              +{agentStatuses.length - 4} more
            </span>
          )}
        </div>
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
        <div className="flex items-center gap-2">
          {isActivated && (
            <span className={`text-xs font-medium ${
              status === 'ready' ? 'text-green-600 dark:text-green-400' :
              status === 'partial' ? 'text-yellow-600 dark:text-yellow-400' :
              'text-red-600 dark:text-red-400'
            }`}>
              {status === 'ready' ? '✓ Ready' : 
               status === 'partial' ? '⚠ Partial' : 
               '✗ Unavailable'}
            </span>
          )}
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {workflow.steps?.length || 0} steps
          </span>
        </div>
      </div>
    </div>
  );
}

// Helper function to get required agents for a workflow
export function getRequiredAgents(workflow: Workflow, allAgents: Agent[]): AgentStatus[] {
  // Get unique agent names from workflow steps
  const requiredAgentNames = new Set<string>();
  workflow.steps?.forEach(step => {
    if (step.agentName) {
      requiredAgentNames.add(step.agentName);
    }
  });

  // Map to agent statuses
  return Array.from(requiredAgentNames).map(agentName => {
    const matchingAgent = allAgents.find(a => 
      a.name.toLowerCase() === agentName.toLowerCase() ||
      a.name.toLowerCase().includes(agentName.toLowerCase()) ||
      agentName.toLowerCase().includes(a.name.toLowerCase())
    );
    
    return {
      agentName,
      isOnline: matchingAgent?.status === 'online',
      isEnabled: false, // Will be set by parent
    };
  });
}

"use client";

import { useState } from "react";
import { useVoiceRealtime } from "@/hooks/useVoiceRealtime";

interface VoiceButtonProps {
  userId: string;
  apiUrl: string;
}

// Simple markdown to HTML converter
function formatMarkdown(text: string): string {
  return text
    // Headers
    .replace(/^### (.*$)/gm, '<h3 class="text-base font-semibold mt-3 mb-1">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-lg font-semibold mt-4 mb-2">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="text-xl font-bold mt-4 mb-2">$1</h1>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // List items
    .replace(/^- (.*$)/gm, '<li class="ml-4">• $1</li>')
    // Line breaks
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}

export function VoiceButton({ userId, apiUrl }: VoiceButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const voice = useVoiceRealtime({
    apiUrl,
    userId,
    onTranscript: (text) => {
      console.log("[VoiceButton] Transcript:", text);
    },
    onResult: (result) => {
      console.log("[VoiceButton] Result:", result);
    },
    onError: (error) => {
      console.error("[VoiceButton] Error:", error);
    },
  });

  const handleClick = () => {
    if (voice.isConnected) {
      voice.stopConversation();
    } else {
      voice.startConversation();
    }
  };

  // Determine button state and styling
  const getButtonState = () => {
    if (voice.error) {
      return {
        color: "bg-red-500",
        pulseColor: "bg-red-400",
        icon: "error",
        label: "Error - Tap to retry",
      };
    }
    if (voice.isSpeaking) {
      return {
        color: "bg-purple-500",
        pulseColor: "bg-purple-400",
        icon: "speaking",
        label: "Speaking...",
      };
    }
    if (voice.isProcessing) {
      return {
        color: "bg-yellow-500",
        pulseColor: "bg-yellow-400",
        icon: "processing",
        label: voice.currentAgent ? `Contacting ${voice.currentAgent}...` : "Processing...",
      };
    }
    if (voice.isListening) {
      return {
        color: "bg-green-500",
        pulseColor: "bg-green-400",
        icon: "listening",
        label: "Listening...",
      };
    }
    if (voice.isConnected) {
      return {
        color: "bg-blue-500",
        pulseColor: "bg-blue-400",
        icon: "connected",
        label: "Connected",
      };
    }
    return {
      color: "bg-primary-600",
      pulseColor: "bg-primary-400",
      icon: "idle",
      label: "Tap to speak",
    };
  };

  const state = getButtonState();
  const isActive = voice.isConnected || voice.isListening || voice.isSpeaking || voice.isProcessing;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-3 w-full px-4 sm:px-6">
      {/* Status & Transcript Display */}
      {(voice.transcript || voice.result || voice.error) && (
        <div 
          className={`relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5 animate-in slide-in-from-bottom-4 transition-all duration-300 w-full max-w-2xl ${
            isExpanded 
              ? 'max-h-[80vh]' 
              : 'max-h-[60vh]'
          }`}
        >
          {/* Close/Minimize button */}
          {voice.result && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="absolute top-3 right-3 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title={isExpanded ? "Minimize" : "Full screen"}
            >
              {isExpanded ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              )}
            </button>
          )}
          
          {voice.error && (
            <p className="text-base sm:text-lg text-red-500 dark:text-red-400">{voice.error}</p>
          )}
          {voice.transcript && !voice.error && (
            <div className="mb-3 pr-8">
              <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">You said:</p>
              <p className="text-base sm:text-lg text-gray-900 dark:text-white font-medium">{voice.transcript}</p>
            </div>
          )}
          {voice.result && !voice.error && (
            <div className={`overflow-y-auto pr-2 ${isExpanded ? 'max-h-[70vh]' : 'max-h-[45vh]'}`}>
              <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Result:</p>
              <div 
                className="text-sm sm:text-base text-gray-700 dark:text-gray-300 prose prose-sm sm:prose-base dark:prose-invert max-w-none leading-relaxed"
                dangerouslySetInnerHTML={{ __html: formatMarkdown(voice.result) }}
              />
            </div>
          )}
        </div>
      )}

      {/* Main Voice Button */}
      <button
        onClick={handleClick}
        className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full ${state.color} text-white shadow-lg 
                   hover:scale-105 active:scale-95 transition-all duration-200
                   focus:outline-none focus:ring-4 focus:ring-primary-300 dark:focus:ring-primary-800`}
        title={state.label}
      >
        {/* Pulse animation when active */}
        {isActive && (
          <>
            <span
              className={`absolute inset-0 rounded-full ${state.pulseColor} animate-ping opacity-75`}
            />
            <span
              className={`absolute inset-0 rounded-full ${state.pulseColor} animate-pulse opacity-50`}
            />
          </>
        )}

        {/* Icon */}
        <span className="relative z-10 flex items-center justify-center">
          {state.icon === "error" ? (
            <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ) : state.icon === "speaking" ? (
            <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          ) : state.icon === "processing" ? (
            <svg className="w-7 h-7 sm:w-8 sm:h-8 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          ) : state.icon === "listening" ? (
            <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
          ) : voice.isConnected ? (
            <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
          )}
        </span>
      </button>

      {/* Label */}
      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 bg-white/80 dark:bg-slate-900/80 px-3 py-1 rounded-full shadow-sm">
        {state.label}
      </span>
    </div>
  );
}

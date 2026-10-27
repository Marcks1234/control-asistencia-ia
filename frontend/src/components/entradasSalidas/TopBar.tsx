"useclient";

import React from "react";

interface TopBarProps {
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  onAiAssistantClick?: () => void;
}

export default function TopBar({
  searchQuery = "",
  onSearchChange,
  onAiAssistantClick,
}: TopBarProps) {
  return (
    <header className="w-full flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 py-3">
      {/* Date Pill */}
      <div className="flex items-center gap-2 bg-white border border-gray-200/80 rounded-xl px-4 py-2.5 text-xs font-semibold text-gray-700 shadow-xs w-fit">
        <svg
          className="w-4 h-4 text-gray-500"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          viewBox="0 0 24 24"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <span>Lunes, 07 de Septiembre 2026</span>
      </div>

      {/* Search and AI button container */}
      <div className="flex items-center gap-3 flex-1 md:justify-end">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Buscar empleado, DNI o evento..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200/80 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs transition"
          />
        </div>

        {/* AI Assistant Button */}
        <button
          type="button"
          onClick={onAiAssistantClick}
          className="flex items-center gap-2 bg-[#1754CF] hover:bg-[#1244A7] text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition active:scale-98 whitespace-nowrap"
        >
          <svg
            className="w-4 h-4 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2L13.8 8.2L20 10L13.8 11.8L12 18L10.2 11.8L4 10L10.2 8.2L12 2Z" />
            <path d="M19 15L19.9 18.1L23 19L19.9 19.9L19 23L18.1 19.9L15 19L18.1 18.1L19 15Z" opacity="0.7" />
          </svg>
          <span>Asistente AI</span>
        </button>
      </div>
    </header>
  );
}


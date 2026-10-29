"use client";

import React, { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";

interface AppLayoutProps {
  activeItem: string;
  children: React.ReactNode | ((searchQuery: string) => React.ReactNode);
  onQuickAsk?: (pregunta: string) => void;
  fullHeight?: boolean;
}

export default function AppLayout({
  activeItem,
  children,
  onQuickAsk,
  fullHeight = false,
}: AppLayoutProps) {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className={`${fullHeight ? "h-screen overflow-hidden" : "min-h-screen"} flex bg-[#F4F7FB] text-slate-900`}>
      <Sidebar activeItem={activeItem} />
      <div className={`flex-1 flex flex-col min-w-0 ${fullHeight ? "h-full overflow-hidden" : ""}`}>
        <TopBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onQuickAsk={onQuickAsk}
        />
        <main className={`flex-1 px-6 lg:px-8 py-5 max-w-7xl w-full mx-auto flex flex-col ${fullHeight ? "min-h-0 overflow-hidden" : ""}`}>
          {typeof children === "function" ? children(searchQuery) : children}
        </main>
      </div>
    </div>
  );
}


"use client";

import React, { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import DashboardView from "@/components/dashboardPage/DashboardView";

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen flex bg-[#F4F7FB] text-slate-900">
      {/* Menú lateral compartido en todo el sistema */}
      <Sidebar activeItem="dashboard" />

      {/* Columna principal: TopBar unificado + Vista modular del Dashboard */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <main className="flex-1 px-6 lg:px-8 py-6 max-w-7xl w-full mx-auto flex flex-col">
          <DashboardView globalSearch={searchQuery} />
        </main>
      </div>
    </div>
  );
}

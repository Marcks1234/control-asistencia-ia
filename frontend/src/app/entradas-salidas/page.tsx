"use client";

import React, { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import AttendanceView from "@/components/entradasSalidas/AttendanceView";

export default function EntradasSalidasPage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen flex bg-[#F4F7FB] text-slate-900">
      {/* Barra lateral compartida en todo el sistema */}
      <Sidebar activeItem="entradas-salidas" />

      {/* Columna derecha: TopBar general + Contenido */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <main className="flex-1 px-8 py-6 max-w-7xl w-full mx-auto flex flex-col">
          <AttendanceView globalSearch={searchQuery} />
        </main>
      </div>
    </div>
  );
}

import React from "react";
import Sidebar from "@/components/layout/Sidebar";
import AttendanceView from "@/components/entradasSalidas/AttendanceView";

export const metadata = {
  title: "Entrada / Salida - Control de Asistencia con IA",
  description: "Registro manual de asistencia y control diario",
};

export default function EntradasSalidasPage() {
  return (
    <div className="flex min-h-screen bg-[#F4F6FA]">
      {/* Barra lateral (Sidebar) */}
      <Sidebar />

      {/* Área de contenido principal */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <AttendanceView />
        </div>
      </main>
    </div>
  );
}


"use client";

import AppLayout from "@/components/layout/AppLayout";
import AttendanceView from "@/components/entradasSalidas/AttendanceView";

export default function EntradasSalidasPage() {
  return (
    <AppLayout activeItem="entradas-salidas">
      {(search) => <AttendanceView globalSearch={search} />}
    </AppLayout>
  );
}

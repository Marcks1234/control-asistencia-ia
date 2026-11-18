"use client";

import { useSyncExternalStore } from "react";
import AppLayout from "@/components/layout/AppLayout";
import ReportsView from "@/components/reportesPage/ReportsView";
import { localDate } from "@/lib/reportUtils";
import "./reports.css";

const subscribeToDate = () => () => {};
const getClientDate = () => localDate(new Date());
const getServerDate = () => "";

export default function Page() {
  const todayIso = useSyncExternalStore(subscribeToDate, getClientDate, getServerDate);

  if (!todayIso) {
    return (
      <main className="reports-shell" aria-busy="true">
        Cargando reportes…
      </main>
    );
  }

  return (
    <AppLayout activeItem="reportes">
      {(searchQuery) => <ReportsView todayIso={todayIso} globalSearch={searchQuery} />}
    </AppLayout>
  );
}

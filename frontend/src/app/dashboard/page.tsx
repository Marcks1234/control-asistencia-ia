"use client";

import AppLayout from "@/components/layout/AppLayout";
import DashboardView from "@/components/dashboardPage/DashboardView";

export default function DashboardPage() {
  return (
    <AppLayout activeItem="dashboard">
      {(search) => <DashboardView globalSearch={search} />}
    </AppLayout>
  );
}

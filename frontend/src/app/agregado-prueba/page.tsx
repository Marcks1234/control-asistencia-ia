"use client";

import AppLayout from "@/components/layout/AppLayout";
import GestionPersonalView from "@/components/personalPage/GestionPersonalView";

export default function AgregadoPruebaPage() {
  return (
    <AppLayout activeItem="personal">
      {(searchQuery) => <GestionPersonalView globalSearch={searchQuery} />}
    </AppLayout>
  );
}

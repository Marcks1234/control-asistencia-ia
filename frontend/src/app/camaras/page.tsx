"use client";

import React from "react";
import AppLayout from "@/components/layout/AppLayout";
import CamarasView from "@/components/camarasPage/CamarasView";

export default function CamarasPage() {
  return (
    <AppLayout activeItem="camaras-ia">
      {(search) => <CamarasView globalSearch={search} />}
    </AppLayout>
  );
}

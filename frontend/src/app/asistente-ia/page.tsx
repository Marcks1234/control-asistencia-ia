"use client";

import { useState } from "react";
import Sidebar from "@/components/asistentePage/Sidebar";
import TopBar from "@/components/asistentePage/TopBar";
import ChatWindow from "@/components/asistentePage/ChatWindow";

export default function AsistenteIAPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [externalPrompt, setExternalPrompt] = useState<string | null>(null);

  return (
    <div className="min-h-screen flex bg-[#F4F7FB] text-slate-900">
      {/* Menú lateral compartido */}
      <Sidebar activeItem="asistente-ia" />

      {/* Columna derecha: TopBar + Vista principal del Asistente IA */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onQuickAsk={(pregunta) => setExternalPrompt(pregunta)}
        />

        <main className="flex-1 flex flex-col">
          <ChatWindow
            externalPrompt={externalPrompt}
            onExternalPromptHandled={() => setExternalPrompt(null)}
          />
        </main>
      </div>
    </div>
  );
}


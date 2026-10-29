"use client";

import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import ChatWindow from "@/components/asistentePage/ChatWindow";

export default function AsistenteIAPage() {
  const [prompt, setPrompt] = useState<string | null>(null);

  return (
    <AppLayout activeItem="asistente-ia" fullHeight onQuickAsk={setPrompt}>
      {() => (
        <ChatWindow
          externalPrompt={prompt}
          onExternalPromptHandled={() => setPrompt(null)}
        />
      )}
    </AppLayout>
  );
}

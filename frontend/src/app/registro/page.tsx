"use client";

import React from "react";
import NavBar from "@/components/homePage/NavBar";
import Footer from "@/components/homePage/Footer";
import RegistroCard from "@/components/registroPage/RegistroCard";

export default function RegistroPage() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50">
      <NavBar />
      <main className="flex-grow flex items-center justify-center px-4 py-16">
        <RegistroCard />
      </main>
      <Footer />
    </div>
  );
}

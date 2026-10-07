
import type { Metadata } from "next";
import { Plus_Jakarta_Sans,Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: 'swap'
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Asistencia-IA",
  description: "Sistema de gestión de asistencia con implementación de la IA",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es" className={`${plusJakartaSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col"
        style={{
          backgroundColor: 'rgba(238, 242, 248, 1)',
          color: '#171717',
          ['--background' as any]: '#ffffff',
          ['--foreground' as any]: '#171717'
        }}>
        {children}</body>
    </html>
  );
}

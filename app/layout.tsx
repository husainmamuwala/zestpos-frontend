// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "./components/Sidebar";
import ClientAuthGuard from "./components/ClientAuthGuard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ZestPOS",
  description: "ZestPOS billing app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="flex min-h-screen bg-[var(--background)]">
          <div className="antialiased">

            <div className="flex min-h-screen">
              <ClientAuthGuard>
                <Sidebar />
              </ClientAuthGuard>
              <div className="w-full">
                {children}
              </div>
            </div>

          </div>
        </div>
      </body>
    </html>
  );
}

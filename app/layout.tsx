// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
// @ts-ignore
import "./globals.css";
import { Toaster } from "react-hot-toast";
// Sidebar is intentionally not included here so pages like /login do not show it.

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
        <div className="flex min-h-screen">
          <div className="antialiased w-full">{children}</div>
        </div>
        {/* react-hot-toast container */}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}

// app/(dashboard)/layout.tsx
import React from "react";
import Sidebar from "../components/Sidebar";
import ClientAuthGuard from "../components/ClientAuthGuard";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    
      <div className="antialiased bg-[var(--background)]">
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="w-full">
            {/* ClientAuthGuard blocks access client-side if no token */}
            {/* <ClientAuthGuard> */}
              {children}
            {/* </ClientAuthGuard> */}
          </div>
        </div>
      </div>
   
  );
}

import React from "react";
import Sidebar from "../components/Sidebar";
import ClientAuthGuard from "../components/ClientAuthGuard";

export default function CustomersLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="antialiased">
            <div className="flex min-h-screen">
                <Sidebar />
                <div className="w-full">
                    <ClientAuthGuard>{children}</ClientAuthGuard>
                </div>
            </div>
        </div>
    );
}

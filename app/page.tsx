"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import BillsTable from "./components/BillsTable";
import ClientAuthGuard from "./components/ClientAuthGuard";
import Sidebar from "./components/Sidebar";

export default function Home() {
  return (
    <div className="antialiased">
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="w-full">
          <ClientAuthGuard><div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-semibold">All Bills</h1>
              <Link href="/create-bill">
                <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                  Create Invoice
                </Button>
              </Link>
            </div>
            <BillsTable />
          </div>
          </ClientAuthGuard>
        </div>
      </div>
    </div>

  );
}

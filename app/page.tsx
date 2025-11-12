"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ClientAuthGuard from "./components/ClientAuthGuard";
import Sidebar from "./components/Sidebar";
import InvoiceTable from "./invoice-table/InvoiceTable";

export default function Home() {

  return (
    <div className="antialiased">
      <ClientAuthGuard>
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold">All Bills</h1>
                <Link href="/create-bill">
                  <Button className="bg-purple-600 cursor-pointer hover:bg-purple-700 text-white">
                    Create Invoice
                  </Button>
                </Link>
              </div>

              {/* Loading / Error states */}
              <InvoiceTable />
            </div>
          </div>
        </div>
      </ClientAuthGuard>
    </div>
  );
}

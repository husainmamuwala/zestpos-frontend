"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ClientAuthGuard from "./components/ClientAuthGuard";
import Sidebar from "./components/Sidebar";
import InvoiceTable from "./invoice-table/InvoiceTable";
import Head from "next/head";

export default function Home() {
  return (
    <div className="antialiased">
      <Head>
        <title>SCPT</title>
        <meta name="description" content="SCP Trading" />
      </Head>
      <ClientAuthGuard>
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold">All Bills</h1>
                <Link href="/create-bill">
                  <Button className="bg-[#800080] cursor-pointer hover:bg-[#660066] text-white">
                    Create Invoice
                  </Button>
                </Link>
              </div>
              <InvoiceTable />
            </div>
          </div>
        </div>
      </ClientAuthGuard>
    </div>
  );
}

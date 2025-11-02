"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import BillsTable from "./components/BillsTable";
import ClientAuthGuard from "./components/ClientAuthGuard";
import Sidebar from "./components/Sidebar";
import { authApi } from "@/lib/api";

export default function Home() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const res = await authApi.get("/invoice/all");
        setInvoices(res.data.invoices);
      } catch (err: any) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  return (
    <div className="antialiased">
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="w-full">
          <ClientAuthGuard>
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
              <BillsTable invoices={invoices} />
            </div>
          </ClientAuthGuard>
        </div>
      </div>
    </div>
  );
}

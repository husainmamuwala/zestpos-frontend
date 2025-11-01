import Link from "next/link";
import { Button } from "@/components/ui/button";
import BillsTable from "./components/BillsTable";

export default function Home() {
  return (
    <div className="p-6">
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
  );
}

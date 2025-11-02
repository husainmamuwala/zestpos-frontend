"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

const mockBills = Array.from({ length: 42 }).map((_, i) => ({
  id: i + 1,
  customer: `Customer ${i + 1}`,
  total: (Math.random() * 500).toFixed(2),
  date: "2025-10-29",
}));

export default function BillsTable() {
  const [page, setPage] = useState(1);
  const perPage = 10;
  const totalPages = Math.ceil(mockBills.length / perPage);

  const data = mockBills.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="bg-white shadow-md rounded-lg p-4">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 text-left">Bill ID</th>
            <th className="px-4 py-2 text-left">Customer</th>
            <th className="px-4 py-2 text-left">Total (OMR)</th>
            <th className="px-4 py-2 text-left">Date</th>
          </tr>
        </thead>
        <tbody>
          {data.map((bill) => (
            <tr key={bill.id} className="border-b hover:bg-gray-50">
              <td className="px-4 py-2">{bill.id}</td>
              <td className="px-4 py-2">{bill.customer}</td>
              <td className="px-4 py-2">{bill.total}</td>
              <td className="px-4 py-2">{bill.date}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end items-center mt-4 gap-2">
        <Button
          variant="outline"
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        >
          Prev
        </Button>
        <span className="text-sm text-gray-600">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

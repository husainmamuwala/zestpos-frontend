"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/utils/convert";

export default function BillsTable({invoices}: {invoices: any[]}) {
  const [page, setPage] = useState(1);
  const perPage = 10;
  const totalPages = Math.ceil(invoices.length / perPage);

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
          {invoices.map((invoice) => (
            <tr key={invoice.id} className="border-b hover:bg-gray-50">
              <td className="px-4 py-2">{invoice._id}</td>
              <td className="px-4 py-2">{invoice.customer.name}</td>
              <td className="px-4 py-2">{invoice.totalAmount.toFixed(2)}</td>
              <td className="px-4 py-2">{formatDate(invoice.invoiceDate)}</td>
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

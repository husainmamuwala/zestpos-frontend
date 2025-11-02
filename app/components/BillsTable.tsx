"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/utils/convert";
import { Download } from "lucide-react";
import { Invoice } from "../types/Invoice";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; 


export default function BillsTable({ invoices }: { invoices: Invoice[] }) {
  const [page, setPage] = useState(1);
  const perPage = 10;
  const totalPages = Math.ceil(invoices.length / perPage);

  const handleDownload = (invoice: Invoice) => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text("Invoice", 14, 20);

    // Invoice Info
    doc.setFontSize(12);
    doc.text(`Invoice No: ${invoice.invoiceNumber}`, 14, 30);
    doc.text(`Invoice Date: ${formatDate(invoice.invoiceDate)}`, 14, 38);
    doc.text(`Supply Date: ${formatDate(invoice.supplyDate)}`, 14, 46);

    // Customer Info
    doc.setFontSize(14);
    doc.text("Customer Details", 14, 60);
    doc.setFontSize(12);
    doc.text(`Name: ${invoice.customer.name}`, 14, 68);
    doc.text(`Address: ${invoice.customer.address}`, 14, 76);
    doc.text(`Phone: ${invoice.customer.phone}`, 14, 84);
    doc.text(`Email: ${invoice.customer.email}`, 14, 92);

    // Items Table
    const itemRows = invoice.items.map((item, index) => [
      index + 1,
      item.itemName,
      item.qty,
      item.price.toFixed(2),
      `${item.vat}%`,
      item.finalAmount.toFixed(2),
    ]);

    autoTable(doc, {
      startY: 105,
      head: [["#", "Item Name", "Qty", "Price", "VAT", "Total"]],
      body: itemRows,
    });


    // Total Amount
    const finalY = (doc as any).lastAutoTable.finalY || 105;
    doc.setFontSize(14);
    doc.text(`Total Amount: OMR ${invoice.totalAmount.toFixed(2)}`, 14, finalY + 15);

    // Footer
    doc.setFontSize(10);
    doc.text("Thank you for your business!", 14, finalY + 30);

    // Save PDF
    doc.save(`${invoice.invoiceNumber}.pdf`);
  };

  const startIndex = (page - 1) * perPage;
  const currentInvoices = invoices.slice(startIndex, startIndex + perPage);

  return (
    <div className="bg-white shadow-md rounded-lg p-4">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 text-left">Bill ID</th>
            <th className="px-4 py-2 text-left">Customer</th>
            <th className="px-4 py-2 text-left">Total (OMR)</th>
            <th className="px-4 py-2 text-left">Invoice Date</th>
            <th className="px-4 py-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentInvoices.map((invoice) => (
            <tr key={invoice._id} className="border-b hover:bg-gray-50">
              <td className="px-4 py-2">{invoice._id}</td>
              <td className="px-4 py-2">{invoice.customer?.name || "N/A"}</td>
              <td className="px-4 py-2">{invoice.totalAmount?.toFixed(2)}</td>
              <td className="px-4 py-2">{formatDate(invoice.invoiceDate)}</td>
              <td className="px-4 py-2">
                <Button
                  className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1"
                  onClick={() => handleDownload(invoice)}
                >
                  <Download className="w-4 h-4" /> Download
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination controls */}
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

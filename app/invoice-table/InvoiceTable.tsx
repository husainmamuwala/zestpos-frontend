"use client";

import { Button } from "@/components/ui/button";
import { formatDate } from "@/utils/convert";
import { Download } from "lucide-react";
import { useInvoice } from "./useInvoice";
import Loader from "@/utils/loader";


export default function InvoiceTable() {
    const { currentPage, setCurrentPage, loading, invoices, totalPages, handleDownload, handleNext, handlePrev } = useInvoice();

    if (loading) {
        return <Loader />;
    }

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
                    {invoices.map((invoice) => (
                        <tr key={invoice._id} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-2">{invoice._id}</td>
                            <td className="px-4 py-2">{invoice.customer?.name || "N/A"}</td>
                            <td className="px-4 py-2">{invoice.totalAmount?.toFixed(2)}</td>
                            <td className="px-4 py-2">{formatDate(invoice.invoiceDate)}</td>
                            <td className="px-4 py-2">
                                <Button
                                    className="bg-purple-600 cursor-pointer hover:bg-purple-700 text-white flex items-center gap-1"
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
                    className="cursor-pointer"
                    variant="outline"
                    disabled={currentPage === 1}
                    onClick={handlePrev}
                >
                    Prev
                </Button>
                <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                </span>
                <Button
                    className="cursor-pointer"
                    variant="outline"
                    disabled={currentPage === totalPages}
                    onClick={handleNext}
                >
                    Next
                </Button>
            </div>
        </div>
    );
}

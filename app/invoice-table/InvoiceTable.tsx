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
        <div className="bg-white shadow-md rounded-lg">
            <div className="">
            <table className="min-w-full text-sm rounded-lg">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="px-4 py-2 text-left">Manual Invoice Number</th>
                        <th className="px-4 py-2 text-left">Customer</th>
                        <th className="px-4 py-2 text-left">Total (OMR)</th>
                        <th className="px-4 py-2 text-left">Invoice Date</th>
                        <th className="px-4 py-2 text-left">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {invoices.map((invoice) => (
                        <tr key={invoice._id} className="border-b hover:bg-gray-50 h-12">
                            <td className="px-4 py-2">{invoice.manualInvoiceNumber || "-"}</td>
                            <td className="px-4 py-2">{invoice.customer?.name || "-"}</td>
                            <td className="px-4 py-2">{invoice.totalAmount?.toFixed(2)}</td>
                            <td className="px-4 py-2">{formatDate(invoice.invoiceDate)}</td>
                            <td className="px-4 py-2">
                                <button
                                    className="cursor-pointer text-[#800080] flex items-center gap-1 hover:bg-[#9811fa]/10 px-4 h-10 rounded-lg"
                                    onClick={() => { handleDownload(invoice, "TAX INVOICE"); handleDownload(invoice, "DELIVERY ORDER"); }}
                                >
                                    <Download className="w-4 h-4" /> Download
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            </div>

            {/* Pagination controls */}
            <div className="flex justify-end items-center gap-2 p-4">
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

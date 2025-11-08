import { useEffect, useState } from "react";
import { Invoice } from "../types/Invoice";
import { authApi } from "@/lib/api";
import jsPDF from "jspdf";
import { formatDate } from "@/utils/convert";
import autoTable from "jspdf-autotable";

export function useInvoice() {
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [loading, setLoading] = useState<boolean>(true);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [totalPages, setTotalPages] = useState(1);

    const fetchInvoices = async (page = 1, limit = 5) => {
        try {
            const res = await authApi.get(`/invoice/all?page=${page}&limit=${limit}`);
            setInvoices(res.data.invoices);
            setTotalPages(res.data.totalPages);
            setCurrentPage(res.data.currentPage);
        } catch (err: any) {
            console.log(err);
        } finally {
            setLoading(false);
        }
    };

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

    const handleNext = async () => {
        if (currentPage < totalPages) {
            const nextPage = currentPage + 1;
            await fetchInvoices(nextPage);
        }
    };

    const handlePrev = async () => {
        if (currentPage > 1) {
            const prevPage = currentPage - 1;
            await fetchInvoices(prevPage);
        }
    };


    useEffect(() => {
        fetchInvoices();
    }, []);

    return {
        currentPage,
        setCurrentPage,
        totalPages,
        loading,
        invoices,
        setInvoices,
        setLoading,
        handleDownload,
        handlePrev,
        handleNext
    }
}
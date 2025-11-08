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

        const headerHeight = 25;
        doc.addImage('/SCP Letterhead - Top.png', 'PNG', 0, 0, 210, headerHeight); 
        let currentY = headerHeight + 10;

        // Title
        doc.setFontSize(18);
        doc.text("Invoice", 14, currentY);
        currentY += 10;

        // Invoice Info
        doc.setFontSize(12);
        doc.text(`Invoice No: ${invoice.invoiceNumber}`, 14, currentY);
        currentY += 8;
        doc.text(`Invoice Date: ${formatDate(invoice.invoiceDate)}`, 14, currentY);
        currentY += 8;
        doc.text(`Supply Date: ${formatDate(invoice.supplyDate)}`, 14, currentY);
        currentY += 12;

        // Customer Info
        doc.setFontSize(14);
        doc.text("Customer Details", 14, currentY);
        currentY += 8;
        doc.setFontSize(12);
        doc.text(`Name: ${invoice.customer.name}`, 14, currentY);
        currentY += 8;
        doc.text(`Address: ${invoice.customer.address}`, 14, currentY);
        currentY += 8;
        doc.text(`Phone: ${invoice.customer.phone}`, 14, currentY);
        currentY += 8;
        doc.text(`Email: ${invoice.customer.email}`, 14, currentY);
        currentY += 13;

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
            startY: currentY,
            head: [["#", "Item Name", "Qty", "Price", "VAT", "Total"]],
            body: itemRows,
            theme: "striped",
        });

        const finalY = (doc as any).lastAutoTable.finalY || currentY;

        // Total Amount
        doc.setFontSize(14);
        doc.text(`Total Amount: OMR ${invoice.totalAmount.toFixed(2)}`, 14, finalY + 15);

        // Footer text (above footer image)
        doc.setFontSize(10);
        doc.text("Thank you for your business!", 14, finalY + 30);

        // 🔹 Add Footer Image
        const pageHeight = doc.internal.pageSize.getHeight();
        const footerHeight = 20;
        doc.addImage('/SCP Letterhead - Bottom.png', 'PNG', 0, pageHeight - footerHeight, 210, footerHeight);

        // Save PDF
        doc.save(`${invoice.invoiceNumber}.pdf`);
    };


    const handleNext = async () => {
        if (currentPage < totalPages) {
            setLoading(true);
            const nextPage = currentPage + 1;
            await fetchInvoices(nextPage, 5);
        }
    };

    const handlePrev = async () => {
        if (currentPage > 1) {
            setLoading(true);
            const prevPage = currentPage - 1;
            await fetchInvoices(prevPage, 5);
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
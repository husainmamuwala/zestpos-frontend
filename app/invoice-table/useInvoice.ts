/* eslint-disable @typescript-eslint/no-explicit-any */
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

  // ----------------------------------------------------------
  //  PDF GENERATION (TALLY PRIME STYLE)
  // ----------------------------------------------------------
  const handleDownload = (invoice: Invoice, title: string) => {
    const doc = new jsPDF("p", "mm", "a4");
    doc.setFont("times", "normal");

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 14;
    const headerHeight = 30; // more top space
    const footerHeight = 20;

    // Signature area dims
    const sigBoxWidth = 80;
    const sigBoxHeight = 15;
    const sigGapY = 8;
    const sigLabelsGap = 6;
    const sigUnderTextGap = 8;

    const reservedSignatureArea =
      sigGapY + sigLabelsGap + sigBoxHeight + sigUnderTextGap + 6;

    // ------------------------------
    //  HEADER IMAGE + TITLE
    // ------------------------------
    let currentY = headerHeight + 14; // extra top padding

    try {
      doc.addImage(
        "/SCP Letterhead - Top.png",
        "PNG",
        0,
        0,
        pageWidth,
        headerHeight
      );
    } catch (e) {}

    doc.setFont("times", "bold");
    doc.setFontSize(18);
    doc.text(title, pageWidth / 2, currentY, { align: "center" });

    doc.setFont("times", "normal");
    currentY += 14; // bottom padding

    // ------------------------------
    //  SUPPLIER + INVOICE META
    // ------------------------------
    const leftX = marginX;
    const rightColWidth = 80;
    const rightX = pageWidth - marginX - rightColWidth;

    doc.setFontSize(11);
    doc.setFont("times", "bold");
    doc.text("Supplier Details", leftX, currentY);

    let leftY = currentY + 8;
    doc.setFontSize(10);
    doc.setFont("times", "normal");

    if (invoice.customer?.name) {
      doc.text(`Name: ${invoice.customer.name || "-"}`, leftX, leftY);
      leftY += 6;
    }
    doc.text(`${invoice.customer?.address || "-"}`, leftX, leftY);
    leftY += 6;
    if (invoice.customer?.phone) {
      doc.text(`Phone: ${invoice.customer.phone || "-"}`, leftX, leftY);
      leftY += 6;
    }
    if (invoice.customer?.email) {
      doc.text(`Email: ${invoice.customer.email}`, leftX, leftY);
      leftY += 6;
    }

    // Invoice meta
    let rightY = currentY + 8;
    doc.setFont("times", "normal");
    if (invoice.manualInvoiceNumber) {
      doc.text(`Invoice No: ${invoice.manualInvoiceNumber}`, rightX, rightY);
      rightY += 6;
    }
    doc.text(
      `Invoice Date: ${formatDate(invoice.invoiceDate)}`,
      rightX,
      rightY
    );
    rightY += 6;
    doc.text(`Supply Date: ${formatDate(invoice.supplyDate)}`, rightX, rightY);
    rightY += 6;

    currentY = Math.max(leftY, rightY) + 8;

    // ------------------------------
    //  TABLE DATA
    // ------------------------------
    const itemRows = invoice.items.map((item, i) => {
      const vatAmt = (item.price * item.qty * (item.vat || 0)) / 100;
      return [
        i + 1,
        item.itemName,
        item.qty,
        item.price.toFixed(3),
        `${item.vat ?? 0}%`,
        vatAmt.toFixed(3),
        item.finalAmount.toFixed(3),
      ];
    });

    // footer drawing on each page
    const drawFooter = () => {
      try {
        doc.addImage(
          "/SCP Letterhead - Bottom.png",
          "PNG",
          0,
          pageHeight - footerHeight,
          pageWidth,
          footerHeight
        );
      } catch {}

      doc.setFont("times", "normal");
      doc.setFontSize(9);
      const pageNum = doc.getCurrentPageInfo
        ? doc.getCurrentPageInfo().pageNumber
        : doc.getNumberOfPages();
      doc.text(`Page ${pageNum}`, pageWidth / 2, pageHeight - 6, {
        align: "center",
      });
    };

    // TABLE column widths for Tally-style: item name wide
    const colWidths = {
      0: 10, // #
      1: 82, // ITEM NAME (wide)
      2: 14, // QTY
      3: 28, // PRICE
      4: 14, // VAT %
      5: 17, // VAT Amt
      6: 28, // Total
    };

    // ------------------------------
    //  AUTOTABLE (grid + smaller padding)
    // ------------------------------
    autoTable(doc, {
      startY: currentY,
      theme: "grid",
      head: [["#", "Item Name", "Qty", "Price", "VAT", "VAT Amt", "Total"]],
      body: itemRows,
      styles: {
        font: "times",
        fontSize: 10,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        fontSize: 10,
        cellPadding: 3, // reduce header height
      },
      columnStyles: {
        0: { halign: "center", cellWidth: colWidths[0] },
        1: { halign: "left", cellWidth: colWidths[1] },
        2: { halign: "center", cellWidth: colWidths[2] },
        3: { halign: "right", cellWidth: colWidths[3] },
        4: { halign: "center", cellWidth: colWidths[4] },
        5: { halign: "right", cellWidth: colWidths[5] },
        6: { halign: "right", cellWidth: colWidths[6] },
      },
      margin: {
        left: marginX,
        right: marginX,
        bottom: footerHeight + reservedSignatureArea,
      },
      didDrawPage: drawFooter,
      rowPageBreak: "avoid",
    });

    // last Y
    // @ts-ignore
    const finalY = doc.lastAutoTable.finalY;

    // ------------------------------
    //  TOTALS
    // ------------------------------
    const totalsX = pageWidth - marginX - 80;
    const totalY = finalY + 10;

    doc.setFont("times", "bold");
    doc.setFontSize(11);
    doc.text("Total Amount:", totalsX - 6, totalY);
    doc.text(
      `OMR ${Number(invoice.totalAmount || 0).toFixed(3)}`,
      pageWidth - marginX,
      totalY,
      { align: "right" }
    );
    doc.text("Total VAT:", totalsX - 12, totalY);
    doc.text(
      `OMR ${Number(invoice.totalVat || 0).toFixed(3)}`,
      pageWidth - marginX,
      totalY,
      { align: "right" }
    );

    // optional total VAT & taxable
    let extraY = totalY + 7;
    doc.setFont("times", "normal");
    if (invoice.taxableValue !== undefined) {
      doc.text("Taxable Value:", totalsX - 6, extraY);
      doc.text(
        `${Number(invoice.taxableValue).toFixed(3)}`,
        pageWidth - marginX,
        extraY,
        { align: "right" }
      );
      extraY += 7;
    }

    if (invoice.totalVat !== undefined) {
      doc.text("Total VAT:", totalsX - 6, extraY);
      doc.text(
        `${Number(invoice.totalVat).toFixed(3)}`,
        pageWidth - marginX,
        extraY,
        { align: "right" }
      );
      extraY += 7;
    }

    // ------------------------------
    //  SIGNATURE BOXES
    // ------------------------------
    let sigY = Math.max(extraY + 12, finalY + 18);

    if (
      sigY + sigBoxHeight + sigUnderTextGap >
      pageHeight - footerHeight - 10
    ) {
      doc.addPage();
      drawFooter();
      sigY = 40;
    }

    const sigLeftX = marginX;
    const sigRightX = pageWidth - marginX - sigBoxWidth;

    doc.setLineWidth(0.3);
    doc.rect(sigLeftX, sigY, sigBoxWidth, sigBoxHeight);
    doc.rect(sigRightX, sigY, sigBoxWidth, sigBoxHeight);

    doc.setFont("times", "normal");
    doc.setFontSize(10);
    doc.text("Authorised Signatory", sigLeftX, sigY - 3);
    doc.text("Customer Signature", sigRightX, sigY - 3);

    // Bottom text inside boxes
    doc.setFontSize(9);
    const padR = 4;
    const padB = 3;

    if (invoice.authorisedSignatoryName) {
      doc.text(
        invoice.authorisedSignatoryName,
        sigLeftX + sigBoxWidth - padR,
        sigY + sigBoxHeight - padB,
        { align: "right" }
      );
    }

    if (invoice.customerSignatoryName) {
      doc.text(
        invoice.customerSignatoryName,
        sigRightX + sigBoxWidth - padR,
        sigY + sigBoxHeight - padB,
        { align: "right" }
      );
    }

    drawFooter();
    doc.save(`${title}.pdf`);
  };

  // ----------------------------------------------------------
  // PAGINATION
  // ----------------------------------------------------------
  const handleNext = async () => {
    if (currentPage < totalPages) {
      setLoading(true);
      await fetchInvoices(currentPage + 1, 5);
    }
  };

  const handlePrev = async () => {
    if (currentPage > 1) {
      setLoading(true);
      await fetchInvoices(currentPage - 1, 5);
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
    handleNext,
  };
}

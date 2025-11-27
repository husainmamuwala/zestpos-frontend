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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (invoice: Invoice, title: string) => {
    const doc = new jsPDF();

    const pageWidth = doc.internal.pageSize.getWidth(); // typically 210mm for A4
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 14;
    const headerHeight = 25;
    const footerHeight = 20;

    // Signature area dimensions we want to reserve below the table
    const sigBoxWidth = 80;
    const sigBoxHeight = 15; // box height
    const sigGapY = 8; // gap above signatures after table
    const sigLabelsGap = 6; // label gap above boxes
    const sigUnderTextGap = 8; // small name/date line below boxes

    // Reserve some extra height so at least 1-2 rows appear on last page with the signatures.
    // Increase this if you want more rows guaranteed on last page.
    const reservedSignatureArea =
      sigGapY + sigLabelsGap + sigBoxHeight + sigUnderTextGap + 6; // total reserved height

    // Try to add top letterhead image (safe)
    let currentY = headerHeight + 10;
    currentY += 10;

    try {
      doc.addImage(
        "/SCP Letterhead - Top.png",
        "PNG",
        0,
        0,
        pageWidth,
        headerHeight
      );
    } catch (e) {
    }


    // Title centered
    doc.setFontSize(18);
    doc.text(title, pageWidth / 2, currentY, { align: "center" });
    currentY += 10;

    // Supplier (customer) on the left, invoice meta on the right
    const leftX = marginX;
    const rightColWidth = 80; // width allocated for right column
    const rightX = pageWidth - marginX - rightColWidth;

    // Supplier / Customer Details (left)
    doc.setFontSize(11);
    doc.setFont("Helvetica", "normal"); // or any other valid font name
    doc.text("Supplier Details", leftX, currentY);
    let leftY = currentY + 8;
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Name: ${invoice.customer.name || "-"}`, leftX, leftY);
    leftY += 7;
    doc.text(`Address: ${invoice.customer.address || "-"}`, leftX, leftY);
    leftY += 7;
    doc.text(`Phone: ${invoice.customer.phone || "-"}`, leftX, leftY);
    leftY += 7;
    if (invoice.customer.email) {
      doc.text(`Email: ${invoice.customer.email}`, leftX, leftY);
      leftY += 7;
    }

    // Invoice meta (right)
    let rightY = currentY + 8;
    doc.setFontSize(10);
    if (invoice.manualInvoiceNumber) {
      doc.text(`Invoice No: ${invoice.manualInvoiceNumber}`, rightX, rightY);
    }
    rightY += 7;
    doc.text(
      `Invoice Date: ${formatDate(invoice.invoiceDate)}`,
      rightX,
      rightY
    );
    rightY += 7;
    doc.text(`Supply Date: ${formatDate(invoice.supplyDate)}`, rightX, rightY);
    rightY += 7;

    // Move currentY down to max of leftY/rightY + small gap before table
    currentY = Math.max(leftY, rightY) + 8;

    // Items Table
    const itemRows = invoice.items.map((item, index) => {
      const vatAmount = ((item.price * item.qty) * item.vat) / 100;
      if (title === "Delivery Order") {
        return [
          index + 1,
          item.itemName,
          item.qty,
          item.price.toFixed(3),
          item.finalAmount.toFixed(3),
        ];
      }
      return [
        index + 1,
        item.itemName,
        item.qty,
        item.price.toFixed(3),
        `${item.vat}%`,
        vatAmount.toFixed(3),
        item.finalAmount.toFixed(3),
      ];
    });


    // draw footer on every page
    const drawFooterOnPage = (docInstance: jsPDF) => {
      try {
        docInstance.addImage(
          "/SCP Letterhead - Bottom.png",
          "PNG",
          0,
          pageHeight - footerHeight,
          pageWidth,
          footerHeight
        );
      } catch (e) {
        // ignore if footer image missing
      }
    };

    // Render table with bottom margin reserved for signatures + footer
    autoTable(doc, {
      startY: currentY,
      head: title === "Delivery Order" ? [["#", "Item Name", "Qty", "Price", "Total"]] : [["#", "Item Name", "Qty", "Price", "VAT", "VAT Amt", "Total"]],
      body: itemRows,
      theme: "striped",
      styles: { fontSize: 10 },
      margin: {
        left: marginX,
        right: marginX,
        bottom: footerHeight + reservedSignatureArea,
      },
      pageBreak: "auto",
      rowPageBreak: "avoid",
      didDrawPage: () => {
        // draw footer on every page
        drawFooterOnPage(doc);
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const finalY = (doc as any).lastAutoTable?.finalY || currentY;

    // Move to last page explicitly before adding totals/signatures
    const lastPageIndex = doc.getNumberOfPages();
    doc.setPage(lastPageIndex);

    // Total Amount (below table, left)
    const totalY = finalY + 12;
    doc.setFontSize(12);
    doc.text(
      `Total Amount: OMR ${invoice.totalAmount.toFixed(3)}`,
      marginX,
      totalY
    );

    // Signature boxes below table (ensure they don't overlap footer)
    let sigY = totalY + 20;

    // If signature area would overlap footer (shouldn't happen due to margin bottom),
    // move sigs up so they fit, or add a new page if absolutely necessary.
    if (
      sigY + sigBoxHeight + sigUnderTextGap >
      pageHeight - footerHeight - 10
    ) {
      // try to move to a new page but ensure some rows remain with signatures:
      // create a new page only if necessary (autotable should have left reserved space)
      doc.addPage();
      // draw footer on the new page as well
      drawFooterOnPage(doc);
      sigY = 40; // top area on new page
    }

    // Positions: left box (Authorised Signatory), right box (Customer Signature)
    const sigLeftX = marginX;
    const sigRightX = pageWidth - marginX - sigBoxWidth;

    // Draw rectangles for signature boxes
    doc.setLineWidth(0.2);
    doc.rect(sigLeftX, sigY, sigBoxWidth, sigBoxHeight); // Authorised Signatory
    doc.rect(sigRightX, sigY, sigBoxWidth, sigBoxHeight); // Customer Signature

    // Labels above each box
    doc.setFontSize(10);
    doc.text("Authorised Signatory", sigLeftX, sigY - 2);
    doc.text("Customer Signature", sigRightX, sigY - 2);

    // Put signatory names inside boxes in the bottom-right corner
    // Prefer explicit invoice fields if present, otherwise fallbacks
    doc.setFontSize(9);
    const paddingRight = 4; // small padding from right edge of box
    const paddingBottom = 3; // small padding from bottom edge of box

    drawFooterOnPage(doc);

    // Save PDF
    doc.save(`${title}.pdf`);
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
    handleNext,
  };
}

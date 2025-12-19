/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { Invoice } from "../types/Invoice";
import { authApi } from "@/lib/api";
import jsPDF from "jspdf";
import { formatDate } from "@/utils/convert";
import autoTable from "jspdf-autotable";

/**
 * useInvoice hook (final file)
 *
 * Tweak: total amount is now computed by summing (price * qty) for each item.
 * All other paddings/layout values & totals-in-table behavior preserved exactly.
 */
export function useInvoice() {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [totalPages, setTotalPages] = useState(1);

  const fetchInvoices = async (page = 1, limit = 10) => {
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
  // PDF GENERATION (clean & modular)
  // ----------------------------------------------------------
  const handleDownload = (invoice: Invoice, title: string) => {
    const doc = new jsPDF("p", "mm", "a4");
    doc.setFont("times", "semibold");

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // centralized layout - kept as provided
    const layout = {
      marginX: 14,
      headerHeight: 30,
      headerExtraGap: 10,
      footerHeight: 20,

      gapBetweenBoxes: 0,
      boxPadding: 4,
      minBoxHeight: 34,
      boxTitleOffset: 4,
      boxLineHeight: 6,
      boxTableGap: 2,

      tableCellPadding: 2,
      tableFontSize: 12,

      totalsBoxWidth: 60,
      totalsVerticalGap: 10,
      totalsLineHeight: 7,

      sigBoxWidth: 80,
      sigBoxHeight: 18,
      sigGapY: 8,
      sigLabelsGap: 6,
      sigUnderTextGap: 8,
      sigPadRight: 4,
      sigPadBottom: 3,
    };

    const headerBlockHeight = 20 + layout.headerExtraGap + 20;

    const marginX = layout.marginX;
    const headerHeight = layout.headerHeight;
    const footerHeight = layout.footerHeight;

    const sigBoxWidth = layout.sigBoxWidth;
    const sigBoxHeight = layout.sigBoxHeight;
    const sigGapY = layout.sigGapY;
    const sigLabelsGap = layout.sigLabelsGap;
    const sigUnderTextGap = layout.sigUnderTextGap;

    const reservedSignatureArea =
      sigGapY + sigLabelsGap + sigBoxHeight + sigUnderTextGap + 6;

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
    };

    const drawHeaderImageAndTitle = (titleText: string, startY: number) => {
      try {
        doc.addImage("/SCP Letterhead - Top.png", "PNG", 0, 0, pageWidth, headerHeight);
      } catch {}
      doc.setFont("times", "bold");
      doc.setFontSize(18);
      doc.text(titleText, pageWidth / 2, startY, { align: "center" });
    };

    const computeColWidths = (percents: number[]) => {
      const printableWidth = pageWidth - marginX * 2;
      const colWidths: Record<number, number> = {};
      percents.forEach((p, idx) => {
        colWidths[idx] = Math.floor((p / 100) * printableWidth);
      });
      const sum = Object.values(colWidths).reduce((a, b) => a + b, 0);
      const diff = Math.round(printableWidth - sum);
      if (diff !== 0 && colWidths[1] !== undefined) {
        colWidths[1] += diff;
      }
      return colWidths;
    };

    // ---------- SUPPLIER + INVOICE BOXES (UNCHANGED) ----------
    const drawBoxes = (startY: number) => {
      const gapBetweenBoxes = layout.gapBetweenBoxes;
      const boxWidth = (pageWidth - marginX * 2 - gapBetweenBoxes) / 2;
      const boxLeftX = marginX;
      const boxRightX = marginX + boxWidth + gapBetweenBoxes;
      const boxPadding = layout.boxPadding;

      const leftLines: string[] = [];
      leftLines.push("Supplier Details");
      if (invoice.customer?.name) leftLines.push(`${invoice.customer.name || "-"}`);
      const address = invoice.customer?.address || "-";
      address.split("\n").forEach((ln) => leftLines.push(ln || "-"));
      if (invoice.customer?.phone) leftLines.push(`Phone: ${invoice.customer.phone}`);
      if (invoice.customer?.email) leftLines.push(`Email: ${invoice.customer.email}`);
      if (invoice?.referenceNumber)
        leftLines.push(`Reference Number: ${invoice.referenceNumber}`);

      const rightLines: string[] = [];
      rightLines.push("Invoice Details");
      if (invoice.manualInvoiceNumber)
        rightLines.push(`Invoice No: ${invoice.manualInvoiceNumber}`);
      rightLines.push(`Invoice Date: ${formatDate(invoice.invoiceDate)}`);
      rightLines.push(`Supply Date: ${formatDate(invoice.supplyDate)}`);

      const leftHeight = leftLines.length * layout.boxLineHeight + boxPadding * 2;
      const rightHeight = rightLines.length * layout.boxLineHeight + boxPadding * 2;
      const usedBoxHeight = Math.max(leftHeight, rightHeight, layout.minBoxHeight);

      doc.setLineWidth(0.2);
      doc.rect(boxLeftX, startY, boxWidth, usedBoxHeight);
      doc.rect(boxRightX, startY, boxWidth, usedBoxHeight);

      let cursorY = startY + boxPadding + layout.boxTitleOffset;
      doc.setFont("times", "bold");
      doc.setFontSize(12);
      doc.text(leftLines[0], boxLeftX + boxPadding, cursorY);
      doc.setFont("times", "semibold");
      doc.setFontSize(12);
      cursorY += layout.boxLineHeight;
      for (let i = 1; i < leftLines.length; i++) {
        doc.text(leftLines[i], boxLeftX + boxPadding, cursorY);
        cursorY += layout.boxLineHeight;
      }

      cursorY = startY + boxPadding + layout.boxTitleOffset;
      doc.setFont("times", "bold");
      doc.setFontSize(12);
      doc.text(rightLines[0], boxRightX + boxPadding, cursorY);
      doc.setFont("times", "semibold");
      doc.setFontSize(12);
      cursorY += layout.boxLineHeight;
      for (let i = 1; i < rightLines.length; i++) {
        doc.text(rightLines[i], boxRightX + boxPadding, cursorY);
        cursorY += layout.boxLineHeight;
      }

      return startY + usedBoxHeight + layout.boxTableGap;
    };

    // ---------- TABLE ----------
    const generateItemRows = () => {
      return invoice.items.map((item: any, i: number) => {
        const priceNum = Number(item.price || 0);
        const qtyNum = Number(item.qty || 0);
        const lineTotal = priceNum * qtyNum;
        const vatAmt = (lineTotal * (item.vat || 0)) / 100;
        return [
          i + 1,
          item.itemName,
          item.qty,
          priceNum.toFixed(3),
          lineTotal.toFixed(3),
          `${item.vat ?? 0}%`,
          vatAmt.toFixed(3),
        ];
      });
    };

    const drawTable = (startY: number) => {
      const itemRows = generateItemRows();

      const totalItemAmt = invoice.items.reduce(
        (s: number, it: any) => s + Number(it.price || 0) * Number(it.qty || 0),
        0
      );

      const totalVatAmt = invoice.items.reduce(
        (s: number, it: any) =>
          s + ((Number(it.price || 0) * Number(it.qty || 0) * Number(it.vat || 0)) / 100),
        0
      );

      const grandTotal = Number(invoice.totalAmount ?? totalItemAmt + totalVatAmt);

      const isTaxInvoice = title === "TAX INVOICE";
      const TOTAL_LABEL_COL = isTaxInvoice? 3 : 2;
      const TOTAL_VALUE_COL = isTaxInvoice ? 5 : 3;

      const totalsRows = isTaxInvoice
        ? [
            ["", "", "", "Total Amount:", "", `OMR ${totalItemAmt.toFixed(3)}`, ""],
            ["", "", "", "Total VAT:", "", `OMR ${totalVatAmt.toFixed(3)}`, ""],
            ["", "", "", "Grand Total:", "", `OMR ${grandTotal.toFixed(3)}`, ""],
          ]
        : [
            ["", "", "Total Amount:", "", `OMR ${totalItemAmt.toFixed(3)}`],
            // ["", "", "", "Total VAT:", `OMR ${totalVatAmt.toFixed(3)}`],
            ["", "", "Grand Total:", "", `OMR ${grandTotal.toFixed(3)}`],
          ];

      const body = [...itemRows, ...totalsRows];

      const colPercents = isTaxInvoice
        ? [5, 44, 10, 10, 11, 10, 10]
        : [5, 64, 10, 12, 10];

      const colWidthsDynamic = computeColWidths(colPercents);

      autoTable(doc, {
        startY,
        theme: "grid",
        head: isTaxInvoice
          ? [["Sr", "Item Name", "Qty", "Price", "Amount", "VAT", "VAT Amt"]]
          : [["Sr", "Item Name", "Qty", "Price", "Amount"]],
        body,
        styles: {
          font: "times",
          fontSize: layout.tableFontSize,
          cellPadding: layout.tableCellPadding,
          lineColor: [0, 0, 0],
          lineWidth: 0.2,
          textColor: [0, 0, 0],
        },
        headStyles: {
          fillColor: [240, 240, 240],
          textColor: [0, 0, 0],
          lineColor: [0, 0, 0],
          fontStyle: "bold",
          lineWidth: 0.2,
          fontSize: 10,
          cellPadding: 2,
          halign: "center",
        },
        columnStyles: {
          0: { halign: "center", cellWidth: colWidthsDynamic[0] },
          1: { halign: "left", cellWidth: colWidthsDynamic[1] },
          2: { halign: "center", cellWidth: colWidthsDynamic[2] },
          3: { halign: "right", cellWidth: colWidthsDynamic[3] },
          4: { halign: "right", cellWidth: colWidthsDynamic[4] },
          ...(isTaxInvoice && {
            5: { halign: "center", cellWidth: colWidthsDynamic[5] },
            6: { halign: "center", cellWidth: colWidthsDynamic[6] },
          }),
        },
        margin: {
          top: headerBlockHeight,
          left: marginX,
          right: marginX,
          bottom: footerHeight + reservedSignatureArea,
        },
        didDrawPage: () => {
          drawHeaderImageAndTitle(title, headerHeight + layout.headerExtraGap);
          drawFooter();
        },
        rowPageBreak: "avoid",

        didParseCell(data) {
          const isTotalsRow = data.row.index >= itemRows.length;

          if (isTotalsRow) {
            if (data.column.index === TOTAL_LABEL_COL) {
              data.cell.colSpan = isTaxInvoice ? 2 : 2;
              data.cell.styles.fontStyle = "bold";
              data.cell.styles.halign = "right";
            }
            if (data.column.index === TOTAL_VALUE_COL) {
              data.cell.colSpan = isTaxInvoice ? 2 : 1;
              data.cell.styles.fontStyle = "bold";
              data.cell.styles.halign = "right";
            }
          }
        },
      });

      return (doc as any).lastAutoTable?.finalY || startY;
    };

    // ---------- SIGNATURES ----------
    const drawSignatures = (afterY: number) => {
      let sigY = Math.max(
        afterY + 20,
        (doc as any).lastAutoTable?.finalY
          ? (doc as any).lastAutoTable.finalY + 20
          : afterY + 20
      );

      if (sigY + sigBoxHeight + sigUnderTextGap > pageHeight - footerHeight - 10) {
        doc.addPage();
        drawFooter();
        sigY = 40;
      }

      const sigLeftX = marginX;
      const sigRightX = pageWidth - marginX - sigBoxWidth;

      doc.setLineWidth(0.2);
      doc.rect(sigLeftX, sigY, sigBoxWidth, sigBoxHeight);
      doc.rect(sigRightX, sigY, sigBoxWidth, sigBoxHeight);

      doc.setFont("times", "semibold");
      doc.setFontSize(12);
      doc.text("Authorised Signatory", sigLeftX, sigY - 3);
      doc.text("Customer Signature", sigRightX, sigY - 3);

      doc.setFontSize(9);
      const padR = layout.sigPadRight;
      const padB = layout.sigPadBottom;

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
    };

    // ---------- FLOW ----------
    let currentY = headerHeight + layout.headerExtraGap;
    drawHeaderImageAndTitle(title, currentY);
    currentY += layout.headerExtraGap;

    currentY = drawBoxes(currentY);
    const afterTableY = drawTable(currentY);
    drawSignatures(afterTableY);

    drawFooter();
    doc.save(`${title}.pdf`);
  };

  // ----------------------------------------------------------
  // PAGINATION
  // ----------------------------------------------------------
  const handleNext = async () => {
    if (currentPage < totalPages) {
      setLoading(true);
      await fetchInvoices(currentPage + 1, 10);
    }
  };

  const handlePrev = async () => {
    if (currentPage > 1) {
      setLoading(true);
      await fetchInvoices(currentPage - 1, 10);
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

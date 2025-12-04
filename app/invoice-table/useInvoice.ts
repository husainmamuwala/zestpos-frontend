/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { Invoice } from "../types/Invoice";
import { authApi } from "@/lib/api";
import jsPDF from "jspdf";
import { formatDate } from "@/utils/convert";
import autoTable from "jspdf-autotable";

/**
 * Cleaned and modularized version of your useInvoice hook.
 * Tweak layout constants inside `layout` object.
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
  //  PDF GENERATION (clean & modular)
  // ----------------------------------------------------------
  const handleDownload = (invoice: Invoice, title: string) => {
    const doc = new jsPDF("p", "mm", "a4");
    doc.setFont("times", "normal");

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // centralized layout - tweak here
    const layout = {
      // page margins & header/footer
      marginX: 14,
      headerHeight: 30,
      headerExtraGap: 10, // extra space after header/title
      footerHeight: 20,

      // boxes (supplier, invoice meta)
      gapBetweenBoxes: 0,
      boxPadding: 4,
      minBoxHeight: 34,
      boxTitleOffset: 4,
      boxLineHeight: 6,
      boxTableGap: 2, // gap between bottom of boxes and table

      // table defaults
      tableCellPadding: 2,
      tableFontSize: 10,

      // totals
      totalsBoxWidth: 60,
      totalsVerticalGap: 10,
      totalsLineHeight: 7,

      // signature area
      sigBoxWidth: 80,
      sigBoxHeight: 15,
      sigGapY: 8,
      sigLabelsGap: 6,
      sigUnderTextGap: 8,
      sigPadRight: 4,
      sigPadBottom: 3,
    };

    // simple references
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

    // helper: draw footer (used as didDrawPage)
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
      } catch (e) {
        // ignore
      }

      // doc.setFont("times", "normal");
      // doc.setFontSize(9);
      // const pageNum =
      //   (doc.getCurrentPageInfo && doc.getCurrentPageInfo().pageNumber) ||
      //   doc.getNumberOfPages();
      // doc.text(`Page ${pageNum}`, pageWidth / 2, pageHeight - 6, {
      //   align: "center",
      // });
    };

    // draw header image + centered title
    const drawHeaderImageAndTitle = (titleText: string, startY: number) => {
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
        // ignore
      }
      doc.setFont("times", "bold");
      doc.setFontSize(18);
      doc.text(titleText, pageWidth / 2, startY, { align: "center" });
    };

    // compute column widths once (no redeclare)
    const computeColWidths = (percents: number[]) => {
      const printableWidth = pageWidth - marginX * 2;
      const colWidths: Record<number, number> = {};
      percents.forEach((p, idx) => {
        colWidths[idx] = Math.floor((p / 100) * printableWidth);
      });
      // fix rounding diff: add leftover to item name column index 1
      const sum = Object.values(colWidths).reduce((a, b) => a + b, 0);
      const diff = Math.round(printableWidth - sum);
      if (diff !== 0 && colWidths[1] !== undefined) {
        colWidths[1] += diff;
      }
      return colWidths;
    };

    // draw supplier & invoice boxes (compute height from contents)
    const drawBoxes = (startY: number) => {
      const gapBetweenBoxes = layout.gapBetweenBoxes;
      const boxWidth = (pageWidth - marginX * 2 - gapBetweenBoxes) / 2;
      const boxLeftX = marginX;
      const boxRightX = marginX + boxWidth + gapBetweenBoxes;
      const boxPadding = layout.boxPadding;

      // gather left content lines
      const leftLines: string[] = [];
      leftLines.push("Supplier Details"); // title (we will bold it)
      if (invoice.customer?.name)
        leftLines.push(`Name: ${invoice.customer.name || "-"}`);
      const address = invoice.customer?.address || "-";
      address.split("\n").forEach((ln) => leftLines.push(ln || "-"));
      if (invoice.customer?.phone)
        leftLines.push(`Phone: ${invoice.customer.phone}`);
      if (invoice.customer?.email)
        leftLines.push(`Email: ${invoice.customer.email}`);

      // gather right content lines
      const rightLines: string[] = [];
      rightLines.push("Invoice Details"); // title
      if (invoice.manualInvoiceNumber)
        rightLines.push(`Invoice No: ${invoice.manualInvoiceNumber}`);
      rightLines.push(`Invoice Date: ${formatDate(invoice.invoiceDate)}`);
      rightLines.push(`Supply Date: ${formatDate(invoice.supplyDate)}`);

      // estimate height (lines * lineHeight) + paddings
      const leftHeight =
        leftLines.length * layout.boxLineHeight + boxPadding * 2;
      const rightHeight =
        rightLines.length * layout.boxLineHeight + boxPadding * 2;
      const usedBoxHeight = Math.max(
        leftHeight,
        rightHeight,
        layout.minBoxHeight
      );

      // draw boxes first
      doc.setLineWidth(0.2);
      doc.rect(boxLeftX, startY, boxWidth, usedBoxHeight);
      doc.rect(boxRightX, startY, boxWidth, usedBoxHeight);

      // draw left content
      let cursorY = startY + boxPadding + layout.boxTitleOffset;
      doc.setFont("times", "bold");
      doc.setFontSize(11);
      doc.text(leftLines[0], boxLeftX + boxPadding, cursorY);
      doc.setFont("times", "normal");
      doc.setFontSize(10);
      cursorY += layout.boxLineHeight;
      for (let i = 1; i < leftLines.length; i++) {
        doc.text(leftLines[i], boxLeftX + boxPadding, cursorY);
        cursorY += layout.boxLineHeight;
      }

      // draw right content
      cursorY = startY + boxPadding + layout.boxTitleOffset;
      doc.setFont("times", "bold");
      doc.setFontSize(11);
      doc.text(rightLines[0], boxRightX + boxPadding, cursorY);
      doc.setFont("times", "normal");
      doc.setFontSize(10);
      cursorY += layout.boxLineHeight;
      for (let i = 1; i < rightLines.length; i++) {
        doc.text(rightLines[i], boxRightX + boxPadding, cursorY);
        cursorY += layout.boxLineHeight;
      }

      // return the Y coordinate after boxes (used to position table)
      return startY + usedBoxHeight + layout.boxTableGap;
    };

    // build table rows array from invoice items
    let totalvatamt = 0;
    let totalItemAmt = 0;
    const generateItemRows = () => {
      return invoice.items.map((item, i) => {
        const vatAmt = (item.price * item.qty * (item.vat || 0)) / 100;
        totalvatamt += Number(vatAmt.toFixed(3));
        totalItemAmt += Number(item.price.toFixed(3));
        return [
          i + 1,
          item.itemName,
          item.qty,
          Number(item.price).toFixed(3),
          `${item.vat ?? 0}%`,
          vatAmt.toFixed(3),
          Number(item.finalAmount).toFixed(3),
        ];
      });
    };


    // draw table (autoTable) with per-column padding + didParseCell tweaks
    const drawTable = (startY: number) => {
      const itemRows = generateItemRows();

      // column percent allocation: tweak these if needed
      const colPercents = [5, 40, 10, 12, 10, 12, 12];
      const colWidthsDynamic = computeColWidths(colPercents);

      autoTable(doc, {
        startY,
        theme: "grid",
        head: [["#", "Item Name", "Qty", "Price", "VAT", "VAT Amt", "Total"]],
        body: itemRows,
        styles: {
          font: "times",
          fontSize: layout.tableFontSize,
          cellPadding: layout.tableCellPadding,
          lineColor: [0, 0, 0],
        },
        headStyles: {
          fillColor: [240, 240, 240], // <-- TRANSPARENT HEADER (no background)
          textColor: [0, 0, 0], // black text
          lineColor: [0, 0, 0], // black header borders
          fontStyle: "bold",
          lineWidth: 0.1,
          fontSize: 9,
          cellPadding: 2,
          halign: "center",
        },
        columnStyles: {
          0: { halign: "center", cellWidth: colWidthsDynamic[0] },
          1: { halign: "left", cellWidth: colWidthsDynamic[1] },
          2: { halign: "center", cellWidth: colWidthsDynamic[2] },
          3: { halign: "right", cellWidth: colWidthsDynamic[3] },
          4: { halign: "center", cellWidth: colWidthsDynamic[4] },
          5: { halign: "right", cellWidth: colWidthsDynamic[5] },
          6: { halign: "right", cellWidth: colWidthsDynamic[6] },
        },
        margin: {
          left: marginX,
          right: marginX,
          bottom: footerHeight + reservedSignatureArea,
        },
        didDrawPage: drawFooter,
        rowPageBreak: "avoid",

        // fine-grained per-cell adjustments
        // didParseCell: function (data) {
        //   // body: tighter vertical padding for numeric columns (price/total)
        //   if (data.section === "body" && (data.column.index === 3 || data.column.index === 6)) {
        //     data.cell.styles.cellPadding = 2;
        //   }
        //   // body: item name more airy
        //   if (data.section === "body" && data.column.index === 1) {
        //     data.cell.styles.cellPadding = { top: 6, right: 8, bottom: 6, left: 8 };
        //   }
        //   // header: compact numeric headers
        //   if (data.section === "head" && [2, 3, 4, 5, 6].includes(data.column.index)) {
        //     data.cell.styles.cellPadding = { top: 4, right: 6, bottom: 4, left: 6 };
        //   }
        // },
      });
    };

    // draw totals area
    const drawTotals = () => {
      const finalY = (doc as any).lastAutoTable?.finalY || 0;
      const totalsY = finalY + layout.totalsVerticalGap;
      const totalsLineHeight = layout.totalsLineHeight;
      const totalsXRight = pageWidth - marginX;

      const totalsRows: Array<{ label: string; value: string }> = [];

      totalsRows.push({
        label: "Total Amount:",
        value: `OMR ${Number(totalItemAmt.toFixed(3))}`,
      });

      totalsRows.push({
        label: "Total VAT:",
        value: `OMR ${Number(totalvatamt.toFixed(3))}`,
      });

      totalsRows.push({
        label: "Grand Total:",
        value: `OMR ${Number(invoice.totalAmount || 0).toFixed(3)}`,
      });

      // Draw stacked totals; make final one prominent
      totalsRows.forEach((row, idx) => {
        const y = totalsY + idx * totalsLineHeight;
        const labelX = totalsXRight - layout.totalsBoxWidth;
        if (idx === totalsRows.length - 1) {
          doc.setFont("times", "bold");
          doc.setFontSize(10);
          doc.text(row.label, labelX, y);
          doc.text(row.value, totalsXRight, y, { align: "right" });
          doc.setFont("times", "normal");
          doc.setFontSize(10);
        } else {
          doc.setFont("times", "normal");
          doc.setFontSize(10);
          doc.text(row.label, labelX, y);
          doc.text(row.value, totalsXRight, y, { align: "right" });
        }
      });

      return (
        (doc as any).lastAutoTable?.finalY ||
        totalsY + totalsRows.length * totalsLineHeight
      );
    };

    // draw signatures boxes
    const drawSignatures = (afterY: number) => {
      let sigY = Math.max(
        afterY + 36,
        (doc as any).lastAutoTable?.finalY
          ? (doc as any).lastAutoTable.finalY + 36
          : afterY + 36
      );

      // if not enough room for signatures on this page, add new page
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

      doc.setLineWidth(0.2);
      doc.rect(sigLeftX, sigY, sigBoxWidth, sigBoxHeight);
      doc.rect(sigRightX, sigY, sigBoxWidth, sigBoxHeight);

      doc.setFont("times", "normal");
      doc.setFontSize(10);
      doc.text("Authorised Signatory", sigLeftX, sigY - 3);
      doc.text("Customer Signature", sigRightX, sigY - 3);

      // bottom text inside boxes
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

    // ---------- Execution flow ----------
    let currentY = headerHeight + layout.headerExtraGap;
    drawHeaderImageAndTitle(title, currentY);
    currentY += layout.headerExtraGap;

    // draw boxes and advance currentY
    currentY = drawBoxes(currentY);

    // draw table below boxes
    drawTable(currentY);

    // draw totals (below table)
    const afterTotalsY = drawTotals();

    // draw signatures
    drawSignatures(afterTotalsY);

    // final footer & save
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

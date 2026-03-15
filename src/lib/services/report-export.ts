import { Workbook } from "exceljs";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import { ExportRow } from "@/lib/utils/report-transform";

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function savePdfBlobWithFallback(pdf: jsPDF, fileName: string) {
  const blob = pdf.output("blob");
  const file = new File([blob], fileName, { type: "application/pdf" });
  const canUseShareFiles =
    typeof navigator !== "undefined" &&
    "share" in navigator &&
    "canShare" in navigator &&
    navigator.canShare({ files: [file] });

  if (canUseShareFiles) {
    try {
      await navigator.share({
        files: [file],
        title: fileName,
      });
      return;
    } catch {
      // Continue to fallback download/open flow.
    }
  }

  downloadBlob(blob, fileName);
  window.setTimeout(() => {
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
  }, 250);
}

export async function downloadReportXLSX(params: {
  rows: ExportRow[];
  printKeterangan: string;
  monthlyTotal: number;
  username: string;
  formatDateWITA: () => string;
}) {
  const { rows, printKeterangan, monthlyTotal, username, formatDateWITA } = params;

  const workbook = new Workbook();
  const worksheet = workbook.addWorksheet("Laundry Report");

  worksheet.addRow([
    "No",
    "Tanggal",
    "Jumlah Nota",
    "No Kamar",
    "Satuan",
    "Harga",
    "Harga Total Harian",
    "Total Keseluruhan",
    "Keterangan",
  ]);

  rows.forEach((row) => {
    worksheet.addRow([
      row.no,
      row.tanggal,
      row.jumlahNota,
      row.noKamar,
      row.satuan,
      row.harga,
      row.totalHarian,
      row.totalKeseluruhan,
      row.keterangan,
    ]);
  });

  worksheet.addRow(["", "", "", "", "", "", "", "Keterangan", printKeterangan]);
  worksheet.addRow(["", "", "", "", "", "", "", "Total Bulanan", monthlyTotal]);
  worksheet.addRow(["", "", "", "", "", "", "", `TTD ${username}`, formatDateWITA()]);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  downloadBlob(blob, "laundry-report.xlsx");
}

export async function saveReportPDF(element: HTMLElement) {
  const fileName = element.getAttribute("data-pdf-file-name") || "laundry-report.pdf";
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
  });
  const pdf = new jsPDF("p", "pt", "a4");
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const margin = 16;
  const pageContentWidthPt = pdfWidth - margin * 2;
  const pageContentHeightPt = pdfHeight - margin * 2;

  const pxPerPt = canvas.width / pageContentWidthPt;
  const pageSliceHeightPx = Math.max(1, Math.floor(pageContentHeightPt * pxPerPt));

  let offsetY = 0;
  let pageIndex = 0;

  while (offsetY < canvas.height) {
    const sliceHeightPx = Math.min(pageSliceHeightPx, canvas.height - offsetY);
    const sliceCanvas = document.createElement("canvas");
    sliceCanvas.width = canvas.width;
    sliceCanvas.height = sliceHeightPx;

    const sliceContext = sliceCanvas.getContext("2d");
    if (!sliceContext) {
      throw new Error("Failed to create canvas context for PDF slice.");
    }

    sliceContext.drawImage(
      canvas,
      0,
      offsetY,
      canvas.width,
      sliceHeightPx,
      0,
      0,
      canvas.width,
      sliceHeightPx,
    );

    const sliceImgData = sliceCanvas.toDataURL("image/png");
    const sliceHeightPt = (sliceHeightPx * pageContentWidthPt) / canvas.width;

    if (pageIndex > 0) {
      pdf.addPage();
    }
    pdf.addImage(sliceImgData, "PNG", margin, margin, pageContentWidthPt, sliceHeightPt);

    offsetY += sliceHeightPx;
    pageIndex += 1;
  }

  await savePdfBlobWithFallback(pdf, fileName);
}

"use client";

import { useState } from "react";

interface ExportButtonsProps {
  report: string;
  toyName?: string;
}

export default function ExportButtons({ report, toyName }: ExportButtonsProps) {
  const [pdfLoading, setPdfLoading] = useState(false);
  const [wordLoading, setWordLoading] = useState(false);

  const filename = toyName
    ? `تقرير-${toyName.replace(/\s+/g, "-")}`
    : "تقرير-تقييم-اللعبة";

  const handlePdf = async () => {
    setPdfLoading(true);
    try {
      const { default: html2canvas } = await import("html2canvas");
      const { default: jsPDF } = await import("jspdf");

      const element = document.getElementById("report-content");
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const contentWidth = pageWidth - 2 * margin;
      const imgHeight = (canvas.height * contentWidth) / canvas.width;

      let yOffset = 0;
      let pageNum = 0;

      while (yOffset < imgHeight) {
        if (pageNum > 0) pdf.addPage();

        pdf.addImage(
          imgData,
          "JPEG",
          margin,
          margin - (yOffset / imgHeight) * imgHeight,
          contentWidth,
          imgHeight
        );

        yOffset += pageHeight - 2 * margin;
        pageNum++;
      }

      pdf.save(`${filename}.pdf`);
    } finally {
      setPdfLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleWord = async () => {
    setWordLoading(true);
    try {
      const { generateWordReport } = await import("@/lib/word-generator");
      await generateWordReport(report, filename);
    } catch (err) {
      console.error("Word generation error:", err);
      alert("حدث خطأ أثناء إنشاء ملف Word. يرجى المحاولة مرة أخرى.");
    } finally {
      setWordLoading(false);
    }
  };

  return (
    <div
      className="no-print flex flex-wrap gap-3 justify-center"
      dir="rtl"
    >
      <button
        onClick={handlePdf}
        disabled={pdfLoading}
        className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-xl font-semibold shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 disabled:cursor-not-allowed"
      >
        {pdfLoading ? (
          <>
            <span className="animate-spin">⏳</span>
            <span>جارٍ التصدير...</span>
          </>
        ) : (
          <>
            <span>📄</span>
            <span>تصدير PDF</span>
          </>
        )}
      </button>

      <button
        onClick={handlePrint}
        className="flex items-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-semibold shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5"
      >
        <span>🖨️</span>
        <span>طباعة / PDF طباعة</span>
      </button>

      <button
        onClick={handleWord}
        disabled={wordLoading}
        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-semibold shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 disabled:cursor-not-allowed"
      >
        {wordLoading ? (
          <>
            <span className="animate-spin">⏳</span>
            <span>جارٍ الإنشاء...</span>
          </>
        ) : (
          <>
            <span>📝</span>
            <span>تصدير Word</span>
          </>
        )}
      </button>
    </div>
  );
}

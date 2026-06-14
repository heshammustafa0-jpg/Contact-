"use client";

import { useRef } from "react";

interface ReportDisplayProps {
  report: string;
}

function renderMarkdown(text: string): string {
  const lines = text.split("\n");
  const html: string[] = [];
  let inTable = false;
  let tableBuffer: string[] = [];
  let inBlockquote = false;

  const renderTableBuffer = () => {
    if (tableBuffer.length < 2) return;
    html.push('<div class="overflow-x-auto my-4">');
    html.push('<table class="w-full border-collapse text-sm">');

    let isHeader = true;
    for (const tLine of tableBuffer) {
      const isSep = /^\|[\s\-|:]+\|$/.test(tLine.trim());
      if (isSep) {
        isHeader = false;
        continue;
      }
      const cells = tLine
        .split("|")
        .filter((_, i, a) => i > 0 && i < a.length - 1)
        .map((c) => c.trim());

      if (isHeader) {
        html.push("<thead><tr>");
        cells.forEach((cell) => {
          html.push(
            `<th class="border border-montessori-green bg-montessori-green text-white px-3 py-2 text-right font-semibold">${renderInline(cell)}</th>`
          );
        });
        html.push("</tr></thead><tbody>");
      } else {
        html.push(
          '<tr class="even:bg-montessori-cream hover:bg-amber-50 transition-colors">'
        );
        cells.forEach((cell) => {
          html.push(
            `<td class="border border-gray-200 px-3 py-2 text-right">${renderInline(cell)}</td>`
          );
        });
        html.push("</tr>");
      }
    }
    html.push("</tbody></table></div>");
    tableBuffer = [];
  };

  const renderInline = (s: string): string => {
    return s
      .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-montessori-green">$1</strong>')
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 rounded text-sm font-mono">$1</code>');
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("|")) {
      if (inBlockquote) {
        html.push("</blockquote>");
        inBlockquote = false;
      }
      inTable = true;
      tableBuffer.push(line);
      continue;
    }

    if (inTable) {
      renderTableBuffer();
      inTable = false;
    }

    if (!trimmed) {
      if (inBlockquote) {
        html.push("</blockquote>");
        inBlockquote = false;
      }
      html.push('<div class="h-3"></div>');
      continue;
    }

    if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
      if (inBlockquote) {
        html.push("</blockquote>");
        inBlockquote = false;
      }
      html.push('<hr class="border-montessori-gold my-6 border-t-2" />');
      continue;
    }

    if (trimmed.startsWith("# ")) {
      if (inBlockquote) {
        html.push("</blockquote>");
        inBlockquote = false;
      }
      html.push(
        `<h1 class="text-2xl font-bold text-montessori-green mt-6 mb-3 pb-2 border-b-2 border-montessori-gold">${renderInline(trimmed.slice(2))}</h1>`
      );
      continue;
    }

    if (trimmed.startsWith("## ")) {
      if (inBlockquote) {
        html.push("</blockquote>");
        inBlockquote = false;
      }
      html.push(
        `<h2 class="text-xl font-bold text-montessori-green mt-5 mb-2">${renderInline(trimmed.slice(3))}</h2>`
      );
      continue;
    }

    if (trimmed.startsWith("### ")) {
      if (inBlockquote) {
        html.push("</blockquote>");
        inBlockquote = false;
      }
      html.push(
        `<h3 class="text-lg font-semibold text-montessori-green-light mt-4 mb-2">${renderInline(trimmed.slice(4))}</h3>`
      );
      continue;
    }

    if (trimmed.startsWith("#### ")) {
      if (inBlockquote) {
        html.push("</blockquote>");
        inBlockquote = false;
      }
      html.push(
        `<h4 class="text-base font-semibold text-montessori-earth mt-3 mb-1">${renderInline(trimmed.slice(5))}</h4>`
      );
      continue;
    }

    if (trimmed.startsWith("> ")) {
      if (!inBlockquote) {
        html.push(
          '<blockquote class="border-r-4 border-montessori-gold bg-amber-50 px-4 py-3 my-3 rounded-r-lg text-montessori-earth italic">'
        );
        inBlockquote = true;
      }
      html.push(`<p>${renderInline(trimmed.slice(2))}</p>`);
      continue;
    }

    if (inBlockquote && !trimmed.startsWith("> ")) {
      html.push("</blockquote>");
      inBlockquote = false;
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      html.push(
        `<li class="mr-5 mb-1 text-gray-700 list-disc marker:text-montessori-gold">${renderInline(trimmed.slice(2))}</li>`
      );
      continue;
    }

    if (/^\d+\.\s/.test(trimmed)) {
      const content = trimmed.replace(/^\d+\.\s/, "");
      html.push(
        `<li class="mr-5 mb-1 text-gray-700 list-decimal marker:text-montessori-green">${renderInline(content)}</li>`
      );
      continue;
    }

    html.push(
      `<p class="text-gray-700 leading-relaxed my-1">${renderInline(trimmed)}</p>`
    );
  }

  if (inTable) renderTableBuffer();
  if (inBlockquote) html.push("</blockquote>");

  return html.join("\n");
}

export default function ReportDisplay({ report }: ReportDisplayProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const renderedHtml = renderMarkdown(report);

  return (
    <div
      ref={reportRef}
      id="report-content"
      className="report-content bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-right"
      dir="rtl"
    >
      <div
        className="prose prose-lg max-w-none font-cairo"
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />
    </div>
  );
}

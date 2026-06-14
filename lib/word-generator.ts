import {
  Document,
  Paragraph,
  TextRun,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  Packer,
  SectionType,
} from "docx";
import { saveAs } from "file-saver";

type ParagraphChild = Paragraph | Table;

function parseMarkdownLine(line: string): TextRun[] {
  const runs: TextRun[] = [];
  const parts = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);

  for (const part of parts) {
    if (part.startsWith("**") && part.endsWith("**")) {
      runs.push(
        new TextRun({ text: part.slice(2, -2), bold: true, font: "Arial", size: 24 })
      );
    } else if (part.startsWith("*") && part.endsWith("*")) {
      runs.push(
        new TextRun({ text: part.slice(1, -1), italics: true, font: "Arial", size: 24 })
      );
    } else if (part) {
      runs.push(new TextRun({ text: part, font: "Arial", size: 24 }));
    }
  }

  return runs.length > 0 ? runs : [new TextRun({ text: "", font: "Arial" })];
}

function parseTableRow(line: string): string[] {
  return line
    .split("|")
    .filter((_, i, arr) => i > 0 && i < arr.length - 1)
    .map((cell) => cell.trim());
}

function isTableSeparator(line: string): boolean {
  return /^\|[\s\-|:]+\|$/.test(line.trim());
}

function buildTable(tableLines: string[]): Table {
  const rows: TableRow[] = [];
  let isHeader = true;

  for (const line of tableLines) {
    if (isTableSeparator(line)) {
      isHeader = false;
      continue;
    }

    const cells = parseTableRow(line);
    const tableCells = cells.map(
      (cellText) =>
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: cellText.replace(/\*\*/g, ""),
                  bold: isHeader,
                  font: "Arial",
                  size: 20,
                  color: isHeader ? "FFFFFF" : "000000",
                }),
              ],
              alignment: AlignmentType.RIGHT,
              bidirectional: true,
            }),
          ],
          shading: isHeader
            ? ({ fill: "1a5c38", color: "FFFFFF", type: "clear" } as any)
            : undefined,
          margins: { top: 100, bottom: 100, left: 150, right: 150 },
        })
    );

    rows.push(new TableRow({ children: tableCells }));

    if (isHeader) isHeader = false;
  }

  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "1a5c38" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "1a5c38" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "1a5c38" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "1a5c38" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "c9a227" },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "c9a227" },
    },
  });
}

export async function generateWordReport(
  reportText: string,
  filename: string = "تقرير-تقييم-اللعبة"
): Promise<void> {
  const lines = reportText.split("\n");
  const children: ParagraphChild[] = [];

  let tableBuffer: string[] = [];
  let inTable = false;

  const flushTable = () => {
    if (tableBuffer.length > 0) {
      children.push(buildTable(tableBuffer));
      children.push(new Paragraph({ text: "" }));
      tableBuffer = [];
    }
    inTable = false;
  };

  // Cover page
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "تقرير تقييم اللعبة التعليمية",
          bold: true,
          font: "Arial",
          size: 56,
          color: "1a5c38",
        }),
      ],
      alignment: AlignmentType.CENTER,
      bidirectional: true,
      spacing: { before: 2000, after: 400 },
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "وفق منهج مونتيسوري ومعايير EN 71 الأوروبية",
          font: "Arial",
          size: 32,
          color: "c9a227",
        }),
      ],
      alignment: AlignmentType.CENTER,
      bidirectional: true,
      spacing: { after: 600 },
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `تاريخ التقرير: ${new Date().toLocaleDateString("ar-EG")}`,
          font: "Arial",
          size: 24,
          color: "666666",
        }),
      ],
      alignment: AlignmentType.CENTER,
      bidirectional: true,
      spacing: { after: 2000 },
    })
  );

  children.push(
    new Paragraph({
      children: [new TextRun({ text: "", break: 1 })],
      pageBreakBefore: true,
    })
  );

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("|")) {
      inTable = true;
      tableBuffer.push(line);
      continue;
    }

    if (inTable && !trimmed.startsWith("|")) {
      flushTable();
    }

    if (!trimmed) {
      children.push(new Paragraph({ text: "" }));
      continue;
    }

    if (trimmed === "---") {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: "─".repeat(50), color: "c9a227", font: "Arial" }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 200 },
        })
      );
      continue;
    }

    if (trimmed.startsWith("# ")) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: trimmed.slice(2),
              bold: true,
              font: "Arial",
              size: 40,
              color: "1a5c38",
            }),
          ],
          alignment: AlignmentType.RIGHT,
          bidirectional: true,
          spacing: { before: 400, after: 200 },
          border: {
            bottom: { style: BorderStyle.SINGLE, size: 2, color: "1a5c38" },
          },
        })
      );
    } else if (trimmed.startsWith("## ")) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: trimmed.slice(3),
              bold: true,
              font: "Arial",
              size: 32,
              color: "1a5c38",
            }),
          ],
          alignment: AlignmentType.RIGHT,
          bidirectional: true,
          spacing: { before: 320, after: 160 },
        })
      );
    } else if (trimmed.startsWith("### ")) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: trimmed.slice(4),
              bold: true,
              font: "Arial",
              size: 28,
              color: "2d8a5c",
            }),
          ],
          alignment: AlignmentType.RIGHT,
          bidirectional: true,
          spacing: { before: 240, after: 120 },
        })
      );
    } else if (trimmed.startsWith("> ")) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: trimmed.slice(2),
              font: "Arial",
              size: 22,
              color: "8b5e3c",
              italics: true,
            }),
          ],
          alignment: AlignmentType.RIGHT,
          bidirectional: true,
          spacing: { before: 120, after: 120 },
          indent: { right: 720 },
          border: {
            right: { style: BorderStyle.SINGLE, size: 4, color: "c9a227" },
          },
        })
      );
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      children.push(
        new Paragraph({
          children: parseMarkdownLine(trimmed.slice(2)),
          alignment: AlignmentType.RIGHT,
          bidirectional: true,
          spacing: { before: 60, after: 60 },
          indent: { right: 360 },
          bullet: { level: 0 },
        })
      );
    } else {
      children.push(
        new Paragraph({
          children: parseMarkdownLine(trimmed),
          alignment: AlignmentType.RIGHT,
          bidirectional: true,
          spacing: { before: 80, after: 80 },
        })
      );
    }
  }

  if (inTable) {
    flushTable();
  }

  const doc = new Document({
    creator: "مقيّم الألعاب التعليمية - مونتيسوري EN 71",
    title: "تقرير تقييم اللعبة التعليمية",
    description: "تقرير احترافي شامل وفق منهج مونتيسوري ومعايير EN 71",
    styles: {
      default: {
        document: {
          run: {
            font: "Arial",
            size: 24,
          },
          paragraph: {
            alignment: AlignmentType.RIGHT,
          },
        },
      },
    },
    sections: [
      {
        properties: {
          type: SectionType.CONTINUOUS,
          page: {
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${filename}.docx`);
}

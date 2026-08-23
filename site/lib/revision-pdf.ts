export type RevisionPdfItem = {
  lessonSlug: string;
  activity: string;
  prompt: string;
  correctAnswer: string;
  learnerAnswer: string;
};

function cleanText(value: string) {
  return value
    .replace(/[\u2010-\u2015]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[^\u0000-\u00ff]/g, "?");
}

function escapePdfText(value: string) {
  return cleanText(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrapText(value: string, maximum = 76) {
  const words = cleanText(value).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maximum && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

function paginate(items: RevisionPdfItem[]) {
  const pages: string[][] = [[]];

  items.forEach((item, index) => {
    const block = [
      `${index + 1}. ${item.lessonSlug.toUpperCase()} - ${item.activity}`,
      ...wrapText(`Question: ${item.prompt}`),
      ...wrapText(`Correct answer: ${item.correctAnswer}`),
      ...wrapText(`Your answer: ${item.learnerAnswer}`),
      ""
    ];
    let page = pages[pages.length - 1];
    if (page.length + block.length > 34) {
      page = [];
      pages.push(page);
    }
    page.push(...block);
  });

  return pages;
}

function pageStream(lines: string[], pageNumber: number, pageCount: number) {
  const commands = [
    "BT",
    "/F2 20 Tf",
    "54 790 Td",
    `(Portulgiza - Needs Practice) Tj`,
    "0 -24 Td",
    "/F1 10 Tf",
    `(Personal revision sheet) Tj`,
    "0 -26 Td",
    "/F1 10 Tf"
  ];

  for (const line of lines) {
    commands.push(`(${escapePdfText(line)}) Tj`, "0 -16 Td");
  }

  commands.push(
    "ET",
    "BT",
    "/F1 9 Tf",
    "54 32 Td",
    `(Page ${pageNumber} of ${pageCount} - Revise these sentences before your next attempt.) Tj`,
    "ET"
  );
  return commands.join("\n");
}

function toLatin1Bytes(value: string) {
  const bytes = new Uint8Array(value.length);
  for (let index = 0; index < value.length; index += 1) bytes[index] = value.charCodeAt(index) & 0xff;
  return bytes;
}

export function createRevisionPdf(items: RevisionPdfItem[]) {
  const pages = paginate(items);
  const objects: string[] = [];
  const regularFontId = 3;
  const boldFontId = 4;
  const firstPageId = 5;
  const pageIds = pages.map((_, index) => firstPageId + index * 2);

  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[2] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`;
  objects[regularFontId] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";
  objects[boldFontId] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>";

  pages.forEach((lines, index) => {
    const pageId = pageIds[index];
    const contentId = pageId + 1;
    const stream = pageStream(lines, index + 1, pages.length);
    objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${regularFontId} 0 R /F2 ${boldFontId} 0 R >> >> /Contents ${contentId} 0 R >>`;
    objects[contentId] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
  });

  let pdf = "%PDF-1.4\n%\xe2\xe3\xcf\xd3\n";
  const offsets: number[] = [0];
  for (let id = 1; id < objects.length; id += 1) {
    offsets[id] = pdf.length;
    pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let id = 1; id < objects.length; id += 1) {
    pdf += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return toLatin1Bytes(pdf);
}

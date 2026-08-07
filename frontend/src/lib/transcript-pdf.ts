import jsPDF from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import QRCode from 'qrcode';
import type { GradeRecord, TranscriptToken } from '@/types';

const PAGE_WIDTH_MM = 210;
const MARGIN_MM = 14;
const PRIMARY_BLUE: [number, number, number] = [30, 58, 138]; // #1e3a8a
const PRIMARY_SOFT: [number, number, number] = [203, 213, 225]; // slate-300
const INK: [number, number, number] = [30, 41, 59]; // slate-800
const MUTED: [number, number, number] = [100, 116, 139]; // slate-500
const ROW_ALT: [number, number, number] = [241, 245, 249]; // slate-100

export interface TranscriptPdfInput {
  token: TranscriptToken;
  grades: GradeRecord[];
  verificationUrl: string;
}

export async function generateTranscriptPdf({ token, grades, verificationUrl }: TranscriptPdfInput): Promise<void> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const right = PAGE_WIDTH_MM - MARGIN_MM;

  // ── Header banner ─────────────────────────────────────────────
  doc.setFillColor(...PRIMARY_BLUE);
  doc.rect(0, 0, PAGE_WIDTH_MM, 26, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('YAOUNDE INTERNATIONAL BUSINESS SCHOOL', PAGE_WIDTH_MM / 2, 11, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...PRIMARY_SOFT);
  doc.text('OFFICIAL ACADEMIC TRANSCRIPT', PAGE_WIDTH_MM / 2, 19, { align: 'center' });

  // ── Student details ────────────────────────────────────────────
  doc.setTextColor(...INK);
  doc.setFontSize(10);
  let y = 36;
  doc.setFont('helvetica', 'bold');
  doc.text(`Student: ${token.data.studentName}`, MARGIN_MM, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`Student ID: ${token.data.studentIdCode}`, right, y, { align: 'right' });
  y += 6;
  doc.text(`Programme: ${token.data.programme}`, MARGIN_MM, y);
  doc.text(`CGPA: ${token.data.cgpa}`, right, y, { align: 'right' });
  y += 6;
  doc.text(`Credits: ${token.data.credits}  |  Courses: ${token.data.gradeCount}`, MARGIN_MM, y);
  doc.text(`Issued: ${formatDate(token.issuedAt)}`, right, y, { align: 'right' });
  y += 10;

  // ── Grade table ────────────────────────────────────────────────
  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN_MM, right: MARGIN_MM },
    head: [['Course Code', 'Course Name', 'Semester', 'Grade', 'GPA Points', 'Credits']],
    body: grades.map((g) => [
      g.courseCode,
      g.courseName,
      g.semester,
      g.grade,
      g.gpaPoints?.toFixed(1) ?? 'N/A',
      String(g.credits),
    ]),
    styles: { fontSize: 8.5, cellPadding: 2, textColor: INK },
    headStyles: { fillColor: PRIMARY_BLUE, fontSize: 9, textColor: 255 },
    alternateRowStyles: { fillColor: ROW_ALT },
    columnStyles: {
      1: { cellWidth: 'auto' },
    },
  });

  const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y;

  // ── QR code + authenticity note ────────────────────────────────
  const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 200,
  });

  const qrSize = 34;
  const qrX = MARGIN_MM;
  const qrY = finalY + 10;
  const textX = qrX + qrSize + 6;
  doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

  doc.setTextColor(...INK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Document Authentication', textX, qrY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Scan the QR code to verify this transcript', textX, qrY + 11);
  doc.setTextColor(...PRIMARY_BLUE);
  doc.textWithLink(verificationUrl, textX, qrY + 18, { url: verificationUrl });
  doc.setTextColor(...MUTED);
  doc.text(`Token: ${token.token}`, textX, qrY + 25);
  doc.text(`Valid until: ${formatDate(token.expiresAt)}`, textX, qrY + 30);

  // ── Footer ─────────────────────────────────────────────────────
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(
    'Electronically issued transcript. Authenticity is verified by scanning the QR code above.',
    PAGE_WIDTH_MM / 2,
    290,
    { align: 'center' },
  );

  const filename = `transcript-${token.data.studentName.replace(/\s+/g, '-').toLowerCase()}.pdf`;
  doc.save(filename);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

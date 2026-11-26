import "server-only";
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import type { Dict } from "@/i18n";
import { fmt } from "@/i18n";
import { formatDate, formatMoney, formatNumber } from "@/lib/money";
import { SUPABASE_URL } from "@/lib/env";

export type ReceiptPayload = {
  business: { name: string; city: string; phone: string; address: string; tax_id: string; footer: string; logo_path: string | null; branded: boolean; timezone: string };
  sale: { number: number; year: number; date: string; item: string; quantity: number; unit_price: number; total: number; paid: number; remaining: number;
          status: "paid" | "partial" | "pending"; currency: string; customer: string; method: string };
  payments: { date: string; amount: number; method: string }[];
};

/** Reçu si tout est payé, facture sinon. */
export const isInvoice = (r: ReceiptPayload) => r.sale.status !== "paid";
export const receiptNumber = (r: ReceiptPayload) => `${r.sale.year}-${String(r.sale.number).padStart(6, "0")}`;
export const logoUrl = (path: string | null) => (path ? `${SUPABASE_URL}/storage/v1/object/public/logos/${path}` : null);

// Les polices standard des PDF ne gèrent pas certaines espaces/caractères Unicode.
export const pdfSafe = (v: string) => v.replace(/[  ]/g, " ").replace(/[→]/g, "-").replace(/[₦]/g, "NGN ");

async function loadLogo(path: string | null): Promise<{ data: Uint8Array; type: "PNG" | "JPEG"; w: number; h: number } | null> {
  const url = logoUrl(path);
  if (!url) return null;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const data = new Uint8Array(await res.arrayBuffer());
    const isPng = data[0] === 0x89 && data[1] === 0x50;
    const isJpg = data[0] === 0xff && data[1] === 0xd8;
    if (!isPng && !isJpg) return null;
    let w = 1, h = 1;
    if (isPng) { const v = new DataView(data.buffer); w = v.getUint32(16); h = v.getUint32(20); }
    else {
      // Dimensions JPEG : segment SOF
      let i = 2;
      while (i < data.length) {
        if (data[i] !== 0xff) break;
        const marker = data[i + 1], len = (data[i + 2] << 8) + data[i + 3];
        if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) { h = (data[i + 5] << 8) + data[i + 6]; w = (data[i + 7] << 8) + data[i + 8]; break; }
        i += 2 + len;
      }
    }
    return { data, type: isPng ? "PNG" : "JPEG", w, h };
  } catch { return null; }
}

/** PDF A5 du reçu / de la facture (aucun coût ni marge : uniquement ce que le client doit voir). */
export async function buildReceiptPdf(r: ReceiptPayload, d: Dict, lang: "fr" | "en"): Promise<Buffer> {
  const doc = new jsPDF({ unit: "pt", format: "a5" });
  const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(), M = 30;
  const money = (v: number) => pdfSafe(formatMoney(v, r.sale.currency, lang));
  const b = r.business;

  // En-tête : logo + coordonnées de l'entreprise
  let y = M;
  const logo = b.branded ? await loadLogo(b.logo_path) : null;
  let textX = M;
  if (logo) {
    const maxH = 48, maxW = 110, ratio = Math.min(maxW / logo.w, maxH / logo.h);
    doc.addImage(logo.data, logo.type, M, y, logo.w * ratio, logo.h * ratio);
    textX = M + logo.w * ratio + 12;
  }
  doc.setTextColor(24, 24, 27); doc.setFont("helvetica", "bold"); doc.setFontSize(13);
  doc.text(pdfSafe(b.name), textX, y + 12);
  doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(90, 90, 100);
  const lines = [b.address, b.city, b.phone, b.tax_id ? fmt(d.receipt.taxId, { id: b.tax_id }) : ""].filter(Boolean).map(pdfSafe);
  lines.forEach((l, i) => doc.text(l, textX, y + 26 + i * 11));
  y = Math.max(y + 60, y + 26 + lines.length * 11 + 8);

  // Titre et numéro
  doc.setDrawColor(201, 44, 107); doc.setLineWidth(1.2); doc.line(M, y, W - M, y); y += 22;
  doc.setTextColor(201, 44, 107); doc.setFont("helvetica", "bold"); doc.setFontSize(15);
  doc.text(isInvoice(r) ? d.receipt.invoice.toUpperCase() : d.receipt.receipt.toUpperCase(), M, y);
  doc.setFontSize(9.5); doc.setTextColor(24, 24, 27);
  doc.text(pdfSafe(`${d.receipt.number} ${receiptNumber(r)}`), W - M, y - 4, { align: "right" });
  doc.setFont("helvetica", "normal"); doc.setTextColor(90, 90, 100);
  doc.text(pdfSafe(formatDate(r.sale.date, lang)), W - M, y + 8, { align: "right" });
  y += 18;
  if (r.sale.customer) { doc.setTextColor(24, 24, 27); doc.text(pdfSafe(`${d.receipt.customer} : ${r.sale.customer}`), M, y); y += 8; }

  // Ligne d'article
  autoTable(doc, {
    startY: y + 6,
    head: [[d.receipt.item, d.receipt.qty, d.receipt.unitPrice, d.receipt.amount]],
    body: [[pdfSafe(r.sale.item), pdfSafe(formatNumber(r.sale.quantity, lang)), money(r.sale.unit_price), money(r.sale.total)]],
    styles: { font: "helvetica", fontSize: 9, cellPadding: 5, textColor: [39, 39, 42] },
    headStyles: { fillColor: [252, 231, 241], textColor: [116, 28, 63], fontStyle: "bold" },
    columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" } },
    didParseCell: (h) => { if (h.section === "head" && h.column.index > 0) h.cell.styles.halign = "right"; },
    margin: { left: M, right: M },
  });
  // @ts-expect-error propriété ajoutée par jspdf-autotable
  y = (doc.lastAutoTable?.finalY ?? y + 40) + 16;

  // Totaux
  const row = (label: string, value: string, bold = false, color: [number, number, number] = [24, 24, 27]) => {
    doc.setFont("helvetica", bold ? "bold" : "normal"); doc.setFontSize(bold ? 11 : 9.5); doc.setTextColor(...color);
    doc.text(pdfSafe(label), W - M - 150, y); doc.text(value, W - M, y, { align: "right" }); y += bold ? 17 : 14;
  };
  row(d.receipt.total, money(r.sale.total), true);
  row(d.receipt.paid, money(r.sale.paid), false, [4, 120, 87]);
  if (r.sale.remaining > 0) row(d.receipt.remaining, money(r.sale.remaining), true, [180, 83, 9]);

  // Paiements reçus
  if (r.payments.length > 0) {
    y += 6; doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(24, 24, 27);
    doc.text(d.receipt.payments, M, y); y += 12;
    doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(90, 90, 100);
    for (const p of r.payments.slice(0, 12)) {
      doc.text(pdfSafe(`${formatDate(p.date, lang)} · ${d.methods[p.method as keyof typeof d.methods] ?? p.method}`), M, y);
      doc.text(money(p.amount), W - M, y, { align: "right" }); y += 11;
    }
  }

  // Pied de page
  let fy = H - M - 10;
  doc.setFontSize(8); doc.setTextColor(120, 120, 130); doc.setFont("helvetica", "normal");
  doc.text(pdfSafe(d.receipt.generatedBy), W / 2, fy, { align: "center" }); fy -= 12;
  if (b.footer) {
    doc.setTextColor(60, 60, 70); doc.setFontSize(9);
    const wrapped = doc.splitTextToSize(pdfSafe(b.footer), W - 2 * M) as string[];
    wrapped.reverse().forEach((l) => { doc.text(l, W / 2, fy, { align: "center" }); fy -= 11; });
  }
  return Buffer.from(doc.output("arraybuffer"));
}

export const receiptFileName = (r: ReceiptPayload, d: Dict) =>
  `${(isInvoice(r) ? d.receipt.invoice : d.receipt.receipt).normalize("NFD").replace(/[^\w]+/g, "_")}_${receiptNumber(r)}.pdf`;

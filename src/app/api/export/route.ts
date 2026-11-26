import { NextResponse, type NextRequest } from "next/server";
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import { getAppContext, can } from "@/lib/session";
import { getDict } from "@/i18n/server";
import { fmt } from "@/i18n";
import { resolvePeriod } from "@/lib/periods";
import { errorMessage } from "@/lib/errors";
import { SECTIONS, sectionTable, sectionTitle, type ReportData, type Section } from "@/lib/report";

export const dynamic = "force-dynamic";

const csvCell = (v: string) => (/[";,\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
// Les polices standard des PDF ne gèrent pas certaines espaces/caractères Unicode.
const pdfSafe = (v: string) => v.replace(/[  ]/g, " ").replace(/[→]/g, "-").replace(/[₦]/g, "NGN ");

export async function GET(req: NextRequest) {
  const { supabase, business, entitlements } = await getAppContext();
  if (!(await getAppContext()).isManager) return new NextResponse("Forbidden", { status: 403 });
  const { d, lang } = await getDict();
  // Droit vérifié côté serveur (la formule est lue en base, pas dans l'interface).
  if (!can(entitlements, "exports")) return NextResponse.json({ error: d.reports.exportLocked }, { status: 403 });
  const sp = req.nextUrl.searchParams;
  const section = (SECTIONS as readonly string[]).includes(sp.get("section") ?? "") ? (sp.get("section") as Section) : "summary";
  const format = sp.get("format") === "pdf" ? "pdf" : "csv";
  const p = resolvePeriod(business.timezone, sp.get("period") ?? undefined, sp.get("from") ?? undefined, sp.get("to") ?? undefined);
  const { data, error } = await supabase.rpc("report_data", { p_business: business.id, p_from: p.from, p_to: p.to });
  if (error) return NextResponse.json({ error: errorMessage(error, d) }, { status: 400 });
  const report = data as ReportData;
  const safeName = business.name.normalize("NFD").replace(/[^\w-]+/g, "_").slice(0, 40);
  const file = `bizpilot_${safeName}_${section}_${p.from}_${p.to}`;

  if (format === "csv") {
    const t = sectionTable(section, report, d, lang, business.currency, false);
    const sep = lang === "fr" ? ";" : ",";
    const body = [t.head, ...t.rows].map((r) => r.map((c) => csvCell(String(c))).join(sep)).join("\r\n");
    return new NextResponse("﻿" + body, {
      headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${file}.csv"`, "cache-control": "no-store" },
    });
  }

  const doc = new jsPDF({ orientation: section === "sales" || section === "stock" ? "landscape" : "portrait", unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  doc.setFillColor(201, 44, 107);
  doc.rect(0, 0, W, 64, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold"); doc.setFontSize(16);
  doc.text("Biz Pilot Digital", 36, 30);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9);
  doc.text("Think Smarter, Grow Better.", 36, 46);
  doc.setTextColor(24, 24, 27);
  doc.setFont("helvetica", "bold"); doc.setFontSize(14);
  doc.text(pdfSafe(`${sectionTitle(section, d)} - ${business.name}`), 36, 92);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(107, 107, 117);
  doc.text(pdfSafe(fmt(d.reports.period, { from: p.from, to: p.to }) + ` · ${business.currency}`), 36, 108);
  doc.text(pdfSafe(fmt(d.reports.generatedOn, { date: new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC" })), 36, 120);
  const t = sectionTable(section, report, d, lang, business.currency, true);
  autoTable(doc, {
    startY: 134,
    head: [t.head.map(pdfSafe)],
    body: t.rows.map((r) => r.map((c) => pdfSafe(String(c)))),
    styles: { font: "helvetica", fontSize: 8.5, cellPadding: 5, textColor: [39, 39, 42] },
    headStyles: { fillColor: [252, 231, 241], textColor: [116, 28, 63], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [247, 247, 248] },
    margin: { left: 36, right: 36 },
  });
  doc.setFontSize(8); doc.setTextColor(143, 143, 153);
  doc.text(pdfSafe(d.dashboard.estimateNote), 36, doc.internal.pageSize.getHeight() - 20);
  const buf = Buffer.from(doc.output("arraybuffer"));
  return new NextResponse(buf, {
    headers: { "content-type": "application/pdf", "content-disposition": `attachment; filename="${file}.pdf"`, "cache-control": "no-store" },
  });
}

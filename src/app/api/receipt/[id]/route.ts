import { NextResponse, type NextRequest } from "next/server";
import { getAppContext } from "@/lib/session";
import { getDict } from "@/i18n/server";
import { buildReceiptPdf, receiptFileName, type ReceiptPayload } from "@/lib/receipt";

export const dynamic = "force-dynamic";

/** Reçu PDF d'une vente (tout membre actif de l'entreprise, vendeur compris). */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await getAppContext();
  const { d, lang } = await getDict();
  const { data, error } = await supabase.rpc("sale_receipt", { p_sale: id });
  if (error || !data) return new NextResponse("Not found", { status: 404 });
  const r = data as ReceiptPayload;
  const pdf = await buildReceiptPdf(r, d, lang);
  const disposition = req.nextUrl.searchParams.get("download") === "1" ? "attachment" : "inline";
  return new NextResponse(new Uint8Array(pdf), {
    headers: { "content-type": "application/pdf", "content-disposition": `${disposition}; filename="${receiptFileName(r, d)}"`, "cache-control": "no-store" },
  });
}

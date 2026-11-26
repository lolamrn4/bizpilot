import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDict } from "@/i18n/server";
import { buildReceiptPdf, receiptFileName, type ReceiptPayload } from "@/lib/receipt";

export const dynamic = "force-dynamic";

/** PDF du reçu pour le client (lien public, sans compte). */
export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[a-f0-9]{64}$/.test(token)) return new NextResponse("Not found", { status: 404 });
  const supabase = await createClient();
  const { data } = await supabase.rpc("public_receipt", { p_token: token });
  if (!data) return new NextResponse("Not found", { status: 404 });
  const { d, lang } = await getDict();
  const r = data as ReceiptPayload;
  const pdf = await buildReceiptPdf(r, d, lang);
  return new NextResponse(new Uint8Array(pdf), {
    headers: { "content-type": "application/pdf", "content-disposition": `attachment; filename="${receiptFileName(r, d)}"`,
               "cache-control": "no-store", "x-robots-tag": "noindex" },
  });
}

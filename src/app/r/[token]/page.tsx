import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDict } from "@/i18n/server";
import { LangSwitch } from "@/components/LangSwitch";
import { ReceiptView } from "@/components/ReceiptView";
import type { ReceiptPayload } from "@/lib/receipt";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Page publique du reçu, ouverte par le client depuis le lien reçu (WhatsApp, SMS…). */
export default async function PublicReceiptPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[a-f0-9]{64}$/.test(token)) notFound();
  const supabase = await createClient();
  const { data } = await supabase.rpc("public_receipt", { p_token: token });
  if (!data) notFound();
  const { d, lang } = await getDict();
  return (
    <main className="min-h-dvh bg-ink-50 px-4 py-6">
      <div className="mx-auto max-w-xl space-y-4">
        <div className="flex justify-end"><LangSwitch /></div>
        <ReceiptView r={data as ReceiptPayload} d={d} lang={lang} />
        <a href={`/r/${token}/pdf`} className="btn-primary w-full">{d.receipt.downloadPdf}</a>
      </div>
    </main>
  );
}

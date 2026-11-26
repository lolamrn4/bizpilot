"use client";
import { useState } from "react";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n";

/** Partage du reçu : PDF (partage natif du téléphone ou téléchargement), lien WhatsApp, copie du lien. */
export function ReceiptActions({ saleId, publicLink, businessName, number, invoice }: {
  saleId: string; publicLink: string; businessName: string; number: string; invoice: boolean;
}) {
  const { d } = useI18n();
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const pdfUrl = `/api/receipt/${saleId}`;
  const text = fmt(invoice ? d.receipt.whatsappInvoice : d.receipt.whatsappReceipt, { business: businessName, number, link: publicLink });
  const sharePdf = async () => {
    setBusy(true);
    try {
      const res = await fetch(pdfUrl);
      const blob = await res.blob();
      const name = `${invoice ? "facture" : "recu"}_${number}.pdf`;
      const file = new File([blob], name, { type: "application/pdf" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: name, text });
      } else {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob); a.download = name; a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      }
    } catch { /* partage annulé par l'utilisateur */ } finally { setBusy(false); }
  };
  return (
    <div className="space-y-3" data-testid="receipt-actions">
      <div className="grid gap-2 sm:grid-cols-2">
        <a className="btn-primary" target="_blank" rel="noopener noreferrer" href={`https://wa.me/?text=${encodeURIComponent(text)}`}>{d.receipt.sendWhatsapp}</a>
        <button type="button" className="btn-secondary" onClick={sharePdf} disabled={busy}>{busy ? d.common.loading : d.receipt.sharePdf}</button>
        <a className="btn-secondary" href={pdfUrl} target="_blank" rel="noopener noreferrer">{d.receipt.viewPdf}</a>
        <button
          type="button"
          className="btn-secondary"
          onClick={async () => { try { await navigator.clipboard.writeText(publicLink); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* copie manuelle */ } }}
        >
          {copied ? d.team.copied : d.receipt.copyLink}
        </button>
      </div>
      <input className="input font-mono text-xs" value={publicLink} readOnly aria-label={d.receipt.publicLink} onFocus={(e) => e.currentTarget.select()} data-testid="receipt-link" />
      <p className="text-xs text-ink-500">{d.receipt.linkHelp}</p>
    </div>
  );
}

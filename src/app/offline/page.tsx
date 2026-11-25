import { getDict } from "@/i18n/server";
import { LogoMark } from "@/components/Logo";

export default async function Offline() {
  const { d } = await getDict();
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <LogoMark size={56} />
      <h1 className="h1">{d.pwa.offlineTitle}</h1>
      <p className="max-w-sm text-ink-600">{d.pwa.offlineText}</p>
      <a href="/app" className="btn-primary">{d.pwa.retry}</a>
    </main>
  );
}

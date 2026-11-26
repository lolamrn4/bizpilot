"use client";
import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/client";

type Platform = "android" | "ios" | "desktop";
type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

function detect(): { platform: Platform; standalone: boolean; inApp: boolean } {
  const ua = navigator.userAgent;
  const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const android = /Android/i.test(ua);
  const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
  const inApp = /FBAN|FBAV|Instagram|TikTok|musical_ly|Bytedance|WhatsApp|Line\//i.test(ua);
  return { platform: ios ? "ios" : android ? "android" : "desktop", standalone, inApp };
}

let deferred: BIPEvent | null = null;
const listeners = new Set<() => void>();
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferred = e as BIPEvent; listeners.forEach((l) => l()); });
  window.addEventListener("appinstalled", () => { deferred = null; listeners.forEach((l) => l()); });
}

function useInstall() {
  const [, setTick] = useState(0);
  const [env, setEnv] = useState<ReturnType<typeof detect> | null>(null);
  useEffect(() => {
    setEnv(detect());
    const l = () => setTick((n) => n + 1);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  return { env, canPrompt: !!deferred };
}

async function promptInstall() {
  if (!deferred) return false;
  await deferred.prompt();
  await deferred.userChoice.catch(() => null);
  deferred = null; listeners.forEach((l) => l());
  return true;
}

const DL = "M12 3v12M7 10l5 5 5-5M5 21h14";
function DlIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={DL} /></svg>;
}

/** Bouton : ouvre l'invite d'installation du navigateur si elle existe, sinon le guide (#installer). */
export function InstallButton({ className = "btn-secondary px-6 py-3 text-base" }: { className?: string }) {
  const { d } = useI18n();
  const { env } = useInstall();
  if (env?.standalone) return null;
  return (
    <button type="button" className={`${className} inline-flex items-center gap-2`}
      onClick={async () => {
        if (await promptInstall()) return;
        const el = document.getElementById("installer");
        if (el) { el.scrollIntoView({ behavior: "smooth" }); window.dispatchEvent(new Event("bp-open-guide")); }
      }}>
      <DlIcon />{d.pwa.installShort}
    </button>
  );
}

/** Guide pas à pas par appareil ; l'appareil détecté est mis en avant. */
export function InstallGuide({ compact = false }: { compact?: boolean }) {
  const { d } = useI18n();
  const { env, canPrompt } = useInstall();
  const [open, setOpen] = useState(!compact);
  useEffect(() => {
    const o = () => setOpen(true);
    window.addEventListener("bp-open-guide", o);
    return () => window.removeEventListener("bp-open-guide", o);
  }, []);
  const p = d.pwa;
  const blocks: { key: Platform; title: string; steps: string[] }[] = [
    { key: "android", title: p.android, steps: [p.android1, p.android2, p.android3, p.android4] },
    { key: "ios", title: p.ios, steps: [p.ios1, p.ios2, p.ios3, p.ios4] },
    { key: "desktop", title: p.desktop, steps: [p.desktop1, p.desktop2, p.desktop3] },
  ];
  const mine = env?.platform;
  const ordered = mine ? [...blocks.filter((b) => b.key === mine), ...blocks.filter((b) => b.key !== mine)] : blocks;

  if (env?.standalone) {
    return compact ? null : <p className="text-sm text-ink-600">{p.installed}</p>;
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        {canPrompt && (
          <button type="button" className="btn-primary inline-flex items-center gap-2" onClick={() => promptInstall()}>
            <DlIcon />{p.install}
          </button>
        )}
        {compact && !open && (
          <button type="button" className="btn-secondary" onClick={() => setOpen(true)}>{p.showGuide}</button>
        )}
      </div>
      {open && (
        <>
          {env?.inApp && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-amber-200">{p.inAppNote}</p>}
          <div className={`grid gap-4 ${compact ? "" : "md:grid-cols-3"}`}>
            {ordered.map((b) => (
              <div key={b.key} className={`card p-5 ${b.key === mine ? "ring-2 ring-brand-500" : ""}`}>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold text-ink-900">{b.title}</h3>
                  {b.key === mine && <span className="badge bg-brand-50 text-brand-700">{p.forYou}</span>}
                </div>
                <ol className="mt-3 space-y-2 text-sm text-ink-600">
                  {b.steps.map((s, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">{i + 1}</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/** Carte pour le menu « Plus » : masquée quand l'appli est déjà installée. */
export function InstallCard() {
  const { d } = useI18n();
  const { env } = useInstall();
  if (!env || env.standalone) return null;
  return (
    <div className="card space-y-3 p-4">
      <h2 className="font-bold text-ink-900">{d.pwa.installTitle}</h2>
      <p className="text-sm text-ink-600">{d.pwa.installText}</p>
      <InstallGuide compact />
    </div>
  );
}

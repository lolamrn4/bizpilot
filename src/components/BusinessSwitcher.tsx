"use client";
import Link from "next/link";
import { useI18n } from "@/i18n/client";
import { switchBusinessAction } from "@/app/app/team/actions";

/** Choix de l'entreprise courante (n'apparaît que s'il y a un choix ou une possibilité d'ajout). */
export function BusinessSwitcher({ businesses, currentId, canAdd, compact = false }: {
  businesses: { id: string; name: string }[]; currentId: string; canAdd: boolean; compact?: boolean;
}) {
  const { d } = useI18n();
  if (businesses.length < 2 && !canAdd) return null;
  return (
    <div className="space-y-2">
      {businesses.length > 1 && (
        <form action={switchBusinessAction}>
          <label className={compact ? "sr-only" : "mb-1 block text-xs font-semibold text-ink-500"} htmlFor={`biz-${compact ? "c" : "f"}`}>{d.switcher.label}</label>
          <select
            id={`biz-${compact ? "c" : "f"}`}
            name="business"
            className="input py-2 text-sm"
            defaultValue={currentId}
            data-testid="biz-switcher"
            onChange={(e) => e.currentTarget.form?.requestSubmit()}
          >
            {businesses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </form>
      )}
      {canAdd && <Link href="/onboarding?new=1" className="block text-xs font-semibold text-brand-700 hover:underline">+ {d.switcher.add}</Link>}
    </div>
  );
}

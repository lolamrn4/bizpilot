import { requireManager } from "@/lib/session";
import { getDict } from "@/i18n/server";
import { fmt } from "@/i18n";
import { formatDate } from "@/lib/money";
import { errorMessage } from "@/lib/errors";
import { LockNote } from "@/components/forms";
import type { Role } from "@/lib/types";
import { InviteForm, ConfirmSubmit } from "./TeamForms";
import { removeMemberAction, revokeInviteAction, setRoleAction } from "./actions";

type Overview = {
  max_users: number | null; roles_enabled: boolean; seats_used: number;
  members: { user_id: string; role: Role; email: string; full_name: string; active: boolean }[];
  invitations: { id: string; email: string; role: Role; expires_at: string }[];
};

export default async function TeamPage() {
  const { supabase, business, user, isOwner } = await requireManager();
  const { d, lang } = await getDict();
  const { data, error } = await supabase.rpc("team_overview", { p_business: business.id });
  if (error || !data) return <p className="alert-error">{errorMessage(error, d)}</p>;
  const o = data as Overview;
  const teamAllowed = o.max_users === null || o.max_users > 1;
  const hasSuspended = o.members.some((m) => !m.active);
  return (
    <div className="space-y-5">
      <div>
        <h1 className="h1">{d.team.title}</h1>
        <p className="text-sm text-ink-500">{fmt(d.team.subtitle, { business: business.name })}</p>
      </div>

      {!teamAllowed && <LockNote text={d.team.locked} />}

      <section className="card p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="h2">{d.team.members}</h2>
          <span className="badge bg-ink-100 text-ink-700" data-testid="seats">
            {o.max_users === null ? fmt(d.team.seatsUnlimited, { used: o.seats_used }) : fmt(d.team.seats, { used: o.seats_used, max: o.max_users })}
          </span>
        </div>
        <ul className="divide-y divide-ink-100">
          {o.members.map((m) => (
            <li key={m.user_id} className="flex flex-wrap items-center gap-3 py-3" data-testid="member">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-ink-900">
                  {m.full_name || m.email} {m.user_id === user.id && <span className="text-xs text-ink-400">({d.team.you})</span>}
                </p>
                <p className="truncate text-xs text-ink-500">{m.email}</p>
                {!m.active && <p className="text-xs font-semibold text-amber-700">{d.team.suspended}</p>}
              </div>
              {isOwner && m.role !== "owner" ? (
                <div className="flex flex-wrap items-center gap-2">
                  <form action={setRoleAction} className="flex items-center gap-2">
                    <input type="hidden" name="user" value={m.user_id} />
                    <select name="role" defaultValue={m.role} className="input py-1.5 text-sm" aria-label={d.team.changeRole}>
                      <option value="manager">{d.roles.manager}</option>
                      {(o.roles_enabled || m.role === "staff") && <option value="staff">{d.roles.staff}</option>}
                    </select>
                    <button className="btn-secondary py-1.5 text-sm">{d.team.save}</button>
                  </form>
                  <form action={removeMemberAction}>
                    <input type="hidden" name="user" value={m.user_id} />
                    <ConfirmSubmit label={d.team.remove} message={d.team.removeConfirm} className="btn-danger py-1.5 text-sm" />
                  </form>
                </div>
              ) : (
                <span className="badge bg-brand-50 text-brand-700">{d.roles[m.role]}</span>
              )}
            </li>
          ))}
        </ul>
        {hasSuspended && <p className="mt-2 text-xs text-ink-500">{d.team.suspendedHelp}</p>}
        <div className="mt-4 grid gap-2 text-xs text-ink-500 sm:grid-cols-3">
          {(["owner", "manager", "staff"] as Role[]).map((r) => (
            <p key={r}><span className="font-semibold text-ink-700">{d.roles[r]}</span> : {d.roles[`${r}Desc`]}</p>
          ))}
        </div>
      </section>

      {isOwner ? (
        teamAllowed && (
          <>
            <section className="card p-5">
              <h2 className="h2 mb-3">{d.team.invite}</h2>
              {!o.roles_enabled && <p className="mb-3 text-sm text-ink-500">{d.team.rolesLocked}</p>}
              <InviteForm rolesEnabled={o.roles_enabled} businessName={business.name} />
            </section>
            <section className="card p-5">
              <h2 className="h2 mb-3">{d.team.pending}</h2>
              {o.invitations.length === 0 ? (
                <p className="text-sm text-ink-500">{d.team.noPending}</p>
              ) : (
                <ul className="divide-y divide-ink-100">
                  {o.invitations.map((i) => (
                    <li key={i.id} className="flex flex-wrap items-center gap-3 py-3" data-testid="pending-invite">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{i.email}</p>
                        <p className="text-xs text-ink-500">{d.roles[i.role]} · {fmt(d.team.expires, { date: formatDate(i.expires_at.slice(0, 10), lang) })}</p>
                      </div>
                      <form action={revokeInviteAction}>
                        <input type="hidden" name="id" value={i.id} />
                        <button className="btn-secondary py-1.5 text-sm">{d.team.revoke}</button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )
      ) : (
        <p className="alert-info">{d.team.readOnly}</p>
      )}
    </div>
  );
}

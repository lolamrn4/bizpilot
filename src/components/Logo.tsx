import { useId } from "react";

/** Logo original Biz Pilot Digital : barres de croissance (gestion), courbe montante et étincelle (intelligence). */
export function LogoMark({ size = 36, className = "" }: { size?: number; className?: string }) {
  const gid = `bpg${useId().replace(/[^a-zA-Z0-9]/g, "")}`; // id unique : plusieurs logos par page
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e04685" />
          <stop offset="1" stopColor="#a91f56" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill={`url(#${gid})`} />
      <rect x="13" y="38" width="9" height="13" rx="2.5" fill="#fff" fillOpacity="0.55" />
      <rect x="27.5" y="31" width="9" height="20" rx="2.5" fill="#fff" fillOpacity="0.75" />
      <rect x="42" y="24" width="9" height="27" rx="2.5" fill="#fff" />
      <path d="M12 31 L27 22 L36 25 L47 15" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M50 6.5 L51.7 11.3 L56.5 13 L51.7 14.7 L50 19.5 L48.3 14.7 L43.5 13 L48.3 11.3 Z" fill="#fff" />
    </svg>
  );
}

export function Logo({ size = 36, className = "" }: { size?: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      <span className="leading-none">
        <span className="block text-[17px] font-extrabold tracking-tight text-ink-900">Biz Pilot</span>
        <span className="block text-[11px] font-semibold tracking-[0.2em] text-brand-600 uppercase">Digital</span>
      </span>
    </span>
  );
}

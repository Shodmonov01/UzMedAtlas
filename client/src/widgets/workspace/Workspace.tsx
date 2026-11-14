import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { adminLogout, cabinetLogout, fetchCabinetClinic } from "@/shared/api/cabinet";
import { adminProfile } from "@/shared/api/telegram";
import { ArrowIcon } from "@/shared/ui/ArrowIcon";
import { ClinicLogo } from "@/shared/ui/ClinicLogo";

/** Line icons of the workspace, drawn like the rest of the site's icons (1.8px strokes, round ends). */
const PATHS = {
  clinics: "M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M16 9h2a2 2 0 0 1 2 2v10M3 21h18M8 7h4M8 11h4M8 15h4",
  plus: "M12 5v14M5 12h14",
  edit: "M4 20h4L19 9l-4-4L4 16v4ZM13.5 6.5l4 4",
  pin: "M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21ZM12 7a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5",
  inbox: "M4 13l2.5-7h11L20 13M4 13v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5M4 13h4.5l1.5 2.5h4l1.5-2.5H20",
  external: "M7 17 17 7M8 7h9v9",
  queue: "M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01",
  send: "M21 4 3 11l6 2.5M21 4l-4 16-8-6.5M21 4 9 13.5V19l3-3",
  team: "M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M20 20v-1.5a3.5 3.5 0 0 0-2.5-3.35M15 4.15a3.5 3.5 0 0 1 0 6.7",
  home: "M3 11l9-7 9 7M5 9.5V20h14V9.5",
  logout: "M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H3",
  check: "M5 12.5l4.5 4.5L19 7.5",
  alert: "M12 8v5M12 16.5h.01M10.3 3.9 2.6 17.3A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.7L13.7 3.9a2 2 0 0 0-3.4 0Z",
  info: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M12 11v5M12 7.5h.01",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3",
  clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M12 7v5l3 2",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M4 21a8 8 0 0 1 16 0",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14M20 20l-4-4",
  close: "M6 6l12 12M18 6 6 18",
  menu: "M4 8h16M4 16h16",
  up: "M12 19V5M6 11l6-6 6 6",
  down: "M12 5v14M6 13l6 6 6-6",
  star: "M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z",
  swap: "M4 7h13l-3-3M20 17H7l3 3",
} as const;

export type WsIconName = keyof typeof PATHS;

export function WsIcon({ name, size = 18 }: { name: WsIconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={PATHS[name]} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** The round "back" mark in front of a back link: the site's arrow, turned around. */
export function BackMark() {
  return (
    <span>
      <ArrowIcon size={14} />
    </span>
  );
}

/** The heading block of a workspace page: an optional back link, a small label, the title, a line of help or facts,
 *  and the page's actions on the right. */
export function PageHead({
  back,
  eyebrow,
  title,
  lead,
  meta,
  actions,
}: {
  back?: ReactNode;
  eyebrow?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="ws-head">
      <div className="ws-head-copy">
        {back}
        {eyebrow ? <p className="ws-eyebrow">{eyebrow}</p> : null}
        <h1 className="ws-title">{title}</h1>
        {lead ? <p className="ws-lead">{lead}</p> : null}
        {meta ? <div className="ws-meta">{meta}</div> : null}
      </div>
      {actions ? <div className="ws-head-actions">{actions}</div> : null}
    </header>
  );
}

export function WsLoading({ label = "Loading…", inline = false }: { label?: string; inline?: boolean }) {
  return (
    <p className={`ws-loading${inline ? " is-inline" : ""}`} role="status">
      <i aria-hidden="true" />
      {label}
    </p>
  );
}

/** A callout: neutral, or tinted for good news, warnings and problems. */
export function WsNote({
  tone = "info",
  title,
  children,
}: {
  tone?: "info" | "success" | "warning" | "danger";
  title?: ReactNode;
  children?: ReactNode;
}) {
  const icon: WsIconName = tone === "success" ? "check" : tone === "info" ? "info" : "alert";
  return (
    <div className={`ws-note is-${tone}`} role={tone === "danger" ? "alert" : undefined}>
      <WsIcon name={icon} size={20} />
      <div className="min-w-0">
        {title ? <strong>{title}</strong> : null}
        {children}
      </div>
    </div>
  );
}

/** A message that floats at the foot of the screen for a few seconds after saving, then clears itself. */
export function WsToast({ message, error, onDone }: { message?: string | null; error?: string | null; onDone: () => void }) {
  const text = error || message;
  useEffect(() => {
    if (!text) return;
    const timer = window.setTimeout(onDone, error ? 6000 : 3200);
    return () => window.clearTimeout(timer);
  }, [text, error, onDone]);
  if (!text) return null;
  return (
    <div className={`ws-toast${error ? " is-error" : ""}`} role={error ? "alert" : "status"}>
      <span>
        <WsIcon name={error ? "alert" : "check"} size={15} />
      </span>
      {text}
    </div>
  );
}

type Kind = "cabinet" | "moderation";

/** The workspace frame: a white sidebar (brand, role, sections, the way out) and the page on paper. On phones and
 *  tablets the sidebar is a drawer opened from a solid top bar; it closes on a pick, on Escape and on the dim. */
export function WorkspaceShell({ kind, children }: { kind: Kind; children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const roleLabel = kind === "cabinet" ? "Clinic cabinet" : "Moderation";

  return (
    <div className={`ws${open ? " is-open" : ""}`}>
      <div className="ws-top">
        <Link to={kind === "cabinet" ? "/cabinet" : "/moderation"} className="ws-brand">
          <img src="/brand/logo.svg?v=2" alt="" width={36} height={36} />
          <span>
            <strong>Association</strong>
            <span>{roleLabel}</span>
          </span>
        </Link>
        <button type="button" className="ws-menu-button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          <WsIcon name={open ? "close" : "menu"} size={22} />
        </button>
      </div>
      <div className="ws-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />
      <aside className="ws-side" aria-label="Cabinet menu">
        <Link to="/" className="ws-brand">
          <img src="/brand/logo.svg?v=2" alt="" width={40} height={40} />
          <span>
            <strong>Association</strong>
            <span>of Medical Organizations</span>
          </span>
        </Link>
        <p className="ws-role">
          <i aria-hidden="true" />
          {roleLabel}
        </p>
        {kind === "cabinet" ? <CabinetNav pathname={pathname} /> : <ModerationNav pathname={pathname} />}
        <SideFoot kind={kind} />
      </aside>
      <main className="ws-main" id="main">
        <div className="ws-main-inner">{children}</div>
      </main>
    </div>
  );
}

function CabinetNav({ pathname }: { pathname: string }) {
  const match = pathname.match(/^\/cabinet\/clinics\/([^/]+)/);
  const clinicId = match && match[1] !== "new" ? match[1] : null;
  const clinic = useQuery({
    queryKey: ["cabinet-clinic", clinicId],
    queryFn: () => fetchCabinetClinic(clinicId!),
    enabled: Boolean(clinicId),
    retry: false,
  });
  const name = clinic.data ? clinic.data.nameRu || clinic.data.nameEn : "Clinic";
  const base = clinicId ? `/cabinet/clinics/${clinicId}` : "";

  return (
    <>
      <nav className="ws-nav" aria-label="Cabinet">
        <p className="ws-nav-title">Cabinet</p>
        <Link to="/cabinet" className={pathname === "/cabinet" || pathname === "/cabinet/" ? "is-active" : undefined}>
          <WsIcon name="clinics" />
          My clinics
        </Link>
        <Link to="/cabinet/clinics/new" className={pathname === "/cabinet/clinics/new" ? "is-active" : undefined}>
          <WsIcon name="plus" />
          Add a clinic
        </Link>
      </nav>
      {clinicId ? (
        <nav className="ws-nav" aria-label={name}>
          <div className="ws-nav-clinic">
            <ClinicLogo src={clinic.data?.logoUrl} name={name} className="h-10 w-10 rounded-xl" />
            <div className="min-w-0">
              <p className="ws-label">Clinic</p>
              <strong>{name}</strong>
            </div>
          </div>
          <Link to="/cabinet/clinics/$id" params={{ id: clinicId }} className={pathname === base || pathname === `${base}/` ? "is-active" : undefined}>
            <WsIcon name="edit" />
            Clinic profile
          </Link>
          <Link to="/cabinet/clinics/$id/branches" params={{ id: clinicId }} className={pathname.startsWith(`${base}/branches`) ? "is-active" : undefined}>
            <WsIcon name="pin" />
            Branches
          </Link>
          <Link to="/cabinet/clinics/$id/leads" params={{ id: clinicId }} className={pathname.startsWith(`${base}/leads`) ? "is-active" : undefined}>
            <WsIcon name="inbox" />
            Patient requests
          </Link>
          {clinic.data?.status === "published" ? (
            <Link to="/clinics/$slug" params={{ slug: clinic.data.slug }} target="_blank">
              <WsIcon name="external" />
              Public page
            </Link>
          ) : null}
        </nav>
      ) : null}
    </>
  );
}

function ModerationNav({ pathname }: { pathname: string }) {
  const profile = useQuery({ queryKey: ["admin-profile"], queryFn: adminProfile, retry: false });
  const queueActive = pathname === "/moderation" || pathname === "/moderation/" || /^\/moderation\/(?!leads|team|telegram|login)[^/]+$/.test(pathname);
  return (
    <nav className="ws-nav" aria-label="Moderation">
      <p className="ws-nav-title">Moderation</p>
      <Link to="/moderation" className={queueActive ? "is-active" : undefined}>
        <WsIcon name="queue" />
        Clinic queue
      </Link>
      <Link to="/moderation/leads" search={{ status: undefined, source: undefined, q: undefined }} className={pathname.startsWith("/moderation/leads") ? "is-active" : undefined}>
        <WsIcon name="inbox" />
        Patient requests
      </Link>
      <Link to="/moderation/telegram" className={pathname.startsWith("/moderation/telegram") ? "is-active" : undefined}>
        <WsIcon name="send" />
        Notifications
      </Link>
      {profile.data?.role === "administrator" ? (
        <Link to="/moderation/team" className={pathname.startsWith("/moderation/team") ? "is-active" : undefined}>
          <WsIcon name="team" />
          Moderators
        </Link>
      ) : null}
    </nav>
  );
}

function SideFoot({ kind }: { kind: Kind }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  return (
    <nav className="ws-nav ws-side-foot" aria-label="Sign out">
      <Link to="/">
        <WsIcon name="home" />
        To the site
      </Link>
      <button
        type="button"
        onClick={async () => {
          try {
            await (kind === "cabinet" ? cabinetLogout() : adminLogout());
          } finally {
            qc.clear();
            void navigate({ to: kind === "cabinet" ? "/cabinet/login" : "/moderation/login" });
          }
        }}
      >
        <WsIcon name="logout" />
        Sign out
      </button>
    </nav>
  );
}

/** The sign-in frame: the brand panel with a promise and three points on the left, the form on the right. */
export function AuthLayout({
  kicker,
  title,
  points,
  children,
}: {
  kicker: string;
  title: ReactNode;
  points: string[];
  children: ReactNode;
}) {
  return (
    <div className="auth">
      <section className="auth-brand">
        <Link to="/" className="auth-logo">
          <img src="/brand/logo.svg?v=2" alt="" width={44} height={44} />
          <span>
            <strong>Association</strong>
            <span>of Medical Organizations</span>
          </span>
        </Link>
        <div className="auth-brand-copy">
          <p className="auth-kicker">{kicker}</p>
          <h1>{title}</h1>
          <ul className="auth-points">
            {points.map((point) => (
              <li key={point}>
                <span>
                  <WsIcon name="check" size={15} />
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="auth-panel">
        <div className="auth-top">
          <Link to="/" className="ws-pill">
            <WsIcon name="home" size={16} />
            To the site
          </Link>
        </div>
        <div className="auth-card">{children}</div>
      </section>
    </div>
  );
}

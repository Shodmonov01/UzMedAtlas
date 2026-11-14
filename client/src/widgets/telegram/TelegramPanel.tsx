import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { telegramStatus, telegramInvite, telegramDisconnect, ownerTelegramStatus, type Invite } from "@/shared/api/telegram";
import { WsIcon } from "@/widgets/workspace/Workspace";

/** The Telegram mark in a small ink disc, at the head of the panels below. */
function TelegramMark() {
  return (
    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-paper text-ink">
      <WsIcon name="send" size={20} />
    </span>
  );
}

export function InvitationLink({ invite }: { invite: Invite }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="ws-group">
      <p className="text-sm leading-relaxed text-ink">
        This one-time invitation is valid until <strong>{new Date(invite.expiresAt).toLocaleString("en-GB")}</strong>. Open the link and press “Start” in Telegram.
      </p>
      <input aria-label="Invitation link" className="field" readOnly value={invite.url} onFocus={(e) => e.target.select()} />
      <div className="flex flex-wrap gap-2">
        <a href={invite.url} target="_blank" rel="noreferrer" className="ws-pill is-ink">
          Open the bot
          <WsIcon name="external" size={14} />
        </a>
        <button
          type="button"
          className="ws-pill"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(invite.url);
              setCopied(true);
            } catch {
              setCopied(false);
            }
          }}
        >
          {copied ? "Link copied" : "Copy invitation"}
        </button>
      </div>
    </div>
  );
}

export function TelegramPanel({ clinicId }: { clinicId?: string }) {
  const base = clinicId ? `/api/admin/clinics/${clinicId}/telegram` : "/api/admin/telegram";
  const qc = useQueryClient();
  const status = useQuery({ queryKey: ["telegram", base], queryFn: () => telegramStatus(base), refetchInterval: 10000 });
  const [invite, setInvite] = useState<Invite | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function act(action: "invite" | "disconnect") {
    setBusy(true);
    setError(null);
    try {
      if (action === "invite") setInvite(await telegramInvite(base));
      else {
        await telegramDisconnect(base);
        setInvite(null);
      }
      await qc.invalidateQueries({ queryKey: ["telegram", base] });
    } catch {
      setError("The action failed. Refresh the page and try again.");
    } finally {
      setBusy(false);
    }
  }
  const connection = status.data?.connection;
  return (
    <section className="ws-card is-pad space-y-4">
      <div className="flex items-start gap-4">
        <TelegramMark />
        <div className="min-w-0 flex-1">
          <h2 className="ws-card-title">{clinicId ? "Bot for the clinic owner" : "My Telegram notifications"}</h2>
          <p className="ws-card-text">
            {clinicId
              ? "Create an invitation and give it to the owner. They will get notifications for this clinic only."
              : "Get messages about new requests and clinics in review. Details open in the cabinet."}
          </p>
        </div>
        {status.data ? (
          <span className={`ws-status ${connection?.active ? "is-published" : "is-draft"}`}>{connection?.active ? "Connected" : "Not connected"}</span>
        ) : null}
      </div>
      {status.isLoading ? <p className="text-sm text-muted">Checking the connection…</p> : null}
      {status.isError ? <p className="text-sm text-danger">Could not check the connection. The clinic must have an owner assigned.</p> : null}
      {status.data ? (
        <>
          {connection?.active ? (
            <p className="text-sm font-semibold text-ink">
              {connection.displayName}
              {connection.username ? ` (@${connection.username})` : ""}
            </p>
          ) : null}
          {status.data.configured ? (
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={busy} onClick={() => void act("invite")} className="ws-pill is-ink">
                {connection?.active ? "New invitation" : clinicId ? "Invite the owner" : "Connect the bot"}
              </button>
              {connection?.active || invite ? (
                <button type="button" disabled={busy} onClick={() => void act("disconnect")} className="ws-pill is-danger">
                  Revoke the connection and invitations
                </button>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-danger">The bot is not set up yet. Contact the administrator.</p>
          )}
        </>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
      {invite ? <InvitationLink invite={invite} /> : null}
    </section>
  );
}

export function OwnerTelegramPanel() {
  const qc = useQueryClient();
  const status = useQuery({ queryKey: ["owner-telegram"], queryFn: ownerTelegramStatus, refetchInterval: 15000 });
  const [error, setError] = useState<string | null>(null);
  return (
    <section className="ws-card is-pad space-y-4">
      <div className="flex items-start gap-4">
        <TelegramMark />
        <div className="min-w-0">
          <h2 className="ws-card-title">Telegram notifications</h2>
          <p className="ws-card-text">
            To get new requests on Telegram, ask a moderator for a personal invitation. Each clinic is connected separately.
          </p>
        </div>
      </div>
      {status.isLoading ? <p className="text-sm text-muted">Loading…</p> : null}
      {status.isError ? <p className="text-sm text-danger">Could not load the connections</p> : null}
      {status.data?.length ? (
        <ul className="ws-items">
          {status.data.map((item) => (
            <li key={item.clinicId} className="ws-item items-center">
              <div className="ws-item-body">
                <strong>{item.name}</strong>
                <p>{item.connection ? `Connected: ${item.connection.displayName}` : "Telegram not connected"}</p>
              </div>
              {item.connection ? (
                <button
                  type="button"
                  className="ws-pill is-danger"
                  onClick={async () => {
                    try {
                      await telegramDisconnect(`/api/cabinet/telegram/${item.clinicId}`);
                      await qc.invalidateQueries({ queryKey: ["owner-telegram"] });
                    } catch {
                      setError("Could not turn off notifications");
                    }
                  }}
                >
                  Disconnect
                </button>
              ) : (
                <span className="ws-status is-draft">Not connected</span>
              )}
            </li>
          ))}
        </ul>
      ) : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </section>
  );
}

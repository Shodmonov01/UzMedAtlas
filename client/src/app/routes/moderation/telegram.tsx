import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adminProfile, deliveryStatus, retryDelivery } from "@/shared/api/telegram";
import { TelegramPanel } from "@/widgets/telegram/TelegramPanel";
import { PageHead, WsLoading } from "@/widgets/workspace/Workspace";

export const Route = createFileRoute("/moderation/telegram")({ component: TelegramPage });

const LABELS: Record<string, string> = { pending: "Pending", sent: "Sent", failed: "Failed", cancelled: "Cancelled" };
const TONES: Record<string, string> = { pending: "is-moderation", sent: "is-published", failed: "is-needs_changes", cancelled: "is-draft" };

function TelegramPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const profile = useQuery({ queryKey: ["admin-profile"], queryFn: adminProfile, retry: false });
  const delivery = useQuery({ queryKey: ["telegram-deliveries"], queryFn: deliveryStatus, enabled: profile.data?.role === "administrator", refetchInterval: 10000 });

  useEffect(() => {
    if (profile.isError) void navigate({ to: "/moderation/login" });
  }, [profile.isError, navigate]);

  if (!profile.data) return <WsLoading label="Checking your session…" />;

  return (
    <div className="ws-stack">
      <PageHead
        eyebrow="Moderation"
        title="Notifications"
        lead="New requests and clinics to review arrive on Telegram. Messages carry no patient data, only a link to the cabinet."
      />
      <TelegramPanel />

      {profile.data.role === "administrator" ? (
        <section className="ws-card is-pad space-y-5">
          <div>
            <h2 className="ws-card-title">Message delivery</h2>
            <p className="ws-card-text">Messages are resent after temporary errors. Revoked connections no longer get notifications.</p>
          </div>
          <div className="ws-stats">
            {Object.entries(LABELS).map(([key, label]) => (
              <div key={key} className="ws-stat">
                <span>
                  <span className={`ws-status ${TONES[key]}`}>{label}</span>
                </span>
                <strong>{delivery.data?.counts[key] || 0}</strong>
              </div>
            ))}
          </div>
          {delivery.isError ? <p className="text-sm text-danger">Could not load the log</p> : null}
          {delivery.data?.items.length ? (
            <ul className="ws-items">
              {delivery.data.items.map((item) => (
                <li key={item.id} className="ws-item items-center">
                  <div className="ws-item-body">
                    <strong>{new Date(item.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</strong>
                    <p>Attempts: {item.attempts}</p>
                  </div>
                  <span className={`ws-status ${TONES[item.status] || "is-draft"}`}>{LABELS[item.status] || item.status}</span>
                  {item.status === "failed" ? (
                    <button
                      type="button"
                      className="ws-pill"
                      onClick={async () => {
                        try {
                          await retryDelivery(item.id);
                          await qc.invalidateQueries({ queryKey: ["telegram-deliveries"] });
                        } catch {
                          window.alert("The connection is inactive. Connect the recipient again first.");
                        }
                      }}
                    >
                      Retry
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

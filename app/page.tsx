import Link from "next/link";
import { supabaseServer } from "@/lib/supabaseServer";
import { Requisition, ReviewStep } from "@/lib/types";
import AutoRefresh from "@/components/AutoRefresh";
import DeleteRequisitionButton from "@/components/DeleteRequisitionButton";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function statusLabel(status: string) {
  switch (status) {
    case "in_review": return { label: "In review", color: "#6B7280", bg: "#F3F4F6", dot: "#9CA3AF" };
    case "ta_revision": return { label: "Action needed — revise", color: "#B45309", bg: "#FEF3C7", dot: "#F59E0B" };
    case "final_ta_review": return { label: "Final approval needed", color: "#7C3AED", bg: "#EDE9FE", dot: "#8B5CF6" };
    case "ready_to_publish": return { label: "Ready to publish", color: "#065F46", bg: "#D1FAE5", dot: "#10B981" };
    default: return { label: status, color: "#6B7280", bg: "#F3F4F6", dot: "#9CA3AF" };
  }
}

function currentStage(steps: ReviewStep[], status: string) {
  if (status === "ready_to_publish") return "All stages complete";
  if (status === "final_ta_review") return "Awaiting your final approval";
  if (status === "ta_revision") {
    const blocking = steps.find((s) => s.status === "rejected" || s.status === "needs_clarification");
    return blocking ? `Feedback from ${blocking.reviewer_name}` : "Revision needed";
  }
  const current = steps.find((s) => s.status === "pending");
  if (!current) return "—";
  return `Stage ${current.stage_order} of ${steps.length} — waiting on ${current.reviewer_name}`;
}

export default async function Dashboard() {
  const supabase = supabaseServer();

  const { data: requisitions } = await supabase
    .from("requisitions")
    .select("*")
    .order("updated_at", { ascending: false });

  const ids = (requisitions || []).map((r: any) => r.id);
  let allSteps: any[] = [];
  if (ids.length) {
    const { data, error } = await supabase
      .from("review_steps")
      .select("*")
      .in("requisition_id", ids)
      .order("stage_order");
    if (error) console.error("STEPS ERROR:", error);
    allSteps = data || [];
  }

  const stepsByReq: Record<string, ReviewStep[]> = {};
  allSteps.forEach((s: any) => {
    if (!stepsByReq[s.requisition_id]) stepsByReq[s.requisition_id] = [];
    stepsByReq[s.requisition_id].push(s);
  });

  return (
    <main style={{ minHeight: "100vh", background: "#F9FAFB" }}>
      <AutoRefresh />

      {/* Header */}
      <div style={{
        background: "white",
        borderBottom: "1px solid #E5E7EB",
        padding: "20px 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div>
          <p style={{ fontSize: 12, color: "#9CA3AF", margin: "0 0 2px" }}>Ceylon Biscuits Limited</p>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: 0 }}>
            Job Requisition Portal
          </h1>
        </div>
        <Link
          href="/new"
          style={{
            background: "linear-gradient(90deg, #6366F1, #8B5CF6)",
            color: "white",
            padding: "10px 20px",
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 14,
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          + New requisition
        </Link>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 900, margin: "32px auto", padding: "0 24px" }}>
        {(!requisitions || requisitions.length === 0) ? (
          <div style={{
            background: "white", borderRadius: 12, border: "1px solid #E5E7EB",
            padding: "60px 32px", textAlign: "center",
          }}>
            <p style={{ fontSize: 15, color: "#6B7280", margin: 0 }}>
              No requisitions yet. Click "+ New requisition" to start one.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {requisitions?.map((r: Requisition) => {
              const steps = stepsByReq[r.id] || [];
              const { label, color, bg, dot } = statusLabel(r.status);
              const stage = currentStage(steps, r.status);
              const needsAction = r.status === "ta_revision" || r.status === "final_ta_review";
              const href = r.status === "ta_revision"
                ? `/requisition/${r.id}/revise`
                : r.status === "final_ta_review"
                ? `/requisition/${r.id}/final-approve`
                : `/requisition/${r.id}`;

              return (
                <div
                  key={r.id}
                  style={{
                    background: "white",
                    borderRadius: 10,
                    border: "1px solid #E5E7EB",
                    borderLeft: needsAction ? "4px solid #F59E0B" : "1px solid #E5E7EB",
                    overflow: "hidden",
                    transition: "box-shadow 0.15s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "stretch" }}>
                    {/* Clickable area */}
                    <Link
                      href={href}
                      style={{
                        flex: 1,
                        padding: "16px 20px",
                        textDecoration: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 16,
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontWeight: 600, fontSize: 15, color: "#111827", margin: "0 0 4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {r.designation}
                        </p>
                        <p style={{ fontSize: 13, color: "#6B7280", margin: "0 0 4px" }}>
                          {stage}
                        </p>
                        <p style={{ fontSize: 11, color: "#9CA3AF", margin: 0 }}>
                          {new Date(r.updated_at).toLocaleString("en-GB", {
                            day: "numeric", month: "short",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
                      </div>

                      {/* Status pill */}
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "5px 12px",
                        borderRadius: 20,
                        background: bg,
                        flexShrink: 0,
                      }}>
                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: dot }} />
                        <span style={{ fontSize: 12, fontWeight: 600, color }}>{label}</span>
                      </div>
                    </Link>

                    {/* Delete button — separate from link */}
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "0 16px",
                      borderLeft: "1px solid #F3F4F6",
                    }}>
                      <DeleteRequisitionButton id={r.id} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
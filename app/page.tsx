import Link from "next/link";
import { supabaseServer } from "@/lib/supabaseServer";
import { Requisition, ReviewStep } from "@/lib/types";
import AutoRefresh from "@/components/AutoRefresh";
export const dynamic = "force-dynamic";

function statusLabel(status: string) {
  switch (status) {
    case "in_review": return { label: "In review", cls: "status-pending" };
    case "ta_revision": return { label: "Action needed — revise", cls: "status-rejected" };
    case "final_ta_review": return { label: "Action needed — final approval", cls: "status-warn" };
    case "ready_to_publish": return { label: "Ready to publish", cls: "status-approved" };
    default: return { label: status, cls: "status-pending" };
  }
}

function currentStage(steps: ReviewStep[], status: string) {
  if (status === "ready_to_publish") return "Published";
  if (status === "final_ta_review") return "Awaiting your final approval";
  if (status === "ta_revision") {
    const blocking = steps.find((s) => s.status === "rejected" || s.status === "needs_clarification");
    return blocking ? `Feedback from ${blocking.reviewer_name}` : "Revision needed";
  }
  const current = steps.find((s) => s.status === "pending");
  if (!current) return "—";
  return `Stage ${current.stage_order}/${steps.length} — waiting on ${current.reviewer_name}`;
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
    <main className="container">
      <div className="topbar">
        <h1>Job requisition portal</h1>
        <Link href="/new" className="btn-primary" style={{ padding: "8px 14px" }}>
          + New requisition
        </Link>
      </div>

      <div className="card">
        <h2>All requisitions</h2>
        {(!requisitions || requisitions.length === 0) && (
          <p className="muted">None yet. Click "New requisition" to start one.</p>
        )}
        {requisitions?.map((r: Requisition) => {
          const steps = stepsByReq[r.id] || [];
          const { label, cls } = statusLabel(r.status);
          const stage = currentStage(steps, r.status);
          const needsAction = r.status === "ta_revision" || r.status === "final_ta_review";
          return (
            <Link
              href={
                r.status === "ta_revision"
                  ? `/requisition/${r.id}/revise`
                  : r.status === "final_ta_review"
                  ? `/requisition/${r.id}/final-approve`
                  : `/requisition/${r.id}`
              }
              key={r.id}
              className="req-row-link"
            >
              <div className="req-row" style={needsAction ? { borderLeft: "4px solid #f5a623" } : {}}>
                <div className="top">
                  <div>
                    <strong>{r.designation}</strong>
                    <p className="muted" style={{margin: "2px 0 0"}}>{stage}</p>
                    <p className="muted" style={{fontSize: 11, marginTop: 2}}>
                      {new Date(r.updated_at).toLocaleString("en-GB", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </p>
                  </div>
                  <span className={`status-pill ${cls}`}>{label}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
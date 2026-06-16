import { supabaseServer } from "@/lib/supabaseServer";
import ReviewActionForm from "@/components/ReviewActionForm";
import StageTracker from "@/components/StageTracker";
export const dynamic = "force-dynamic";

export default async function ReviewPage({ params }: { params: { token: string } }) {
  const supabase = supabaseServer();
  const { data: step } = await supabase.from("review_steps").select("*").eq("token", params.token).single();

  if (!step) {
    return (
      <main className="container">
        <p>Invalid or expired link.</p>
      </main>
    );
  }

  const { data: requisition } = await supabase
    .from("requisitions")
    .select("*")
    .eq("id", step.requisition_id)
    .single();
  const { data: allSteps } = await supabase
    .from("review_steps")
    .select("*")
    .eq("requisition_id", step.requisition_id)
    .order("stage_order");

  const priorSteps = (allSteps || []).filter((s: any) => s.stage_order < step.stage_order);
  const isMyTurn = step.status === "pending" && priorSteps.every((s: any) => s.status === "approved");

  return (
    <main className="container">
      <h1>{requisition?.designation}</h1>
      <div className="card">
        <h2>Job details</h2>
        <p className="meta">{requisition?.justification}</p>
        <p className="meta">
          <strong>Tasks:</strong> {requisition?.tasks}
        </p>
        <p className="meta">
          <strong>Must-have:</strong> {requisition?.must_have}
        </p>
        {requisition?.attachment_url && (
          <p className="meta">
            <strong>Attachment:</strong>{" "}
            <a href={requisition.attachment_url} target="_blank">View document</a>
          </p>
        )}
        {requisition?.jd_text && <pre className="jd-text">{requisition.jd_text}</pre>}
        {requisition?.advert_text && (
          <div style={{ marginTop: 12 }}>
            <strong style={{ fontSize: 13 }}>Advert text</strong>
            <pre className="jd-text">{requisition.advert_text}</pre>
          </div>
        )}
      </div>
      <div className="card">
        <h2>Approval history so far</h2>
        <StageTracker steps={allSteps || []} requisitionStatus={requisition?.status || "in_review"} showCopyLink={false} />
      </div>
      {step.status !== "pending" ? (
        <div className="card">
          <p className="muted">You already marked this {step.status}.</p>
        </div>
      ) : isMyTurn ? (
        <div className="card">
          <h2>Your decision</h2>
          <ReviewActionForm token={step.token} />
        </div>
      ) : (
        <div className="card">
          <p className="muted">Waiting on an earlier reviewer before this reaches you.</p>
        </div>
      )}
      {requisition?.status === "ready_to_publish" &&
        (() => {
          const base = "https://vezpr-jd-gen-production-5b83.up.railway.app";
          const jdParams = new URLSearchParams({
            role_title: requisition.designation,
            reason: requisition.justification,
            tasks: requisition.tasks,
            must_have: requisition.must_have,
            salary: requisition.approved_budget || "",
            company: requisition.company || "Ceylon Biscuits Limited",
            company_description: "CBL Group is a leading FMCG conglomerate in Sri Lanka.",
            autogenerate: "true",
          });
          return (
            <div className="card" style={{ borderLeft: "4px solid #2ecc71" }}>
              <h2>✓ Approved and ready to publish</h2>
              <p className="muted" style={{ marginBottom: 12 }}>
                All stages are complete for this requisition.
              </p>

                <a href={`${base}/?${jdParams.toString()}`}
                target="_blank"
                className="btn-primary"
                style={{ padding: "8px 14px", display: "inline-block" }}
              >
                ✦ View full JD — Copy / Preview / Best-Fit →
              </a>
            </div>
          );
        })()}
    </main>
  );
}
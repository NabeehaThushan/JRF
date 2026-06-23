import { supabaseServer } from "@/lib/supabaseServer";
import ReviewActionForm from "@/components/ReviewActionForm";
import StageTracker from "@/components/StageTracker";
import DeleteRequisitionButton from "@/components/DeleteRequisitionButton";
export const dynamic = "force-dynamic";

export default async function ReviewPage({ params }: { params: { token: string } }) {
  const supabase = supabaseServer();
  const { data: step } = await supabase
    .from("review_steps").select("*").eq("token", params.token).single();

  if (!step) {
    return <main className="container"><p>Invalid or expired link.</p></main>;
  }

  const { data: requisition } = await supabase
    .from("requisitions").select("*").eq("id", step.requisition_id).single();

  const { data: allSteps } = await supabase
    .from("review_steps").select("*")
    .eq("requisition_id", step.requisition_id)
    .order("stage_order");

  const priorSteps = (allSteps || []).filter((s: any) => s.stage_order < step.stage_order);
  const isMyTurn = step.status === "pending" && priorSteps.every((s: any) => s.status === "approved");

  return (
    <main className="container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <p className="muted" style={{ margin: "0 0 4px" }}>
            Stage {step.stage_order} of {(allSteps || []).length} — reviewing as <strong>{step.reviewer_name}</strong>
          </p>
          <h1 style={{ margin: 0 }}>{requisition?.designation}</h1>
        </div>
        <DeleteRequisitionButton id={step.requisition_id} redirectAfter={true} />
      </div>

      <div className="card">
        <h2>Approval history so far</h2>
        <StageTracker
          steps={allSteps || []}
          requisitionStatus={requisition?.status || "in_review"}
          showCopyLink={false}
        />
      </div>

      <div className="card">
        <h2>Job details</h2>
        <p className="meta"><strong>Justification:</strong> {requisition?.justification}</p>
        <p className="meta"><strong>Tasks:</strong> {requisition?.tasks}</p>
        <p className="meta"><strong>Must-have:</strong> {requisition?.must_have}</p>
        {requisition?.attachment_url && (
          <p className="meta">
            <strong>Attachment:</strong>{" "}
            <a href={requisition.attachment_url} target="_blank">View document</a>
          </p>
        )}
      </div>

      {requisition?.advert_text && (
        <div className="card">
          <h2>Advert text</h2>
          <pre className="jd-text">{requisition.advert_text}</pre>
        </div>
      )}

      {requisition?.jd_text && (
        <div className="card">
          <h2>Job description</h2>
          <pre className="jd-text">{requisition.jd_text}</pre>
        </div>
      )}

      {step.status !== "pending" ? (
        <div className="card">
          <p className="muted">You already marked this {step.status}.</p>
        </div>
      ) : isMyTurn ? (
        <div className="card">
          <h2>Review and decide</h2>
          <ReviewActionForm token={step.token} requisition={requisition} />
        </div>
      ) : (
        <div className="card">
          <p className="muted">Waiting on an earlier reviewer before this reaches you.</p>
        </div>
      )}

      {requisition?.status === "ready_to_publish" && (
        <div className="card" style={{ borderLeft: "4px solid #2ecc71" }}>
          <h2>✓ Ready to publish</h2>
          <p className="muted" style={{ marginBottom: 12 }}>
            All stages complete. This is the exact final output that was approved.
          </p>
          {requisition.final_jd_full?.parsed?.skills && (
            <p className="meta"><strong>Skills:</strong> {requisition.final_jd_full.parsed.skills}</p>
          )}
          {requisition.final_jd_full?.parsed?.tags && (
            <p className="meta"><strong>Tags:</strong> {requisition.final_jd_full.parsed.tags}</p>
          )}
          {requisition.final_jd_full?.best_fit?.summary && (
            <p className="meta">{requisition.final_jd_full.best_fit.summary}</p>
          )}
        </div>
      )}
    </main>
  );
}
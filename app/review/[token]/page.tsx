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
        <h2>Requisition details</h2>
        {requisition?.rrf_number && <p className="meta"><strong>RRF number:</strong> {requisition.rrf_number}</p>}
        <p className="meta"><strong>Designation:</strong> {requisition?.designation}</p>
        {requisition?.grade && <p className="meta"><strong>Grade:</strong> {requisition.grade}</p>}
        <p className="meta"><strong>Vacancy reason:</strong> {requisition?.vacancy_reason === "resignation" ? "Resignation" : "New budgeted position"}</p>
        {requisition?.employment_type && <p className="meta"><strong>Type of employment:</strong> {requisition.employment_type}</p>}
        {requisition?.predecessor_name && <p className="meta"><strong>Predecessor name:</strong> {requisition.predecessor_name}</p>}
        {requisition?.predecessor_epf && <p className="meta"><strong>Predecessor EPF:</strong> {requisition.predecessor_epf}</p>}
        {requisition?.predecessor_designation && <p className="meta"><strong>Predecessor designation:</strong> {requisition.predecessor_designation}</p>}
        {requisition?.predecessor_last_day && <p className="meta"><strong>Predecessor last day:</strong> {requisition.predecessor_last_day}</p>}
        {requisition?.company && <p className="meta"><strong>Company:</strong> {requisition.company}</p>}
        {requisition?.approved_budget && <p className="meta"><strong>Approved budget:</strong> {requisition.approved_budget}</p>}
        {requisition?.current_headcount && <p className="meta"><strong>Current head count:</strong> {requisition.current_headcount}</p>}
        {requisition?.approved_budget && requisition?.current_headcount && (
          <p className="meta">
            <strong>GAP:</strong>{" "}
            {(() => {
              const b = parseFloat(requisition.approved_budget);
              const h = parseFloat(requisition.current_headcount);
              return isNaN(b) || isNaN(h) ? "—" : String(b - h);
            })()}
          </p>
        )}
        {requisition?.immediate_supervisor && <p className="meta"><strong>Immediate supervisor:</strong> {requisition.immediate_supervisor}</p>}
        {requisition?.hod && <p className="meta"><strong>HOD:</strong> {requisition.hod}</p>}
        {requisition?.division && <p className="meta"><strong>Division:</strong> {requisition.division}</p>}
        {requisition?.sub_division && <p className="meta"><strong>Sub division:</strong> {requisition.sub_division}</p>}
        {requisition?.location && <p className="meta"><strong>Location:</strong> {requisition.location}</p>}
        {requisition?.ta_lead && <p className="meta"><strong>TA lead:</strong> {requisition.ta_lead}</p>}
        {requisition?.gm_hr && <p className="meta"><strong>GM HR:</strong> {requisition.gm_hr}</p>}
        <p className="meta"><strong>Justification:</strong> {requisition?.justification}</p>
        <p className="meta"><strong>FMCG experience required:</strong> {requisition?.screening_fmcg ? "Yes" : "No"}</p>
        <p className="meta"><strong>Education qualification required:</strong> {requisition?.screening_education ? "Yes" : "No"}</p>
        {requisition?.attachment_url && (
          <p className="meta">
            <strong>Attachment:</strong>{" "}
            <a href={requisition.attachment_url} target="_blank">View document</a>
          </p>
        )}
      </div>

      {requisition?.advert_text && (
        <div className="card">
          <h2>AI advert text</h2>
          <pre className="jd-text">{requisition.advert_text}</pre>
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
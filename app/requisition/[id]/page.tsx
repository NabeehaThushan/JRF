import { supabaseServer } from "@/lib/supabaseServer";
import StageTracker from "@/components/StageTracker";
import Link from "next/link";
import AutoRefresh from "@/components/AutoRefresh";

export const dynamic = "force-dynamic";

export default async function RequisitionPage({ params }: { params: { id: string } }) {
  const supabase = supabaseServer();
  const { data: req } = await supabase.from("requisitions").select("*").eq("id", params.id).single();
  const { data: steps } = await supabase
    .from("review_steps")
    .select("*")
    .eq("requisition_id", params.id)
    .order("stage_order");

  if (!req) return <main className="container"><p>Requisition not found.</p></main>;

  const approved = (steps || []).filter((s: any) => s.status === "approved").length;
  const total = (steps || []).length;

  // @ts-ignore
    return (
    <main className="container">
      <AutoRefresh />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <p className="muted" style={{ margin: 0 }}>
            ← <Link href="/" style={{ color: "#888" }}>Dashboard</Link>
          </p>
          <h1 style={{ margin: "4px 0 0" }}>{req.designation}</h1>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {req.status === "ta_revision" && (
            <Link href={`/requisition/${req.id}/revise`} className="btn-primary" style={{ padding: "8px 14px" }}>
              Revise now →
            </Link>
          )}
          {req.status === "final_ta_review" && (
            <Link href={`/requisition/${req.id}/final-approve`} className="btn-primary" style={{ padding: "8px 14px" }}>
              Final approve →
            </Link>
          )}
        </div>
      </div>

      <div className="card">
        <h2>Overall progress — {approved}/{total} stages approved</h2>
        <div style={{ background: "#f0f0f0", borderRadius: 99, height: 8, marginBottom: 12 }}>
          <div
            style={{
              background: req.status === "ready_to_publish" ? "#2ecc71" : "linear-gradient(90deg,#6a4cff,#2196f3)",
              width: `${total ? (approved / total) * 100 : 0}%`,
              height: "100%",
              borderRadius: 99,
              transition: "width 0.4s",
            }}
          />
        </div>
        <StageTracker steps={steps || []} requisitionStatus={req.status} />
      </div>

      <div className="card">
        <h2>Job details</h2>
        <p className="meta"><strong>Designation:</strong> {req.designation}</p>
        <p className="meta">
          <strong>Vacancy reason:</strong>{" "}
          {req.vacancy_reason === "resignation" ? "Resignation" : "New budgeted position"}
        </p>
        {req.predecessor_name && (
          <p className="meta"><strong>Predecessor:</strong> {req.predecessor_name}</p>
        )}
        <p className="meta"><strong>Justification:</strong> {req.justification}</p>
        <p className="meta"><strong>Tasks:</strong> {req.tasks}</p>
        <p className="meta"><strong>Must-have:</strong> {req.must_have}</p>
        {req.approved_budget && <p className="meta"><strong>Budget:</strong> {req.approved_budget}</p>}
        {req.attachment_url && (
          <p className="meta">
            <strong>Attachment:</strong>{" "}
            <a href={req.attachment_url} target="_blank">View document</a>
          </p>
        )}
      </div>

      {req.advert_text && (
        <div className="card">
          <h2>Advert text</h2>
          <pre className="jd-text">{req.advert_text}</pre>
        </div>
      )}

      {req.jd_text && (
        <div className="card">
          <h2>Job description</h2>
          <pre className="jd-text">{req.jd_text}</pre>
        </div>
      )}

{req.status === "ready_to_publish" && (
  <div className="card" style={{ borderLeft: "4px solid #2ecc71" }}>
    <h2>✓ Ready to publish</h2>
    <p className="muted" style={{ marginBottom: 12 }}>
      All stages complete. This is the exact final output that was approved.
    </p>
    {req.final_jd_full?.parsed?.skills && (
      <p className="meta"><strong>Skills:</strong> {req.final_jd_full.parsed.skills}</p>
    )}
    {req.final_jd_full?.parsed?.tags && (
      <p className="meta"><strong>Tags:</strong> {req.final_jd_full.parsed.tags}</p>
    )}
    {req.final_jd_full?.parsed?.knockout_filters && (
      <p className="meta"><strong>Knockout filters:</strong> {req.final_jd_full.parsed.knockout_filters}</p>
    )}
    {req.final_jd_full?.parsed?.screening_questions && (
      <p className="meta"><strong>Pre-screening questions:</strong> {req.final_jd_full.parsed.screening_questions}</p>
    )}
    {req.final_jd_full?.best_fit && (
      <div style={{ marginTop: 12 }}>
        <strong style={{ fontSize: 13 }}>Best-fit candidate profile</strong>
        {req.final_jd_full.best_fit.summary && <p className="meta">{req.final_jd_full.best_fit.summary}</p>}
        {req.final_jd_full.best_fit.ideal_titles?.length > 0 && (
          <p className="meta"><strong>Likely previous titles:</strong> {req.final_jd_full.best_fit.ideal_titles.join(", ")}</p>
        )}
        {req.final_jd_full.best_fit.must_have_keywords?.length > 0 && (
          <p className="meta"><strong>Strong resume keywords:</strong> {req.final_jd_full.best_fit.must_have_keywords.join(", ")}</p>
        )}
      </div>
    )}
  </div>
)}
    </main>
  );
}
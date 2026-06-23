"use client";

import { useState } from "react";
import { finalApprove } from "./actions";

export default function FinalApproveForm({
  requisitionId,
  requisition,
  steps,
}: {
  requisitionId: string;
  requisition: any;
  steps: any[];
}) {
  const [result, setResult] = useState<any>(null);
  const [advertText, setAdvertText] = useState(requisition.advert_text || "");
  const [generating, setGenerating] = useState(false);
  const [pending, setPending] = useState(false);
  const [published, setPublished] = useState(false);

  const approvedSteps = steps.filter((s) => s.status === "approved");
  const stepsWithComments = steps.filter((s) => s.comment);

  const reviewerNotes = stepsWithComments
    .map((s) => `Stage ${s.stage_order} - ${s.reviewer_name}: "${s.comment}"`)
    .join("\n");

  const allApproved = steps.every((s) => s.status === "approved");

  async function generate() {
    setGenerating(true);
    try {
      const enrichedTasks = (requisition.tasks || requisition.jd_text || "") +
        (reviewerNotes ? `\n\nReviewer feedback to incorporate:\n${reviewerNotes}` : "");

      const fd = new FormData();
      fd.append("role_title", requisition.designation || "");
      fd.append("reason", requisition.justification || "");
      fd.append("tasks", enrichedTasks);
      fd.append("must_have", requisition.must_have || "");
      fd.append("salary", requisition.approved_budget || "");
      fd.append("company", requisition.company || "Ceylon Biscuits Limited");
      fd.append("location", requisition.location || "Pannipitiya");
      fd.append("company_description", "CBL Group is a leading FMCG conglomerate in Sri Lanka.");

      const res = await fetch("/api/generate-jd", { method: "POST", body: fd });
      const data = await res.json();
      setResult(data);
      if (data.advert_text) setAdvertText(data.advert_text);
      else if (data.final_jd) setAdvertText(data.final_jd);
    } catch (e) {
      alert("Generation failed. Check the backend is running.");
    } finally {
      setGenerating(false);
    }
  }

  async function handle() {
    setPending(true);
    await finalApprove(requisitionId, result?.final_jd || requisition.jd_text || "", advertText, result);
    setPublished(true);
  }

  if (published) {
    return (
      <div className="card" style={{ borderLeft: "4px solid #2ecc71", textAlign: "center", padding: 40 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
        <h2 style={{ color: "#137a3d", margin: "0 0 8px" }}>Published</h2>
        <p className="muted">This requisition is approved and ready to go live.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <h2>Requisition details</h2>
        {requisition.rrf_number && <p className="meta"><strong>RRF number:</strong> {requisition.rrf_number}</p>}
        <p className="meta"><strong>Designation:</strong> {requisition.designation}</p>
        {requisition.grade && <p className="meta"><strong>Grade:</strong> {requisition.grade}</p>}
        <p className="meta"><strong>Vacancy reason:</strong> {requisition.vacancy_reason === "resignation" ? "Resignation" : "New budgeted position"}</p>
        {requisition.employment_type && <p className="meta"><strong>Type of employment:</strong> {requisition.employment_type}</p>}
        {requisition.predecessor_name && <p className="meta"><strong>Predecessor name:</strong> {requisition.predecessor_name}</p>}
        {requisition.predecessor_epf && <p className="meta"><strong>Predecessor EPF:</strong> {requisition.predecessor_epf}</p>}
        {requisition.predecessor_designation && <p className="meta"><strong>Predecessor designation:</strong> {requisition.predecessor_designation}</p>}
        {requisition.predecessor_last_day && <p className="meta"><strong>Predecessor last day:</strong> {requisition.predecessor_last_day}</p>}
        {requisition.company && <p className="meta"><strong>Company:</strong> {requisition.company}</p>}
        {requisition.approved_budget && <p className="meta"><strong>Approved budget:</strong> {requisition.approved_budget}</p>}
        {requisition.current_headcount && <p className="meta"><strong>Current head count:</strong> {requisition.current_headcount}</p>}
        {requisition.approved_budget && requisition.current_headcount && (
          <p className="meta">
            <strong>GAP:</strong>{" "}
            {(() => {
              const b = parseFloat(requisition.approved_budget);
              const h = parseFloat(requisition.current_headcount);
              return isNaN(b) || isNaN(h) ? "—" : String(b - h);
            })()}
          </p>
        )}
        {requisition.immediate_supervisor && <p className="meta"><strong>Immediate supervisor:</strong> {requisition.immediate_supervisor}</p>}
        {requisition.hod && <p className="meta"><strong>HOD:</strong> {requisition.hod}</p>}
        {requisition.division && <p className="meta"><strong>Division:</strong> {requisition.division}</p>}
        {requisition.sub_division && <p className="meta"><strong>Sub division:</strong> {requisition.sub_division}</p>}
        {requisition.location && <p className="meta"><strong>Location:</strong> {requisition.location}</p>}
        {requisition.ta_lead && <p className="meta"><strong>TA lead:</strong> {requisition.ta_lead}</p>}
        {requisition.gm_hr && <p className="meta"><strong>GM HR:</strong> {requisition.gm_hr}</p>}
        <p className="meta"><strong>Justification:</strong> {requisition.justification}</p>
        <p className="meta"><strong>FMCG experience required:</strong> {requisition.screening_fmcg ? "Yes" : "No"}</p>
        <p className="meta"><strong>Education qualification required:</strong> {requisition.screening_education ? "Yes" : "No"}</p>
        {requisition.attachment_url && (
          <p className="meta">
            <strong>Attachment:</strong>{" "}
            <a href={requisition.attachment_url} target="_blank">View document</a>
          </p>
        )}
      </div>

      {/* Reviewer decisions */}
      <div className="card">
        <h2>Reviewer decisions — {approvedSteps.length}/{steps.length} approved</h2>
        {steps.map((s) => (
            <div key={s.id} style={{
              display: "flex", justifyContent: "space-between", alignItems: "flex-start",
              padding: "10px 0", borderBottom: "1px solid #f0f0f0",
            }}>
              <div>
                <p style={{margin: 0, fontWeight: 600, fontSize: 13}}>
                  Stage {s.stage_order}: {s.reviewer_name}
                </p>
                {s.comment && (
                    <p style={{margin: "4px 0 0", fontSize: 12, color: "#555"}}>"{s.comment}"</p>
                )}
                {(s.section_advert || s.section_jd || s.section_knockout || s.section_screening) && (
                    <div style={{display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6}}>
                      {[
                        {label: "Advert", val: s.section_advert},
                        {label: "JD", val: s.section_jd},
                        {label: "Knockout", val: s.section_knockout},
                        {label: "Screening", val: s.section_screening},
                      ].map(({label, val}) => val ? (
                          <span key={label} style={{
                            fontSize: 11, padding: "2px 8px", borderRadius: 20, fontWeight: 600,
                            background: val === "approved" ? "#e3f8e9" : "#fdeaea",
                            color: val === "approved" ? "#137a3d" : "#a33",
                            border: `1px solid ${val === "approved" ? "#bfe8cd" : "#f3c2c2"}`,
                          }}>
                      {val === "approved" ? "✓" : "✕"} {label}
                    </span>
                      ) : null)}
                    </div>
                )}
              </div>
              <span style={{
                fontSize: 11, padding: "2px 10px", borderRadius: 20, fontWeight: 600, flexShrink: 0,
                background: s.status === "approved" ? "#e3f8e9" : "#fdeaea",
                color: s.status === "approved" ? "#137a3d" : "#a33",
                border: `1px solid ${s.status === "approved" ? "#bfe8cd" : "#f3c2c2"}`,
              }}>
              {s.status === "approved" ? "✓ Approved" : s.status}
            </span>
            </div>
        ))}
      </div>

      {/* Current advert text */}
      {requisition.advert_text && !result && (
          <div className="card">
            <h2>Current advert text</h2>
            <pre className="jd-text">{requisition.advert_text}</pre>
          </div>
      )}

      {/* Generate button */}
      <div className="card">
        <h2>Generate final advert</h2>
        <p className="muted" style={{marginBottom: 12}}>
          {stepsWithComments.length > 0
              ? `Incorporates feedback from ${stepsWithComments.length} reviewer${stepsWithComments.length > 1 ? "s" : ""} into the final advert.`
              : "All reviewers approved with no changes requested. Generates the final advert from the original details."}
        </p>
        <button
            className="btn-primary"
            onClick={generate}
            disabled={generating}
            type="button"
        >
          {generating ? "Generating... (40–50 sec)" : result ? "↻ Regenerate" : "✦ Generate final advert →"}
        </button>
      </div>

      {/* Generated output */}
      {result && (
          <>
            <div className="card">
            <h2>Final advert text</h2>
            <pre className="jd-text" style={{ marginBottom: 12 }}>{advertText}</pre>
          </div>

          {(result.parsed?.skills || result.parsed?.tags) && (
            <div className="card">
              <h2>Skills and tags</h2>
              {result.parsed?.skills && <p className="meta"><strong>Skills:</strong> {result.parsed.skills}</p>}
              {result.parsed?.tags && <p className="meta"><strong>Tags:</strong> {result.parsed.tags}</p>}
            </div>
          )}

          {(result.parsed?.knockout_filters || result.parsed?.screening_questions) && (
            <div className="card">
              <h2>Screening</h2>
              {result.parsed?.knockout_filters && (
                <p className="meta"><strong>Knockout filters:</strong> {result.parsed.knockout_filters}</p>
              )}
              {result.parsed?.screening_questions && (
                <p className="meta"><strong>Pre-screening questions:</strong> {result.parsed.screening_questions}</p>
              )}
            </div>
          )}

          {result.best_fit && (
            <div className="card">
              <h2>Best-fit candidate profile</h2>
              {result.best_fit.summary && <p className="meta">{result.best_fit.summary}</p>}
              {result.best_fit.years_experience_min !== undefined && (
                <p className="meta">
                  <strong>Experience:</strong> {result.best_fit.years_experience_min}–{result.best_fit.years_experience_max} years
                </p>
              )}
              {result.best_fit.ideal_titles?.length > 0 && (
                <p className="meta"><strong>Likely previous titles:</strong> {result.best_fit.ideal_titles.join(", ")}</p>
              )}
              {result.best_fit.must_have_keywords?.length > 0 && (
                <p className="meta"><strong>Strong resume keywords:</strong> {result.best_fit.must_have_keywords.join(", ")}</p>
              )}
              {result.best_fit.red_flag_keywords?.length > 0 && (
                <p className="meta"><strong>Watch-out signals:</strong> {result.best_fit.red_flag_keywords.join(", ")}</p>
              )}
            </div>
          )}

          <div className="card" style={{ textAlign: "center", padding: 24 }}>
            <p className="muted" style={{ marginBottom: 16 }}>
              Once published, this advert and best-fit profile will be saved permanently.
            </p>
            <button
              className="btn-primary"
              disabled={pending}
              onClick={handle}
              type="button"
              style={{ padding: "12px 32px", fontSize: 15 }}
            >
              ✓ Approve and publish
            </button>
          </div>
        </>
      )}
    </div>
  );
}
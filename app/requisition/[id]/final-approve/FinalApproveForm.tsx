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
  const [jdText, setJdText] = useState(requisition.jd_text || "");
  const [advertText, setAdvertText] = useState(requisition.advert_text || "");
  const [generating, setGenerating] = useState(false);
  const [pending, setPending] = useState(false);

  const reviewerNotes = steps
    .filter((s) => s.comment)
    .map((s) => `Stage ${s.stage_order} - ${s.reviewer_name}: "${s.comment}"`)
    .join("\n");

  async function generateJD() {
    setGenerating(true);
    try {
      const enrichedTasks =
        requisition.tasks + (reviewerNotes ? `\n\nReviewer feedback to incorporate:\n${reviewerNotes}` : "");

      const res = await fetch("/api/generate-jd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role_title: requisition.designation,
          reason: requisition.justification,
          tasks: enrichedTasks,
          must_have: requisition.must_have,
          salary: requisition.approved_budget || "",
          company: requisition.company || "Ceylon Biscuits Limited",
          company_description: "CBL Group is a leading FMCG conglomerate in Sri Lanka.",
        }),
      });
      const data = await res.json();
      if (data.final_jd) {
        setResult(data);
        setJdText(data.final_jd);
        if (data.parsed?.job_description) setAdvertText(data.parsed.job_description);
      } else {
        alert("Generation failed. Check the backend is running.");
      }
    } catch (e) {
      alert("Generation failed. Check the backend is running.");
    } finally {
      setGenerating(false);
    }
  }

  async function handle() {
    setPending(true);
    await finalApprove(requisitionId, jdText, advertText, result);
  }

  return (
    <div>
      {steps.filter((s) => s.comment).length > 0 && (
        <div className="card">
          <h2>Reviewer comments used in JD generation</h2>
          {steps.filter((s) => s.comment).map((s) => (
            <div key={s.id} className="req-row" style={{ marginBottom: 8 }}>
              <div className="top">
                <strong>Stage {s.stage_order}: {s.reviewer_name}</strong>
                <span className="status-pill status-approved">{s.status}</span>
              </div>
              <p className="meta">"{s.comment}"</p>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h2>Generate final JD</h2>
        <p className="muted" style={{ marginBottom: 12 }}>
          Generates directly from the backend, using every reviewer's comments. The full result gets
          saved permanently the moment you publish — nothing is lost afterward.
        </p>
        <button className="btn-primary" onClick={generateJD} disabled={generating} type="button">
          {generating ? "Generating... (20-30 sec)" : "✦ Generate JD from all feedback →"}
        </button>
      </div>

      {result && (
        <>
          <div className="card">
            <h2>Job description</h2>
            <div className="field full">
              <label>JD text (edit if needed)</label>
              <textarea rows={10} value={jdText} onChange={(e) => setJdText(e.target.value)} />
            </div>
            <div className="field full" style={{ marginTop: 12 }}>
              <label>Advert text (edit if needed)</label>
              <textarea rows={4} value={advertText} onChange={(e) => setAdvertText(e.target.value)} />
            </div>
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

          <div className="card">
            <button className="btn-primary" disabled={pending} onClick={handle} type="button">
              ✓ Approve and publish
            </button>
          </div>
        </>
      )}
    </div>
  );
}
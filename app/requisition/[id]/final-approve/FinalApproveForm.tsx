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
  const [jdText, setJdText] = useState(requisition.jd_text || "");
  const [advertText, setAdvertText] = useState(requisition.advert_text || "");
  const [generating, setGenerating] = useState(false);
  const [pending, setPending] = useState(false);

  // Build a combined context from all reviewer comments
  const reviewerNotes = steps
    .filter((s) => s.comment)
    .map((s) => `Stage ${s.stage_order} - ${s.reviewer_name}: "${s.comment}"`)
    .join("\n");

  async function openAndGenerate() {
  const base = "https://vezpr-jd-gen-production-5b83.up.railway.app";

  const reviewerNotes = steps
    .filter((s) => s.comment)
    .map((s) => `Stage ${s.stage_order} - ${s.reviewer_name}: "${s.comment}"`)
    .join("\n");

  const enrichedTasks = requisition.tasks +
    (reviewerNotes ? `\n\nReviewer feedback:\n${reviewerNotes}` : "");

  const params = new URLSearchParams({
    role_title: requisition.designation,
    reason: requisition.justification,
    tasks: enrichedTasks,
    must_have: requisition.must_have,
    salary: requisition.approved_budget || "",
    company: "CBL Group",
    company_description: "CBL Group is a leading FMCG conglomerate in Sri Lanka.",
    knockout_filters: [
      requisition.screening_fmcg ? "Do you have FMCG experience?" : "",
      requisition.screening_education ? "Do you meet the education requirements?" : "",
    ].filter(Boolean).join("\n"),
    autogenerate: "true", // ← this tells the JD site to auto-trigger generation
  });

  window.open(`${base}/?${params.toString()}`, "_blank");
}

  async function generateJD() {
    if (!requisition.designation) return;
    setGenerating(true);
    try {

      // Combine original tasks/must-have with reviewer feedback
      const enrichedTasks = requisition.tasks +
        (reviewerNotes ? `\n\nReviewer feedback to incorporate:\n${reviewerNotes}` : "");

      const res = await fetch(`/api/generate-jd`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role_title: requisition.designation,
          reason: requisition.justification,
          tasks: enrichedTasks,
          must_have: requisition.must_have,
          salary: requisition.approved_budget || "",
          company: "CBL Group",
          company_description: "CBL Group is a leading FMCG conglomerate in Sri Lanka.",
          knockout_filters: [
            requisition.screening_fmcg ? "Do you have FMCG experience?" : "",
            requisition.screening_education ? "Do you meet the education requirements?" : "",
          ].filter(Boolean).join("\n"),
        }),
      });

      const data = await res.json();
      if (data.final_jd) setJdText(data.final_jd);
      if (data.parsed?.job_description) setAdvertText(data.parsed.job_description);
    } catch (e) {
      alert("Generation failed. Check Railway is running.");
    } finally {
      setGenerating(false);
    }
  }

  async function handle() {
    setPending(true);
    await finalApprove(requisitionId, jdText, advertText);
  }

  return (
    <div>
      {/* Show all reviewer comments */}
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
          This uses all the original job details plus every reviewer's comments to generate the final JD.
        </p>
        <button
          className="btn-primary"
          onClick={openAndGenerate}
          disabled={generating}
          type="button"
        >
          {generating ? "Generating... (20–30 sec)" : "✦ Generate JD from all feedback →"}
        </button>
      </div>

      {jdText && (
        <div className="card">
          <h2>Final JD — review and edit</h2>
          <div className="field full">
            <label>JD text</label>
            <textarea
              rows={12}
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
            />
          </div>
          <div className="field full" style={{ marginTop: 12 }}>
            <label>Advert text</label>
            <textarea
              rows={5}
              value={advertText}
              onChange={(e) => setAdvertText(e.target.value)}
            />
          </div>
          <button
            className="btn-primary"
            disabled={pending}
            onClick={handle}
            style={{ marginTop: 12 }}
            type="button"
          >
            ✓ Approve and publish
          </button>
        </div>
      )}
    </div>
  );
}
"use client";

import { useState } from "react";
import { finalApprove } from "./actions";

export default function FinalApproveForm({
  requisitionId,
  requisition,
  steps,
}: {
  requisitionId: string;
  requisition: {
    jd_text: string | null;
    advert_text: string | null;
    designation: string;
    justification: string;
    tasks: string;
    must_have: string;
    approved_budget: string | null;
    screening_fmcg: boolean;
    screening_education: boolean;
  };
  steps: {
    id: string;
    stage_order: number;
    reviewer_name: string;
    status: string;
    comment: string | null;
  }[];
}) {
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
      const enrichedTasks = requisition.tasks +
        (reviewerNotes ? `\n\nReviewer feedback to incorporate:\n${reviewerNotes}` : "");

      const fd = new FormData();
      fd.append("role_title", requisition.designation);
      fd.append("reason", requisition.justification);
      fd.append("tasks", enrichedTasks);
      fd.append("must_have", requisition.must_have);
      fd.append("salary", requisition.approved_budget || "");
      fd.append("company", "Ceylon Biscuits Limited");
      fd.append("company_description", "CBL Group is a leading FMCG conglomerate in Sri Lanka.");
      fd.append("location", "Pannipitiya");
      fd.append("knockout_filters", [
        requisition.screening_fmcg ? "Do you have FMCG experience?" : "",
        requisition.screening_education ? "Do you meet the education requirements?" : "",
      ].filter(Boolean).join("\n"));

      const res = await fetch("/api/generate-jd", { method: "POST", body: fd });
      const data = await res.json();
      if (data.final_jd) setJdText(data.final_jd);
      if (data.advert_text) setAdvertText(data.advert_text);
    } catch (e) {
      alert("Generation failed.");
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
          Uses all original job details plus every reviewer comment. Generates both the full JD and public advert. Takes 40–50 seconds.
        </p>
        <button
          className="btn-primary"
          onClick={generateJD}
          disabled={generating}
          type="button"
        >
          {generating ? "Generating... (40–50 sec)" : "✦ Generate JD from all feedback →"}
        </button>
      </div>

      {(jdText || advertText) && (
        <div className="card">
          <h2>Final advert text — review and edit</h2>
          <div className="field full">
            <label>Advert text</label>
            <textarea
              rows={8}
              value={advertText}
              onChange={(e) => setAdvertText(e.target.value)}
            />
          </div>

          <h2 style={{ marginTop: 16 }}>Full JD — review and edit</h2>
          <div className="field full">
            <label>AI JD text</label>
            <textarea
              rows={14}
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
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
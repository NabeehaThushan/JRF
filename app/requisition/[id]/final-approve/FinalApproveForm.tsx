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
  const reviewerNotes = steps
    .filter((s) => s.comment)
    .map((s) => `Stage ${s.stage_order} - ${s.reviewer_name}: "${s.comment}"`)
    .join("\n");

  const [roleTitle, setRoleTitle] = useState(requisition.designation || "");
  const [reason, setReason] = useState(requisition.justification || "");
  const [tasksInput, setTasksInput] = useState(
    requisition.tasks + (reviewerNotes ? `\n\nReviewer feedback to incorporate:\n${reviewerNotes}` : "")
  );
  const [mustHave, setMustHave] = useState(requisition.must_have || "");
  const [salary, setSalary] = useState(requisition.approved_budget || "");
  const [company, setCompany] = useState(requisition.company || "Ceylon Biscuits Limited");
  const [templateText, setTemplateText] = useState("");
  const [templateFileName, setTemplateFileName] = useState("");

  const [result, setResult] = useState<any>(null);
  const [jdText, setJdText] = useState(requisition.jd_text || "");
  const [advertText, setAdvertText] = useState(requisition.advert_text || "");
  const [generating, setGenerating] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleDocUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setTemplateFileName(file.name);
    const arrayBuffer = await file.arrayBuffer();
    const mammoth = (await import("mammoth")).default;
    const res = await mammoth.extractRawText({ arrayBuffer });
    setTemplateText(res.value);
  }

  async function generateJD() {
    setGenerating(true);
    try {
      const companyDescription = templateText
        ? `Use the following company introduction VERBATIM at the start of the advert and JD, do not change a single word of it:\n\n${templateText}\n\nThe designation is: ${roleTitle}. The company is: ${company}. The location is: ${requisition.location || "Pannipitiya"}.`
        : "CBL Group is a leading FMCG conglomerate in Sri Lanka.";

      const fd = new FormData();
      fd.append("role_title", roleTitle);
      fd.append("reason", reason);
      fd.append("tasks", tasksInput);
      fd.append("must_have", mustHave);
      fd.append("salary", salary);
      fd.append("company", company);
      fd.append("company_description", companyDescription);
      fd.append("location", requisition.location || "Pannipitiya");

      const res = await fetch("/api/generate-jd", { method: "POST", body: fd });
      const data = await res.json();
      if (data.final_jd) {
        setResult(data);
        setJdText(data.final_jd);
        if (data.advert_text) setAdvertText(data.advert_text);
        else if (data.parsed?.job_description) setAdvertText(data.parsed.job_description);
      } else {
        alert("Generation failed. Check the backend is running.");
      }
    } catch (e) {
      alert("Generation failed.");
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
          <h2>Reviewer comments</h2>
          {steps.filter((s) => s.comment).map((s) => (
            <div key={s.id} className="req-row" style={{ marginBottom: 8 }}>
              <div className="top">
                <strong>Stage {s.stage_order}: {s.reviewer_name}</strong>
                <span className="status-pill status-approved">{s.status}</span>
              </div>
              <p className="meta">"{s.comment}"</p>
              {(s.section_jd || s.section_advert || s.section_knockout || s.section_screening) && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                  {[
                    { label: "JD", val: s.section_jd },
                    { label: "Advert", val: s.section_advert },
                    { label: "Knockout", val: s.section_knockout },
                    { label: "Screening", val: s.section_screening },
                  ].map(({ label, val }) => val && (
                    <span key={label} style={{
                      fontSize: 11, padding: "2px 8px", borderRadius: 20, fontWeight: 600,
                      background: val === "approved" ? "#e3f8e9" : "#fdeaea",
                      color: val === "approved" ? "#137a3d" : "#a33",
                    }}>
                      {val === "approved" ? "✓" : "✕"} {label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h2>CBL advert template (optional)</h2>
        <p className="muted" style={{ marginBottom: 12 }}>
          Upload the CBL Word document (.docx). The company introduction will be kept verbatim;
          designation, location and role details will come from the form below.
        </p>
        <input type="file" accept=".docx" onChange={handleDocUpload} style={{ marginBottom: 8 }} />
        {templateFileName && (
          <p className="meta" style={{ marginTop: 4 }}>
            Loaded: {templateFileName} — {templateText.length} characters extracted
          </p>
        )}
        {templateText && (
          <details style={{ marginTop: 8 }}>
            <summary style={{ fontSize: 12, color: "#888", cursor: "pointer" }}>Preview extracted text</summary>
            <pre style={{ fontSize: 11, color: "#666", marginTop: 8, whiteSpace: "pre-wrap", maxHeight: 180, overflowY: "auto" }}>
              {templateText}
            </pre>
          </details>
        )}
      </div>

      <div className="card">
        <h2>Generation inputs</h2>
        <p className="muted" style={{ marginBottom: 12 }}>
          Pre-filled from the requisition. Edit anything, regenerate as many times as needed.
        </p>
        <div className="field full">
          <label>Job title</label>
          <input value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} />
        </div>
        <div className="field full" style={{ marginTop: 12 }}>
          <label>Reason role opened</label>
          <textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
        <div className="field full" style={{ marginTop: 12 }}>
          <label>Tasks (reviewer notes appended below if any)</label>
          <textarea rows={6} value={tasksInput} onChange={(e) => setTasksInput(e.target.value)} />
        </div>
        <div className="field full" style={{ marginTop: 12 }}>
          <label>Must-have</label>
          <textarea rows={3} value={mustHave} onChange={(e) => setMustHave(e.target.value)} />
        </div>
        <div className="row" style={{ marginTop: 12 }}>
          <div>
            <label>Salary / budget</label>
            <input value={salary} onChange={(e) => setSalary(e.target.value)} />
          </div>
          <div>
            <label>Company</label>
            <input value={company} onChange={(e) => setCompany(e.target.value)} />
          </div>
        </div>
        <button
          className="btn-primary"
          onClick={generateJD}
          disabled={generating}
          type="button"
          style={{ marginTop: 16 }}
        >
          {generating ? "Generating... (40-50 sec)" : result ? "↻ Regenerate" : "✦ Generate JD →"}
        </button>
      </div>

      {(advertText || jdText) && (
        <>
          <div className="card">
            <h2>Advert text</h2>
            <div className="field full">
              <label>Edit if needed</label>
              <textarea rows={8} value={advertText} onChange={(e) => setAdvertText(e.target.value)} />
            </div>
          </div>

          <div className="card">
            <h2>AI JD text</h2>
            <div className="field full">
              <label>Edit if needed</label>
              <textarea rows={14} value={jdText} onChange={(e) => setJdText(e.target.value)} />
            </div>
          </div>

          {result && (result.parsed?.skills || result.parsed?.tags) && (
            <div className="card">
              <h2>Skills and tags</h2>
              {result.parsed?.skills && <p className="meta"><strong>Skills:</strong> {result.parsed.skills}</p>}
              {result.parsed?.tags && <p className="meta"><strong>Tags:</strong> {result.parsed.tags}</p>}
            </div>
          )}

          {result && (result.parsed?.knockout_filters || result.parsed?.screening_questions) && (
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

          {result?.best_fit && (
            <div className="card">
              <h2>Best-fit candidate profile</h2>
              {result.best_fit.summary && <p className="meta">{result.best_fit.summary}</p>}
              {result.best_fit.ideal_titles?.length > 0 && (
                <p className="meta"><strong>Likely previous titles:</strong> {result.best_fit.ideal_titles.join(", ")}</p>
              )}
              {result.best_fit.must_have_keywords?.length > 0 && (
                <p className="meta"><strong>Strong resume keywords:</strong> {result.best_fit.must_have_keywords.join(", ")}</p>
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
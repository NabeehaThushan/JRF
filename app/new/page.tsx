"use client";

import { useState } from "react";
import { createRequisition } from "./actions";

interface Reviewer {
  name: string;
  email: string;
}

export default function NewRequisitionPage() {
  const [taName, setTaName] = useState("");
  const [taEmail, setTaEmail] = useState("");
  const [rrfNumber, setRrfNumber] = useState("");
  const [vacancyReason, setVacancyReason] = useState("resignation");
  const [designation, setDesignation] = useState("");
  const [grade, setGrade] = useState("");
  const [employmentType, setEmploymentType] = useState("Permanent");
  const [predecessorName, setPredecessorName] = useState("");
  const [predecessorEpf, setPredecessorEpf] = useState("");
  const [predecessorDesignation, setPredecessorDesignation] = useState("");
  const [predecessorLastDay, setPredecessorLastDay] = useState("");
  const [company, setCompany] = useState("Ceylon Biscuits Limited");
  const [approvedBudget, setApprovedBudget] = useState("");
  const [currentHeadcount, setCurrentHeadcount] = useState("");
  const [immediateSupervisor, setImmediateSupervisor] = useState("");
  const [hod, setHod] = useState("");
  const [division, setDivision] = useState("");
  const [subDivision, setSubDivision] = useState("");
  const [location, setLocation] = useState("");
  const [taLead, setTaLead] = useState("");
  const [gmHr, setGmHr] = useState("");
  const [justification, setJustification] = useState("");
  const [jdText, setJdText] = useState("");
  const [advertText, setAdvertText] = useState("");
  const [generating, setGenerating] = useState(false);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [reviewers, setReviewers] = useState<Reviewer[]>([
    { name: "", email: "" },
    { name: "", email: "" },
    { name: "", email: "" },
    { name: "", email: "" },
    { name: "", email: "" },
    { name: "", email: "" },
  ]);

  const gap = (() => {
    const b = parseFloat(approvedBudget);
    const h = parseFloat(currentHeadcount);
    if (isNaN(b) || isNaN(h)) return "—";
    return String(b - h);
  })();

  async function generateAdvert() {
    if (!designation || !justification) {
      alert("Fill in designation and justification before generating.");
      return;
    }
    setGenerating(true);
    try {
      const fd = new FormData();
      fd.append("role_title", designation);
      fd.append("reason", justification);
      fd.append("tasks", jdText || "See job description above");
      fd.append("must_have", "See job description above");
      fd.append("salary", approvedBudget || "");
      fd.append("company", company || "Ceylon Biscuits Limited");
      fd.append("location", location || "Pannipitiya");
      fd.append("company_description", "CBL Group is a leading FMCG conglomerate in Sri Lanka.");
      if (docFile) fd.append("document", docFile);

      const res = await fetch("/api/generate-jd", { method: "POST", body: fd });
      const data = await res.json();
      if (data.advert_text) {
        setAdvertText(data.advert_text);
      } else if (data.final_jd) {
        setAdvertText(data.final_jd);
      } else {
        alert("Generation failed.");
      }
    } catch (e) {
      alert("Generation failed.");
    } finally {
      setGenerating(false);
    }
  }

  function updateReviewer(i: number, field: "name" | "email", value: string) {
    setReviewers((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  }

  function addReviewer() {
    setReviewers((prev) => [...prev, { name: "", email: "" }]);
  }

  function removeReviewer(i: number) {
    setReviewers((prev) => prev.filter((_, idx) => idx !== i));
  }

  return (
    <main className="container">
      <h1>New requisition</h1>
      <form action={createRequisition}>

        <div className="card">
          <h2>Your details</h2>
          <div className="row">
            <div>
              <label>Your name *</label>
              <input name="taName" value={taName} onChange={(e) => setTaName(e.target.value)} required />
            </div>
            <div>
              <label>Your email *</label>
              <input name="taEmail" type="email" value={taEmail} onChange={(e) => setTaEmail(e.target.value)} required />
            </div>
          </div>
        </div>

        <div className="card">
          <h2>Requisition details</h2>

          <div className="row">
            <div>
              <label>RRF number</label>
              <input name="rrfNumber" value={rrfNumber} onChange={(e) => setRrfNumber(e.target.value)} />
            </div>
            <div>
              <label>Vacancy arising due to *</label>
              <select name="vacancyReason" value={vacancyReason} onChange={(e) => setVacancyReason(e.target.value)}>
                <option value="resignation">Resignation</option>
                <option value="new_position">Budgeted new position</option>
              </select>
            </div>
          </div>

          <div className="row" style={{ marginTop: 12 }}>
            <div>
              <label>Designation *</label>
              <input name="designation" value={designation} onChange={(e) => setDesignation(e.target.value)} required />
            </div>
            <div>
              <label>Grade</label>
              <input name="grade" value={grade} onChange={(e) => setGrade(e.target.value)} />
            </div>
          </div>

          <div className="row" style={{ marginTop: 12 }}>
            <div>
              <label>Type of employment</label>
              <input name="employmentType" value={employmentType} onChange={(e) => setEmploymentType(e.target.value)} />
            </div>
            <div></div>
          </div>

          {vacancyReason === "resignation" && (
            <>
              <div className="row" style={{ marginTop: 12 }}>
                <div>
                  <label>Predecessor name</label>
                  <input name="predecessorName" value={predecessorName} onChange={(e) => setPredecessorName(e.target.value)} />
                </div>
                <div>
                  <label>Predecessor EPF no.</label>
                  <input name="predecessorEpf" value={predecessorEpf} onChange={(e) => setPredecessorEpf(e.target.value)} />
                </div>
              </div>
              <div className="row" style={{ marginTop: 12 }}>
                <div>
                  <label>Predecessor designation</label>
                  <input name="predecessorDesignation" value={predecessorDesignation} onChange={(e) => setPredecessorDesignation(e.target.value)} />
                </div>
                <div>
                  <label>Predecessor last working day (P.E.D.)</label>
                  <input name="predecessorLastDay" type="date" value={predecessorLastDay} onChange={(e) => setPredecessorLastDay(e.target.value)} />
                </div>
              </div>
            </>
          )}

          <div className="row" style={{ marginTop: 12 }}>
            <div>
              <label>Company for the recruitment</label>
              <input name="company" value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>
            <div></div>
          </div>

          <div className="row" style={{ marginTop: 12 }}>
            <div>
              <label>Approved budget</label>
              <input name="approvedBudget" value={approvedBudget} onChange={(e) => setApprovedBudget(e.target.value)} />
            </div>
            <div>
              <label>Current head count</label>
              <input name="currentHeadcount" value={currentHeadcount} onChange={(e) => setCurrentHeadcount(e.target.value)} />
            </div>
          </div>

          <div className="row" style={{ marginTop: 12 }}>
            <div>
              <label>GAP (approved budget − current head count)</label>
              <input value={gap} disabled />
            </div>
            <div></div>
          </div>

          <div className="row" style={{ marginTop: 12 }}>
            <div>
              <label>Immediate supervisor</label>
              <input name="immediateSupervisor" value={immediateSupervisor} onChange={(e) => setImmediateSupervisor(e.target.value)} />
            </div>
            <div>
              <label>HOD</label>
              <input name="hod" value={hod} onChange={(e) => setHod(e.target.value)} />
            </div>
          </div>

          <div className="row" style={{ marginTop: 12 }}>
            <div>
              <label>Division 1</label>
              <input name="division" value={division} onChange={(e) => setDivision(e.target.value)} />
            </div>
            <div>
              <label>Sub division</label>
              <input name="subDivision" value={subDivision} onChange={(e) => setSubDivision(e.target.value)} />
            </div>
          </div>

          <div className="row" style={{ marginTop: 12 }}>
            <div>
              <label>Location</label>
              <input name="location" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
            <div>
              <label>TA lead</label>
              <input name="taLead" value={taLead} onChange={(e) => setTaLead(e.target.value)} />
            </div>
          </div>

          <div className="row" style={{ marginTop: 12 }}>
            <div>
              <label>GM HR</label>
              <input name="gmHr" value={gmHr} onChange={(e) => setGmHr(e.target.value)} />
            </div>
            <div></div>
          </div>

          <div style={{ marginTop: 16 }}>
            <div className="toggle-row">
              <label><input type="checkbox" name="screeningFmcg" defaultChecked /> FMCG experience required</label>
              <label><input type="checkbox" name="screeningEducation" defaultChecked /> Education qualification required</label>
            </div>
          </div>

          <div className="field full" style={{ marginTop: 16 }}>
            <label>Justification (why this role opened) *</label>
            <textarea name="justification" rows={3} value={justification} onChange={(e) => setJustification(e.target.value)} required />
          </div>


          <div style={{ marginTop: 20 }}>
            <label>AI advert template (optional)</label>
            <p className="muted" style={{ marginBottom: 8 }}>
              Upload the CBL Word template (.docx). The AI will keep the company introduction verbatim and fill in designation, location, role profile and personal profile from the details above.
            </p>
            <input
              type="file"
              accept=".docx"
              onChange={(e) => setDocFile(e.target.files?.[0] || null)}
              style={{ marginBottom: 8 }}
            />
            {docFile && <p className="meta" style={{ marginTop: 4 }}>Loaded: {docFile.name}</p>}
            <button
              type="button"
              className="btn-primary"
              onClick={generateAdvert}
              disabled={generating}
              style={{ marginTop: 12 }}
            >
              {generating ? "Generating advert... (40–50 sec)" : "✦ Generate AI advert →"}
            </button>
            {advertText && (
              <div className="field full" style={{ marginTop: 14 }}>
                <label>AI Advert text (edit if needed)</label>
                <textarea name="advertText" rows={8} value={advertText} onChange={(e) => setAdvertText(e.target.value)} />
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <h2>Supporting document (optional)</h2>
          <p className="muted">Upload an existing JD, org chart, or any reference document.</p>
          <input
            type="file"
            name="attachment"
            accept=".pdf,.doc,.docx"
            onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)}
            style={{ marginTop: 8 }}
          />
          {attachmentFile && <p className="meta" style={{ marginTop: 6 }}>Selected: {attachmentFile.name}</p>}
        </div>

        <div className="card">
          <h2>Reviewers, in order</h2>
          {reviewers.map((r, i) => (
            <div className="row" key={i} style={{ marginBottom: 12 }}>
              <div>
                <label>Reviewer {i + 1} name</label>
                <input name="reviewerName" value={r.name} onChange={(e) => updateReviewer(i, "name", e.target.value)} required />
              </div>
              <div>
                <label>Reviewer {i + 1} email</label>
                <input name="reviewerEmail" type="email" value={r.email} onChange={(e) => updateReviewer(i, "email", e.target.value)} required />
                {reviewers.length > 1 && (
                  <button type="button" className="btn-danger" onClick={() => removeReviewer(i)}>Remove</button>
                )}
              </div>
            </div>
          ))}
          <button type="button" onClick={addReviewer}>Add reviewer</button>
        </div>

        <button type="submit" className="btn-primary">Submit and notify reviewer 1</button>
      </form>
    </main>
  );
}
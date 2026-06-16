"use client";

import { useState } from "react";
import { createRequisition } from "./actions";

interface Reviewer {
  name: string;
  email: string;
}

export default function NewRequisitionPage() {
  const [vacancyReason, setVacancyReason] = useState("resignation");
  const [designation, setDesignation] = useState("");
  const [predecessorName, setPredecessorName] = useState("");
  const [predecessorEpf, setPredecessorEpf] = useState("");
  const [predecessorDesignation, setPredecessorDesignation] = useState("");
  const [predecessorLastDay, setPredecessorLastDay] = useState("");
  const [company, setCompany] = useState("Ceylon Biscuits Limited");
  const [currentHeadcount, setCurrentHeadcount] = useState("");
  const [grade, setGrade] = useState("");
  const [immediateSupervisor, setImmediateSupervisor] = useState("");
  const [hod, setHod] = useState("");
  const [division, setDivision] = useState("");
  const [subDivision, setSubDivision] = useState("");
  const [location, setLocation] = useState("");
  const [employmentType, setEmploymentType] = useState("Permanent");
  const [taLead, setTaLead] = useState("");
  const [gmHr, setGmHr] = useState("");
  const [justification, setJustification] = useState("");
  const [tasks, setTasks] = useState("");
  const [mustHave, setMustHave] = useState("");
  const [approvedBudget, setApprovedBudget] = useState("");
  const [showJd, setShowJd] = useState(false);
  const [jdText, setJdText] = useState("");
  const [advertText, setAdvertText] = useState("");
  const [generating, setGenerating] = useState(false);
  const [reviewers, setReviewers] = useState<Reviewer[]>([
    { name: "", email: "" },
    { name: "", email: "" },
    { name: "", email: "" },
    { name: "", email: "" },
    { name: "", email: "" },
    { name: "", email: "" },
  ]);

  async function generateJD() {
    if (!designation || !justification || !tasks || !mustHave) {
      alert("Fill in designation, justification, tasks and must-have before generating.");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/generate-jd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role_title: designation,
          reason: justification,
          tasks: tasks,
          must_have: mustHave,
          salary: approvedBudget || "",
          company: company || "Ceylon Biscuits Limited",
          company_description: "CBL Group is a leading FMCG conglomerate in Sri Lanka.",
        }),
      });
      const data = await res.json();
      if (data.final_jd) {
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
          <h2>Job details</h2>
          <div className="row">
            <div>
              <label>Vacancy arising due to *</label>
              <select
                name="vacancyReason"
                value={vacancyReason}
                onChange={(e) => setVacancyReason(e.target.value)}
              >
                <option value="resignation">Resignation</option>
                <option value="new_position">Budgeted new position</option>
              </select>
            </div>
            <div>
              <label>Designation *</label>
              <input
                name="designation"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                required
              />
            </div>
          </div>
          {vacancyReason === "resignation" && (
            <div className="row" style={{ marginBottom: 12 }}>
              <div>
                <label>Predecessor name</label>
                <input name="predecessorName" value={predecessorName} onChange={(e) => setPredecessorName(e.target.value)} />
              </div>
              <div>
                <label>Predecessor EPF no.</label>
                <input name="predecessorEpf" value={predecessorEpf} onChange={(e) => setPredecessorEpf(e.target.value)} />
              </div>
              <div>
                <label>Predecessor designation</label>
                <input name="predecessorDesignation" value={predecessorDesignation} onChange={(e) => setPredecessorDesignation(e.target.value)} />
              </div>
              <div>
                <label>Predecessor last working day</label>
                <input name="predecessorLastDay" type="date" value={predecessorLastDay} onChange={(e) => setPredecessorLastDay(e.target.value)} />
              </div>
            </div>
          )}
          <div className="row">
            <div>
              <label>Approved budget</label>
              <input name="approvedBudget" value={approvedBudget} onChange={(e) => setApprovedBudget(e.target.value)} />
            </div>
            <div></div>
          </div>
          <div className="field full">
            <label>Justification (why this role opened) *</label>
            <textarea name="justification" rows={2} value={justification} onChange={(e) => setJustification(e.target.value)} required />
          </div>
          <div className="field full">
            <label>Tasks &mdash; numbered list, 3 to 5 items *</label>
            <textarea name="tasks" rows={3} value={tasks} onChange={(e) => setTasks(e.target.value)} required />
          </div>
          <div className="field full">
            <label>Must-have requirements &mdash; numbered list, 3 to 5 items *</label>
            <textarea name="mustHave" rows={3} value={mustHave} onChange={(e) => setMustHave(e.target.value)} required />
          </div>
          <div className="toggle-row">
            <label><input type="checkbox" name="screeningFmcg" defaultChecked /> FMCG experience required</label>
            <label><input type="checkbox" name="screeningEducation" defaultChecked /> Education qualification required</label>
          </div>
        </div>

        <div className="card">
          <h2>Organisation details</h2>
          <div className="row">
            <div>
              <label>Company for the recruitment</label>
              <input name="company" value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>
            <div>
              <label>Current head count</label>
              <input name="currentHeadcount" value={currentHeadcount} onChange={(e) => setCurrentHeadcount(e.target.value)} />
            </div>
          </div>
          <div className="row">
            <div>
              <label>Grade for the recruitment</label>
              <input name="grade" value={grade} onChange={(e) => setGrade(e.target.value)} />
            </div>
            <div>
              <label>Type of employment</label>
              <input name="employmentType" value={employmentType} onChange={(e) => setEmploymentType(e.target.value)} />
            </div>
          </div>
          <div className="row">
            <div>
              <label>Division 1</label>
              <input name="division" value={division} onChange={(e) => setDivision(e.target.value)} />
            </div>
            <div>
              <label>Sub division</label>
              <input name="subDivision" value={subDivision} onChange={(e) => setSubDivision(e.target.value)} />
            </div>
          </div>
          <div className="row">
            <div>
              <label>Location</label>
              <input name="location" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
            <div></div>
          </div>
          <div className="row">
            <div>
              <label>Immediate supervisor</label>
              <input name="immediateSupervisor" value={immediateSupervisor} onChange={(e) => setImmediateSupervisor(e.target.value)} />
            </div>
            <div>
              <label>HOD</label>
              <input name="hod" value={hod} onChange={(e) => setHod(e.target.value)} />
            </div>
          </div>
          <div className="row">
            <div>
              <label>TA lead</label>
              <input name="taLead" value={taLead} onChange={(e) => setTaLead(e.target.value)} />
            </div>
            <div>
              <label>GM HR</label>
              <input name="gmHr" value={gmHr} onChange={(e) => setGmHr(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="card">
          <h2>Job description (optional at this step)</h2>
          {!showJd ? (
            <button type="button" onClick={() => setShowJd(true)}>Add job description now</button>
          ) : (
            <>
              <button type="button" className="btn-primary" onClick={generateJD} disabled={generating}>
                {generating ? "Generating... (20-30 sec)" : "Generate AI JD →"}
              </button>
              <p className="muted">Calls the JD generator backend directly with the job details above.</p>
              <div className="field full">
                <label>JD text</label>
                <textarea name="jdText" rows={8} value={jdText} onChange={(e) => setJdText(e.target.value)} />
              </div>
              <div className="field full">
                <label>Advert text</label>
                <textarea name="advertText" rows={4} value={advertText} onChange={(e) => setAdvertText(e.target.value)} />
              </div>
            </>
          )}
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
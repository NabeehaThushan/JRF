"use client";

import { useState } from "react";
import { submitReview } from "@/app/review/[token]/actions";
import ReviewSuccessDialog from "./ReviewSuccessDialog";

type SectionDecision = "approved" | "rejected" | null;

interface Sections {
  jd: SectionDecision;
  advert: SectionDecision;
  knockout: SectionDecision;
  screening: SectionDecision;
}

function SectionReview({
  label,
  value,
  onChange,
}: {
  label: string;
  value: SectionDecision;
  onChange: (v: SectionDecision) => void;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "10px 14px", border: "1px solid #e6e6e6", borderRadius: 8, marginBottom: 8,
      background: value === "approved" ? "#f0fdf4" : value === "rejected" ? "#fef2f2" : "#fff",
    }}>
      <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          onClick={() => onChange(value === "approved" ? null : "approved")}
          style={{
            width: 32, height: 32, borderRadius: "50%", border: "2px solid",
            borderColor: value === "approved" ? "#16a34a" : "#e0e0e0",
            background: value === "approved" ? "#16a34a" : "#fff",
            color: value === "approved" ? "#fff" : "#aaa",
            fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >✓</button>
        <button
          type="button"
          onClick={() => onChange(value === "rejected" ? null : "rejected")}
          style={{
            width: 32, height: 32, borderRadius: "50%", border: "2px solid",
            borderColor: value === "rejected" ? "#dc2626" : "#e0e0e0",
            background: value === "rejected" ? "#dc2626" : "#fff",
            color: value === "rejected" ? "#fff" : "#aaa",
            fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >✕</button>
      </div>
    </div>
  );
}

export default function ReviewActionForm({ token }: { token: string }) {
  const [sections, setSections] = useState<Sections>({ jd: null, advert: null, knockout: null, screening: null });
  const [comment, setComment] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState<"approved" | "rejected" | "needs_clarification" | null>(null);

  const allMarked = Object.values(sections).every((v) => v !== null);
  const anyRejected = Object.values(sections).some((v) => v === "rejected");

  function setSection(key: keyof Sections, value: SectionDecision) {
    setSections((prev) => ({ ...prev, [key]: value }));
  }

  async function handle(decision: "approved" | "rejected" | "needs_clarification") {
    if (!allMarked) { alert("Please mark all 4 sections before submitting."); return; }
    setPending(true);
    await submitReview(token, decision, comment, sections);
    setPending(false);
    setDone(decision);
  }

  return (
    <div>
      <ReviewSuccessDialog decision={done} onClose={() => window.location.reload()} />

      <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
        Review each section — mark ✓ approved or ✕ needs work:
      </p>

      <SectionReview label="Job Description" value={sections.jd} onChange={(v) => setSection("jd", v)} />
      <SectionReview label="Advert text" value={sections.advert} onChange={(v) => setSection("advert", v)} />
      <SectionReview label="Knockout filter questions" value={sections.knockout} onChange={(v) => setSection("knockout", v)} />
      <SectionReview label="Pre-screening questions" value={sections.screening} onChange={(v) => setSection("screening", v)} />

      {allMarked && (
        <div style={{ marginTop: 16 }}>
          <label style={{ fontWeight: 600, fontSize: 13 }}>
            Comment {anyRejected ? "(required — some sections need work)" : "(optional)"}
          </label>
          <textarea
            placeholder="Add your notes here..."
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            style={{ marginBottom: 12 }}
          />
          <div className="actions" style={{ display: "flex", gap: 8 }}>
            <button
              className="btn-primary"
              disabled={pending}
              onClick={() => {
                if (anyRejected && !comment.trim()) { alert("Please add a comment explaining what needs work."); return; }
                handle("approved");
              }}
            >
              ✓ Approve
            </button>
            <button
              className="btn-warn"
              disabled={pending}
              onClick={() => {
                if (!comment.trim()) { alert("Please add a comment before requesting clarification."); return; }
                handle("needs_clarification");
              }}
            >
              ? Needs clarification
            </button>
            <button
              className="btn-danger"
              disabled={pending}
              onClick={() => {
                if (!comment.trim()) { alert("Please add a comment before rejecting."); return; }
                handle("rejected");
              }}
            >
              ✕ Reject
            </button>
          </div>
        </div>
      )}

      {!allMarked && (
        <p className="muted" style={{ marginTop: 12, fontSize: 12 }}>
          Mark all 4 sections above to unlock the approve/reject buttons.
        </p>
      )}
    </div>
  );
}
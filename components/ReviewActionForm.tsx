"use client";

import { useState, useEffect } from "react";
import { submitReview } from "@/lib/reviewActions";

type SectionDecision = "approved" | "rejected" | null;

function SectionBlock({
  label,
  content,
  decision,
  onChange,
  locked,
}: {
  label: string;
  content: string;
  decision: SectionDecision;
  onChange: (v: SectionDecision) => void;
  locked: boolean;
}) {
  return (
    <div style={{
      border: `1px solid ${decision === "approved" ? "#bfe8cd" : decision === "rejected" ? "#f3c2c2" : "#e0e0e0"}`,
      borderRadius: 8,
      marginBottom: 12,
      overflow: "hidden",
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 14px",
        background: decision === "approved" ? "#e3f8e9" : decision === "rejected" ? "#fdeaea" : "#f9f9f9",
        borderBottom: `1px solid ${decision === "approved" ? "#bfe8cd" : decision === "rejected" ? "#f3c2c2" : "#e0e0e0"}`,
      }}>
        <strong style={{ fontSize: 13 }}>{label}</strong>
        {!locked && (
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => onChange(decision === "approved" ? null : "approved")}
              style={{
                width: 32, height: 32, borderRadius: "50%", border: "2px solid",
                borderColor: decision === "approved" ? "#16a34a" : "#e0e0e0",
                background: decision === "approved" ? "#16a34a" : "#fff",
                color: decision === "approved" ? "#fff" : "#aaa",
                fontSize: 16, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >✓</button>
            <button
              type="button"
              onClick={() => onChange(decision === "rejected" ? null : "rejected")}
              style={{
                width: 32, height: 32, borderRadius: "50%", border: "2px solid",
                borderColor: decision === "rejected" ? "#dc2626" : "#e0e0e0",
                background: decision === "rejected" ? "#dc2626" : "#fff",
                color: decision === "rejected" ? "#fff" : "#aaa",
                fontSize: 16, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >✕</button>
          </div>
        )}
        {locked && (
          <span style={{
            fontSize: 12, fontWeight: 600,
            color: decision === "approved" ? "#137a3d" : "#a33",
          }}>
            {decision === "approved" ? "✓ Approved" : "✕ Needs work"}
          </span>
        )}
      </div>
      <div style={{
        padding: "12px 14px",
        fontSize: 13,
        color: "#374151",
        whiteSpace: "pre-wrap",
        lineHeight: 1.7,
        maxHeight: 300,
        overflowY: "auto",
        background: "white",
      }}>
        {content}
      </div>
    </div>
  );
}

export default function ReviewActionForm({
  token,
  requisition,
}: {
  token: string;
  requisition: any;
}) {
  const [sections, setSections] = useState<{
    advert: SectionDecision;
    knockout: SectionDecision;
    screening: SectionDecision;
  }>({ advert: null, knockout: null, screening: null });

  const [comment, setComment] = useState("");
  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState<"approved" | "rejected" | "needs_clarification" | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.history.state?.submitted) {
      setSubmitted(window.history.state.submitted);
      if (window.history.state.sections) setSections(window.history.state.sections);
      if (window.history.state.comment) setComment(window.history.state.comment);
    }
  }, []);

  const knockoutContent = [
    requisition?.screening_fmcg ? "• Do you have FMCG experience?" : "",
    requisition?.screening_education ? "• Do you meet the education requirements?" : "",
  ].filter(Boolean).join("\n") || "No knockout filters set.";

  const screeningContent = requisition?.final_jd_full?.parsed?.screening_questions
    || "Pre-screening questions will be generated during final JD generation.";

  const allMarked = Object.values(sections).every((v) => v !== null);
  const anyRejected = Object.values(sections).some((v) => v === "rejected");

  function set(key: keyof typeof sections, val: SectionDecision) {
    setSections((prev) => ({ ...prev, [key]: val }));
  }

  async function handle(decision: "approved" | "rejected" | "needs_clarification") {
    setPending(true);
    await submitReview(token, decision, comment, {
      advert: sections.advert,
      jd: null,
      knockout: sections.knockout,
      screening: sections.screening,
    });
    setPending(false);
    setSubmitted(decision);
    window.history.replaceState({ submitted: decision, sections, comment }, "", window.location.href);
  }

  if (submitted) {
    const config = {
      approved: { color: "#137a3d", bg: "#e3f8e9", border: "#bfe8cd", emoji: "✓", label: "Approved" },
      rejected: { color: "#a33", bg: "#fdeaea", border: "#f3c2c2", emoji: "✕", label: "Rejected" },
      needs_clarification: { color: "#8a6500", bg: "#fff4dd", border: "#f3e2b8", emoji: "?", label: "Clarification requested" },
    }[submitted];

    return (
      <div>
        <div style={{
          padding: 20, borderRadius: 10,
          background: config.bg, border: `1px solid ${config.border}`,
          marginBottom: 12,
        }}>
          <p style={{ fontWeight: 700, fontSize: 15, color: config.color, margin: "0 0 6px" }}>
            {config.emoji} {config.label}
          </p>
          <p style={{ fontSize: 13, color: "#555", margin: 0 }}>
            Your decision has been recorded.
            {submitted === "approved"
              ? " The next reviewer will be notified automatically."
              : " The TA has been notified to revise."}
          </p>
        </div>
        <div style={{ marginTop: 16 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
            Your section decisions
          </p>
          {[
            { label: "AI advert text", val: sections.advert },
            { label: "Knockout filters", val: sections.knockout },
            { label: "Pre-screening questions", val: sections.screening },
          ].map(({ label, val }) => (
            <div key={label} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "8px 12px", marginBottom: 6, borderRadius: 6,
              background: val === "approved" ? "#e3f8e9" : "#fdeaea",
              border: `1px solid ${val === "approved" ? "#bfe8cd" : "#f3c2c2"}`,
            }}>
              <span style={{ fontSize: 13 }}>{label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: val === "approved" ? "#137a3d" : "#a33" }}>
                {val === "approved" ? "✓ Approved" : "✕ Needs work"}
              </span>
            </div>
          ))}
          {comment && (
            <div style={{ marginTop: 10, padding: "10px 12px", background: "#f9f9f9", borderRadius: 6, fontSize: 13, color: "#555" }}>
              <strong>Your comment:</strong> "{comment}"
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="muted" style={{ marginBottom: 12, fontSize: 13 }}>
        Review each section and mark ✓ or ✕. All three must be marked before you can submit your decision.
      </p>

      {requisition?.advert_text && (
        <SectionBlock label="AI advert text" content={requisition.advert_text}
          decision={sections.advert} onChange={(v) => set("advert", v)} locked={false} />
      )}

      <SectionBlock label="Knockout filter questions" content={knockoutContent}
        decision={sections.knockout} onChange={(v) => set("knockout", v)} locked={false} />

      <SectionBlock label="Pre-screening questions" content={screeningContent}
        decision={sections.screening} onChange={(v) => set("screening", v)} locked={false} />

      {allMarked ? (
        <div style={{ marginTop: 16 }}>
          <label style={{ fontWeight: 600, fontSize: 13 }}>
            Comment {anyRejected ? "(required — some sections need work)" : "(optional)"}
          </label>
          {!anyRejected && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "8px 0" }}>
              {[
                "Looks good, proceed.",
                "Approved as submitted.",
                "No changes required.",
                "Please update the role profile bullets.",
                "Personal profile needs more detail.",
                "Advert text needs revision.",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setComment(suggestion)}
                  style={{
                    fontSize: 11, padding: "4px 10px", borderRadius: 20,
                    border: "1px solid #e0e0e0", background: comment === suggestion ? "#f0f0f0" : "#fff",
                    cursor: "pointer", color: "#555",
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
          <textarea
            placeholder="Add your notes here or pick a suggestion above..."
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            style={{ marginBottom: 12, marginTop: 6 }}
          />
          <div className="actions" style={{ display: "flex", gap: 8 }}>
            <button className="btn-primary" disabled={pending} onClick={() => {
              if (anyRejected && !comment.trim()) { alert("Please add a comment explaining what needs work."); return; }
              handle("approved");
            }}>✓ Approve</button>
            <button className="btn-warn" disabled={pending} onClick={() => {
              if (!comment.trim()) { alert("Please add a comment before requesting clarification."); return; }
              handle("needs_clarification");
            }}>? Needs clarification</button>
            <button className="btn-danger" disabled={pending} onClick={() => {
              if (!comment.trim()) { alert("Please add a comment before rejecting."); return; }
              handle("rejected");
            }}>✕ Reject</button>
          </div>
        </div>
      ) : (
        <p className="muted" style={{ marginTop: 12, fontSize: 12 }}>
          Mark all 3 sections above to unlock the approve / reject buttons.
        </p>
      )}
    </div>
  );
}
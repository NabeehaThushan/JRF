"use client";

export default function ReviewSuccessDialog({
  decision,
  onClose,
}: {
  decision: "approved" | "rejected" | "needs_clarification" | null;
  onClose: () => void;
}) {
  if (!decision) return null;

  const config = {
    approved: {
      emoji: "✓", title: "Approved",
      message: "Your approval has been recorded. The next reviewer will be notified.",
      color: "#137a3d", bg: "#e3f8e9", border: "#bfe8cd",
    },
    rejected: {
      emoji: "✕", title: "Rejected",
      message: "Your feedback has been sent. The TA will be notified to revise.",
      color: "#a33", bg: "#fdeaea", border: "#f3c2c2",
    },
    needs_clarification: {
      emoji: "?", title: "Clarification requested",
      message: "Your feedback has been sent. The TA will review your notes and revise.",
      color: "#8a6500", bg: "#fff4dd", border: "#f3e2b8",
    },
  }[decision];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "#fff", borderRadius: 14, padding: 32, maxWidth: 400, width: "90%", textAlign: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: config.bg, border: `2px solid ${config.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, color: config.color, margin: "0 auto 16px" }}>
          {config.emoji}
        </div>
        <h2 style={{ margin: "0 0 8px", fontSize: 18, color: "#111" }}>{config.title}</h2>
        <p style={{ color: "#666", fontSize: 14, lineHeight: 1.6, margin: "0 0 24px" }}>{config.message}</p>
        <button className="btn-primary" onClick={onClose} style={{ width: "100%", padding: "10px 0" }}>Done</button>
      </div>
    </div>
  );
}
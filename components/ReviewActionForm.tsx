"use client";

import { useState } from "react";
import { submitReview } from "@/lib/reviewActions";
import ReviewSuccessDialog from "./ReviewSuccessDialog";

export default function ReviewActionForm({ token }: { token: string }) {
  const [comment, setComment] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState<"approved" | "rejected" | "needs_clarification" | null>(null);

  async function handle(decision: "approved" | "rejected" | "needs_clarification") {
    setPending(true);
    await submitReview(token, decision, comment);
    setPending(false);
    setDone(decision);
  }

  return (
    <div>
      <ReviewSuccessDialog decision={done} onClose={() => window.location.reload()} />
      <label style={{ fontWeight: 600, fontSize: 13 }}>Comment (required for reject / clarification)</label>
      <textarea placeholder="Add your notes here..." rows={3} value={comment} onChange={(e) => setComment(e.target.value)} style={{ marginBottom: 12 }} />
      <div className="actions" style={{ display: "flex", gap: 8 }}>
        <button className="btn-primary" disabled={pending} onClick={() => handle("approved")}>✓ Approve</button>
        <button className="btn-warn" disabled={pending} onClick={() => { if (!comment.trim()) { alert("Please add a comment before requesting clarification."); return; } handle("needs_clarification"); }}>? Needs clarification</button>
        <button className="btn-danger" disabled={pending} onClick={() => { if (!comment.trim()) { alert("Please add a comment before rejecting."); return; } handle("rejected"); }}>✕ Reject</button>
      </div>
    </div>
  );
}
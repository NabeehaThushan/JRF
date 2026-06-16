"use client";

import { useState } from "react";
// @ts-ignore
import { submitRevision } from "./actions";

export default function ReviseForm({
  requisition,
  blockingStepId,
}: {
  requisition: any;
  blockingStepId: string | undefined;
}) {
  const [jdText, setJdText] = useState(requisition.jd_text || "");
  const [advertText, setAdvertText] = useState(requisition.advert_text || "");
  const [tasks, setTasks] = useState(requisition.tasks || "");
  const [mustHave, setMustHave] = useState(requisition.must_have || "");
  const [noteStatus, setNoteStatus] = useState("resolved");
  const [pending, setPending] = useState(false);

  async function handle() {
    setPending(true);
    await submitRevision(requisition.id, { jdText, advertText, tasks, mustHave }, blockingStepId, noteStatus);
    setPending(false);
  }

  return (
    <div>
      <div className="card">
        <h2>Edit job content</h2>
        <div className="field full">
          <label>Tasks</label>
          <textarea rows={4} value={tasks} onChange={(e) => setTasks(e.target.value)} />
        </div>
        <div className="field full">
          <label>Must-have requirements</label>
          <textarea rows={4} value={mustHave} onChange={(e) => setMustHave(e.target.value)} />
        </div>
        <div className="field full">
          <label>JD text</label>
          <textarea rows={6} value={jdText} onChange={(e) => setJdText(e.target.value)} />
        </div>
        <div className="field full">
          <label>Advert text</label>
          <textarea rows={4} value={advertText} onChange={(e) => setAdvertText(e.target.value)} />
        </div>
      </div>

      {blockingStepId && (
        <div className="card">
          <h2>Mark reviewer's note as</h2>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {["resolved", "not_accepted", "needs_clarification"].map((s) => (
              <label key={s} style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: noteStatus === s ? 700 : 400 }}>
                <input
                  type="radio"
                  name="noteStatus"
                  value={s}
                  checked={noteStatus === s}
                  onChange={() => setNoteStatus(s)}
                  style={{ width: "auto" }}
                />
                {s === "resolved" ? "Resolved" : s === "not_accepted" ? "Not accepted" : "Needs clarification"}
              </label>
            ))}
          </div>
        </div>
      )}

      <button className="btn-primary" disabled={pending} onClick={handle}>
        Save revision and resubmit to next reviewer
      </button>
    </div>
  );
}
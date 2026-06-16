import { ReviewStep } from "@/lib/types";
import CopyLinkButton from "./CopyLinkButton";

export default function Timeline({ steps }: { steps: ReviewStep[] }) {
  if (steps.length === 0) return <p className="muted">No reviewers assigned yet.</p>;
  return (
    <div>
      {steps.map((s) => (
        <div className="req-row" key={s.id}>
          <div className="top">
            <strong>
              Stage {s.stage_order}: {s.reviewer_name}
            </strong>
            <span
              className={`status-pill ${
                s.status === "approved"
                  ? "status-approved"
                  : s.status === "rejected"
                  ? "status-rejected"
                  : "status-pending"
              }`}
            >
              {s.status}
            </span>
          </div>
          {s.comment && <p className="meta">&ldquo;{s.comment}&rdquo;</p>}
          {s.status === "pending" && <CopyLinkButton token={s.token} />}
        </div>
      ))}
    </div>
  );
}
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

          {/* ADD THIS BELOW THE COMMENT */}
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
          {s.status === "pending" && <CopyLinkButton token={s.token} />}
        </div>
      ))}
    </div>
  );
}
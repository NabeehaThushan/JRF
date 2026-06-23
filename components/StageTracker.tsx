import { ReviewStep } from "@/lib/types";
import CopyLinkButton from "./CopyLinkButton";

function getStepState(s: ReviewStep, requisitionStatus: string) {
  if (s.status === "approved") return "approved";
  if (s.status === "rejected") return "rejected";
  if (s.status === "needs_clarification") return "clarification";
  if (requisitionStatus === "ta_revision") return "blocked";
  if (s.status === "pending") return "pending";
  return "pending";
}

function StepIcon({ state }: { state: string }) {
  if (state === "approved") return <span style={{ fontSize: 16 }}>✓</span>;
  if (state === "rejected") return <span style={{ fontSize: 16 }}>✕</span>;
  if (state === "clarification") return <span style={{ fontSize: 16 }}>?</span>;
  if (state === "blocked") return <span style={{ fontSize: 16 }}>!</span>;
  return <span style={{ fontSize: 13, color: "#aaa" }}>•</span>;
}

const stateStyles: Record<string, React.CSSProperties> = {
  approved: { background: "#e3f8e9", borderColor: "#bfe8cd", color: "#137a3d" },
  rejected: { background: "#fdeaea", borderColor: "#f3c2c2", color: "#a33" },
  clarification: { background: "#fff4dd", borderColor: "#f3e2b8", color: "#8a6500" },
  blocked: { background: "#fff4dd", borderColor: "#f3e2b8", color: "#8a6500" },
  pending: { background: "#f5f5f5", borderColor: "#e0e0e0", color: "#aaa" },
};

const connectorColor: Record<string, string> = {
  approved: "#bfe8cd",
  rejected: "#f3c2c2",
  clarification: "#f3e2b8",
  blocked: "#f3e2b8",
  pending: "#e0e0e0",
};

export default function StageTracker({
  steps,
  requisitionStatus = "in_review",
  showCopyLink = true,
}: {
  steps: ReviewStep[];
  requisitionStatus?: string;
  showCopyLink?: boolean;
}) {
  if (steps.length === 0) return null;

  return (
    <div>
      <div className="stage-tracker-vertical">
        {steps.map((s, i) => {
          const state = getStepState(s, requisitionStatus);
          const style = stateStyles[state];
          const isLast = i === steps.length - 1;
          return (
            <div key={s.id} style={{ display: "flex", gap: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  border: `2px solid ${style.borderColor}`,
                  background: style.background,
                  color: style.color,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 700, flexShrink: 0,
                }}>
                  <StepIcon state={state} />
                </div>
                {!isLast && (
                  <div style={{
                    width: 2, flexGrow: 1, minHeight: 24,
                    background: connectorColor[state],
                    margin: "4px 0",
                  }} />
                )}
              </div>
              <div style={{ paddingBottom: isLast ? 0 : 16, paddingTop: 6 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>
                  Stage {s.stage_order}: {s.reviewer_name}
                </div>
                <div style={{ fontSize: 12, color: "#888", marginTop: 2, textTransform: "capitalize" }}>
                  {state === "clarification" ? "Needs clarification" : state === "blocked" ? "Waiting — TA revising" : s.status}
                </div>
                {s.comment && (
                  <div style={{
                    marginTop: 6, fontSize: 12, color: "#555",
                    background: "#f7f7f7", borderRadius: 6,
                    padding: "6px 10px", maxWidth: 360,
                  }}>
                    "{s.comment}"
                  </div>
                )}
                {(s.section_advert || s.section_jd || s.section_knockout || s.section_screening) && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                    {[
                      { label: "Advert", val: s.section_advert },
                      { label: "JD", val: s.section_jd },
                      { label: "Knockout", val: s.section_knockout },
                      { label: "Screening", val: s.section_screening },
                    ].map(({ label, val }) => val ? (
                      <span key={label} style={{
                        fontSize: 11, padding: "2px 8px", borderRadius: 20, fontWeight: 600,
                        background: val === "approved" ? "#e3f8e9" : "#fdeaea",
                        color: val === "approved" ? "#137a3d" : "#a33",
                        border: `1px solid ${val === "approved" ? "#bfe8cd" : "#f3c2c2"}`,
                      }}>
                        {val === "approved" ? "✓" : "✕"} {label}
                      </span>
                    ) : null)}
                  </div>
                )}
                {s.acted_at && (
                  <div style={{ fontSize: 11, color: "#bbb", marginTop: 4 }}>
                    {new Date(s.acted_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                )}
                {state === "pending" && showCopyLink && (
                  <div style={{ marginTop: 6 }}>
                    <CopyLinkButton token={s.token} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
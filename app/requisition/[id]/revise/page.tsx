import { supabaseServer } from "@/lib/supabaseServer";
import ReviseForm from "./ReviseForm";
import StageTracker from "@/components/StageTracker";
import Timeline from "@/components/Timeline";
export const dynamic = "force-dynamic";

export default async function RevisePage({ params }: { params: { id: string } }) {
  const supabase = supabaseServer();

  const { data: req } = await supabase.from("requisitions").select("*").eq("id", params.id).single();
  const { data: steps } = await supabase
    .from("review_steps")
    .select("*")
    .eq("requisition_id", params.id)
    .order("stage_order");

  if (!req) return <main className="container"><p>Requisition not found.</p></main>;

  // Find the step that triggered this revision
  const blockingStep = (steps || []).find(
    (s: any) => s.status === "rejected" || s.status === "needs_clarification"
  );

  return (
    <main className="container">
      <h1>Revise: {req.designation}</h1>

      {blockingStep && (
        <div className="card" style={{ borderLeft: "4px solid #f5a623" }}>
          <h2>Feedback from {blockingStep.reviewer_name}</h2>
          <p className="meta">
            <strong>Decision:</strong>{" "}
            {blockingStep.status === "needs_clarification" ? "Needs clarification" : "Rejected"}
          </p>
          {blockingStep.comment && <p className="meta">"{blockingStep.comment}"</p>}
        </div>
      )}

      <div className="card">
        <h2>Approval progress</h2>
        <StageTracker steps={steps || []} />
        <Timeline steps={steps || []} />
      </div>

      <ReviseForm requisition={req} blockingStepId={blockingStep?.id} />
    </main>
  );
}
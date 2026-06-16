import { supabaseServer } from "@/lib/supabaseServer";
import FinalApproveForm from "./FinalApproveForm";
import StageTracker from "@/components/StageTracker";
export const dynamic = "force-dynamic";


export default async function FinalApprovePage({ params }: { params: { id: string } }) {
  const supabase = supabaseServer();
  const { data: req } = await supabase.from("requisitions").select("*").eq("id", params.id).single();
  const { data: steps } = await supabase
    .from("review_steps").select("*").eq("requisition_id", params.id).order("stage_order");

  if (!req) return <main className="container"><p>Not found.</p></main>;

  if (req.status !== "final_ta_review") {
    return (
      <main className="container">
        <div className="card">
          <p className="muted">
            {req.status === "ready_to_publish"
              ? "Already published."
              : "Not ready for final approval yet."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="container">
      <h1>Final approval: {req.designation}</h1>
      <div className="card">
        <h2>All stages complete</h2>
        <StageTracker steps={steps || []} requisitionStatus={req.status} />
      </div>
      <FinalApproveForm
        requisitionId={req.id}
        requisition={req}
        steps={steps || []}
      />
    </main>
  );
}
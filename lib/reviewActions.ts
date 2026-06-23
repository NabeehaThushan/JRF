"use server";

import { supabaseServer } from "@/lib/supabaseServer";
import { sendReviewEmail, sendTaRevisionEmail, sendFinalApprovalEmail } from "@/lib/resend";
import { revalidatePath } from "next/cache";

export async function submitReview(
  token: string,
  decision: "approved" | "rejected" | "needs_clarification",
  comment: string,
  sections?: {
    jd: "approved" | "rejected" | null;
    advert: "approved" | "rejected" | null;
    knockout: "approved" | "rejected" | null;
    screening: "approved" | "rejected" | null;
  }
) {
  const supabase = supabaseServer();

  const { data: step, error } = await supabase
    .from("review_steps")
    .update({
      status: decision,
      comment,
      acted_at: new Date().toISOString(),
      section_jd: sections?.jd || null,
      section_advert: sections?.advert || null,
      section_knockout: sections?.knockout || null,
      section_screening: sections?.screening || null,
    })
    .eq("token", token)
    .select()
    .single();

  if (error || !step) throw new Error("Failed to update step: " + error?.message);

  const { data: req } = await supabase
    .from("requisitions")
    .select("*")
    .eq("id", step.requisition_id)
    .single();

  if (!req) throw new Error("Requisition not found");

  const { data: allSteps } = await supabase
    .from("review_steps")
    .select("*")
    .eq("requisition_id", req.id)
    .order("stage_order");

  if (!allSteps) throw new Error("Steps not found");

  if (decision === "rejected" || decision === "needs_clarification") {
    await supabase
      .from("requisitions")
      .update({ status: "ta_revision", updated_at: new Date().toISOString() })
      .eq("id", req.id);

    if (req.ta_email) {
      await sendTaRevisionEmail(
        req.ta_email,
        req.ta_name || "TA",
        req.designation,
        req.id,
        step.reviewer_name,
        comment,
        decision === "needs_clarification" ? "Needs clarification" : "Rejected"
      );
    }
    revalidatePath(`/requisition/${req.id}`);
    return;
  }

  const nextStep = allSteps.find((s: any) => s.stage_order === step.stage_order + 1);

  if (nextStep) {
    await sendReviewEmail(nextStep.reviewer_email, nextStep.reviewer_name, req.designation, nextStep.token);
    await supabase
      .from("requisitions")
      .update({ status: "in_review", updated_at: new Date().toISOString() })
      .eq("id", req.id);
  } else {
    await supabase
      .from("requisitions")
      .update({ status: "final_ta_review", updated_at: new Date().toISOString() })
      .eq("id", req.id);
    if (req.ta_email) {
      await sendFinalApprovalEmail(req.ta_email, req.ta_name || "TA", req.designation, req.id);
    }
  }

  revalidatePath(`/requisition/${req.id}`);
}
"use server";

import { supabaseServer } from "@/lib/supabaseServer";
import { sendReviewEmail } from "@/lib/resend";
import { redirect } from "next/navigation";

export async function submitRevision(
  requisitionId: string,
  edits: { jdText: string; advertText: string; tasks: string; mustHave: string },
  blockingStepId: string | undefined,
  noteStatus: string
) {
  const supabase = supabaseServer();

  // 1. Save the edits
  await supabase
  .from("requisitions")
  .update({
    jd_text: edits.jdText,
    advert_text: edits.advertText,
    tasks: edits.tasks,
    must_have: edits.mustHave,
    status: "in_review",
    updated_at: new Date().toISOString(),
  })
  .eq("id", requisitionId);

  // 2. Mark the blocking step's note status and reset it to pending
  if (blockingStepId) {
    await supabase
      .from("review_steps")
      .update({ note_status: noteStatus, status: "pending", comment: null, acted_at: null })
      .eq("id", blockingStepId);
  }

  // 3. Find the next pending step
  const { data: steps } = await supabase
    .from("review_steps")
    .select("*")
    .eq("requisition_id", requisitionId)
    .order("stage_order");

  const { data: req } = await supabase
    .from("requisitions")
    .select("designation")
    .eq("id", requisitionId)
    .single();

  const nextStep = (steps || []).find((s: any) => s.status === "pending");

  if (nextStep && req) {
    await sendReviewEmail(nextStep.reviewer_email, nextStep.reviewer_name, req.designation, nextStep.token);
  }

  redirect(`/requisition/${requisitionId}`);
}
"use server";

import { supabaseServer } from "@/lib/supabaseServer";
import { sendReviewEmail } from "@/lib/resend";
import { redirect } from "next/navigation";

export async function createRequisition(formData: FormData) {
  const supabase = supabaseServer();

  const taName = formData.get("taName") as string;
  const taEmail = formData.get("taEmail") as string;
  const vacancyReason = formData.get("vacancyReason") as string;
  const designation = formData.get("designation") as string;
  const rrfNumber = formData.get("rrfNumber") as string;
  const predecessorName = formData.get("predecessorName") as string;
  const predecessorEpf = formData.get("predecessorEpf") as string;
  const predecessorDesignation = formData.get("predecessorDesignation") as string;
  const predecessorLastDay = formData.get("predecessorLastDay") as string;
  const company = formData.get("company") as string;
  const currentHeadcount = formData.get("currentHeadcount") as string;
  const grade = formData.get("grade") as string;
  const immediateSupervisor = formData.get("immediateSupervisor") as string;
  const hod = formData.get("hod") as string;
  const division = formData.get("division") as string;
  const subDivision = formData.get("subDivision") as string;
  const location = formData.get("location") as string;
  const employmentType = formData.get("employmentType") as string;
  const taLead = formData.get("taLead") as string;
  const gmHr = formData.get("gmHr") as string;
  const justification = formData.get("justification") as string;
  const tasks = formData.get("tasks") as string;
  const mustHave = formData.get("mustHave") as string;
  const approvedBudget = formData.get("approvedBudget") as string;
  const jdText = formData.get("jdText") as string;
  const advertText = formData.get("advertText") as string;
  const screeningFmcg = formData.get("screeningFmcg") === "on";
  const screeningEducation = formData.get("screeningEducation") === "on";
  const reviewerNames = formData.getAll("reviewerName") as string[];
  const reviewerEmails = formData.getAll("reviewerEmail") as string[];

  let attachmentUrl: string | null = null;
  const attachmentFile = formData.get("attachment") as File | null;
  if (attachmentFile && attachmentFile.size > 0) {
    const ext = attachmentFile.name.split(".").pop();
    const path = `requisitions/${Date.now()}.${ext}`;
    const bytes = await attachmentFile.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from("attachments")
      .upload(path, bytes, { contentType: attachmentFile.type });
    if (uploadError) {
      console.error("Attachment upload failed:", uploadError);
    } else {
      const { data: urlData } = supabase.storage.from("attachments").getPublicUrl(path);
      attachmentUrl = urlData.publicUrl;
    }
  }

  const { data: req, error } = await supabase
    .from("requisitions")
    .insert({
      ta_name: taName,
      ta_email: taEmail,
      vacancy_reason: vacancyReason,
      designation,
      rrf_number: rrfNumber,
      predecessor_name: vacancyReason === "resignation" ? predecessorName : null,
      predecessor_epf: vacancyReason === "resignation" ? predecessorEpf : null,
      predecessor_designation: vacancyReason === "resignation" ? predecessorDesignation : null,
      predecessor_last_day: vacancyReason === "resignation" && predecessorLastDay ? predecessorLastDay : null,
      company,
      current_headcount: currentHeadcount,
      grade,
      immediate_supervisor: immediateSupervisor,
      hod,
      division,
      sub_division: subDivision,
      location,
      employment_type: employmentType,
      ta_lead: taLead,
      gm_hr: gmHr,
      justification,
      tasks: (formData.get("tasks") as string) || "",
      must_have: (formData.get("mustHave") as string) || "",
      approved_budget: approvedBudget,
      jd_text: jdText,
      advert_text: advertText,
      attachment_url: attachmentUrl,
      screening_fmcg: screeningFmcg,
      screening_education: screeningEducation,
      status: "in_review",
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error || !req) throw new Error("Failed to create requisition: " + error?.message);

  const steps = reviewerNames.map((name, i) => ({
    requisition_id: req.id,
    stage_order: i + 1,
    reviewer_name: name,
    reviewer_email: reviewerEmails[i],
    status: "pending" as const,
  }));

  const { data: insertedSteps, error: stepsError } = await supabase
    .from("review_steps")
    .insert(steps)
    .select();

  if (stepsError || !insertedSteps) throw new Error("Failed to create review steps: " + stepsError?.message);

  const firstStep = insertedSteps.find((s: any) => s.stage_order === 1);
  if (firstStep) {
    await sendReviewEmail(firstStep.reviewer_email, firstStep.reviewer_name, designation, firstStep.token);
  }

  redirect(`/requisition/${req.id}`);
}
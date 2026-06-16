"use server";

import { supabaseServer } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";

export async function finalApprove(
  requisitionId: string,
  jdText: string,
  advertText: string
) {
  const supabase = supabaseServer();
  await supabase
  .from("requisitions")
  .update({
    status: "ready_to_publish",
    jd_text: jdText,
    advert_text: advertText,
    updated_at: new Date().toISOString(),
  })
  .eq("id", requisitionId);
  redirect(`/requisition/${requisitionId}`);
}
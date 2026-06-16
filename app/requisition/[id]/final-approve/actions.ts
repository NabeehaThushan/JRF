"use server";

import { supabaseServer } from "@/lib/supabaseServer";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function finalApprove(
  requisitionId: string,
  jdText: string,
  advertText: string,
  fullResult: any
) {
  const supabase = supabaseServer();
  await supabase
    .from("requisitions")
    .update({
      status: "ready_to_publish",
      jd_text: jdText,
      advert_text: advertText,
      final_jd_full: fullResult,
      updated_at: new Date().toISOString(),
    })
    .eq("id", requisitionId);

  revalidatePath(`/requisition/${requisitionId}`);
  redirect(`/requisition/${requisitionId}`);
}
"use server";

import { supabaseServer } from "@/lib/supabaseServer";
import { revalidatePath } from "next/cache";

export async function deleteRequisition(id: string) {
  const supabase = supabaseServer();
  await supabase.from("requisitions").delete().eq("id", id);
  revalidatePath("/");
}
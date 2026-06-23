"use server";

import { supabaseServer } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";

export async function deleteRequisition(id: string) {
  const supabase = supabaseServer();
  await supabase.from("requisitions").delete().eq("id", id);
  redirect("/");
}
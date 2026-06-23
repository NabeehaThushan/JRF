"use client";

import { useState } from "react";
import { deleteRequisition } from "@/lib/requisitionActions";

export default function DeleteRequisitionButton({
  id,
  redirectAfter = false,
}: {
  id: string;
  redirectAfter?: boolean;
}) {
  const [pending, setPending] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this requisition permanently?")) return;
    setPending(true);
    await deleteRequisition(id);
    if (redirectAfter) window.location.href = "/";
    else window.location.reload();
  }

  return (
    <button type="button" className="btn-danger" disabled={pending} onClick={handleDelete}>
      {pending ? "Deleting..." : "Delete"}
    </button>
  );
}
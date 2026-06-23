export type ReviewStatus = "pending" | "approved" | "rejected" | "needs_clarification";
export type NoteStatus = "resolved" | "not_accepted" | "needs_clarification";
export type RequisitionStatus = "in_review" | "ta_revision" | "final_ta_review" | "ready_to_publish";

export interface ReviewStep {
  id: string;
  requisition_id: string;
  stage_order: number;
  reviewer_name: string;
  reviewer_email: string;
  token: string;
  status: ReviewStatus;
  comment: string | null;
  note_status: NoteStatus | null;
  acted_at: string | null;
  section_jd: string | null;
  section_advert: string | null;
  section_knockout: string | null;
  section_screening: string | null;
}

export interface Requisition {
  id: string;
  vacancy_reason: "resignation" | "new_position";
  designation: string;
  updated_at: string;
  rrf_number: string | null;
  predecessor_name: string | null;
  predecessor_epf: string | null;
  predecessor_last_day: string | null;
  ta_name: string | null;
  ta_email: string | null;
  justification: string;
  tasks: string;
  must_have: string;
  approved_budget: string | null;
  jd_text: string | null;
  advert_text: string | null;
  screening_fmcg: boolean;
  screening_education: boolean;
  status: RequisitionStatus;
  created_at: string;
}
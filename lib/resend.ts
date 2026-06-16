import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || "onboarding@resend.dev";
const APP = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function sendReviewEmail(
  to: string,
  reviewerName: string,
  designation: string,
  token: string
) {
  const link = `${APP}/review/${token}`;
  const result = await resend.emails.send({
    from: FROM,
    to,
    subject: `Action needed: review requisition for ${designation}`,
    html: `<p>Hi ${reviewerName},</p>
           <p>A job requisition for <strong>${designation}</strong> needs your review.</p>
           <p><a href="${link}">Click here to review</a></p>`,
  });
  if (result.error) {
  console.error("Email send failed:", result.error);
  return; // don't throw, just skip
}
  return result;
}

export async function sendTaRevisionEmail(
  to: string,
  taName: string,
  designation: string,
  requisitionId: string,
  reviewerName: string,
  comment: string,
  decision: string
) {
  const link = `${APP}/requisition/${requisitionId}/revise`;
  const result = await resend.emails.send({
    from: FROM,
    to,
    subject: `Action needed: ${decision} on requisition for ${designation}`,
    html: `<p>Hi ${taName},</p>
           <p><strong>${reviewerName}</strong> has left feedback on the requisition for <strong>${designation}</strong>.</p>
           <p>Decision: <strong>${decision}</strong></p>
           ${comment ? `<p>Comment: "${comment}"</p>` : ""}
           <p><a href="${link}">Click here to revise and resubmit</a></p>`,
  });
  if (result.error) {
  console.error("Email send failed:", result.error);
  return; // don't throw, just skip
}
  return result;
}

export async function sendFinalApprovalEmail(
  to: string,
  taName: string,
  designation: string,
  requisitionId: string
) {
  const link = `${APP}/requisition/${requisitionId}/final-approve`;
  const result = await resend.emails.send({
    from: FROM,
    to,
    subject: `Final approval needed: ${designation}`,
    html: `<p>Hi ${taName},</p>
           <p>All reviewers have approved the requisition for <strong>${designation}</strong>.</p>
           <p><a href="${link}">Click here to do your final review and publish</a></p>`,
  });
  if (result.error) console.error("Email send failed:", result.error); // don't throw, just log
  return result;
}
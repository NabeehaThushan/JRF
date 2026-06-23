import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "";
  const backendBase = "https://vezpr-jd-gen-production.up.railway.app";

  let body: any = {};
  let docText = "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const file = formData.get("document") as File | null;

    if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await mammoth.extractRawText({ buffer });
      docText = result.value.trim();
    }

    for (const [key, value] of formData.entries()) {
      if (key !== "document") body[key] = value;
    }
  } else {
    body = await req.json();
  }

  if (docText) {
    body.company_description = `Use the following document as the base template for the job description. Keep the company introduction paragraph exactly as written. Only update the designation, location, role profile and personal profile sections based on the job details provided.\n\n---\n${docText}`;
  }

  // Step 1 — generate main JD
  const res = await fetch(`${backendBase}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Railway JD error:", text);
    return NextResponse.json({ error: text }, { status: 500 });
  }

  const data = await res.json();

  // Step 2 — generate short public advert separately
  const advertPrompt = docText
    ? `Using this company template, write a short public job advert. Keep the company introduction paragraph exactly as written in the template. Update only the designation, location, role profile bullets and personal profile bullets based on the job details. Max 200 words total. No first 90 days section, no screening questions, no internal details, no salary.\n\n---\n${docText}`
    : `Write a short public job advert for ${body.role_title} at Ceylon Biscuits Limited in this exact format:

JOIN A TEAM DRIVEN BY EXCELLENCE
[2-3 sentence company intro about CBL Group being Sri Lanka's largest food conglomerate]

DESIGNATION: ${body.role_title}
COMPANY NAME: CEYLON BISCUITS LIMITED
LOCATION: ${body.location || "Pannipitiya"}

ROLE PROFILE
[3-4 bullet points of key responsibilities based on: ${body.tasks}]

PERSONAL PROFILE
[3-4 bullet points of requirements based on: ${body.must_have}]

Click here to apply now!
Apply within 7 days of this advert being published.

Keep it under 200 words. No first 90 days, no screening questions, no internal details.`;

  const advertRes = await fetch(`${backendBase}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      role_title: body.role_title,
      reason: body.reason || "Replacement hire",
      tasks: body.tasks,
      must_have: body.must_have,
      company: body.company || "Ceylon Biscuits Limited",
      company_description: advertPrompt,
    }),
  });

  let advertText = "";
  if (advertRes.ok) {
    const advertData = await advertRes.json();
    advertText = advertData.final_jd || "";
  }

  return NextResponse.json({
    ...data,
    advert_text: advertText,
  });
}
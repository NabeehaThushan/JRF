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

  // From form fields
  const roleTitle = body.role_title || "";
  const location = body.location || "";
  const company = body.company || "Ceylon Biscuits Limited";
  const reason = body.reason || "";

  // Extract role profile and personal profile sections from the doc
  let roleProfileSection = "";
  let personalProfileSection = "";

  if (docText) {
    const upper = docText.toUpperCase();
    const roleIdx = upper.indexOf("ROLE PROFILE");
    const personalIdx = upper.indexOf("PERSONAL PROFILE");
    const clickIdx = upper.indexOf("CLICK HERE");

    if (roleIdx > -1 && personalIdx > -1) {
      roleProfileSection = docText.substring(roleIdx + "ROLE PROFILE".length, personalIdx).trim();
      const endIdx = clickIdx > -1 ? clickIdx : docText.length;
      personalProfileSection = docText.substring(personalIdx + "PERSONAL PROFILE".length, endIdx).trim();
    }
  }

  // Build advert prompt from extracted doc sections
  const advertPrompt = docText
    ? `You are writing a concise job advertisement. Output ONLY the following structure. Nothing before, nothing after. No company introduction. No click here to apply. No closing lines. No extra headings.

DESIGNATION: ${roleTitle.toUpperCase()}
COMPANY NAME: ${company.toUpperCase()}
LOCATION: ${location.toUpperCase()}

ROLE PROFILE
Summarise the following into EXACTLY 5 to 6 bullet points. You MUST use a bullet point (•) at the start of every single line. Every line must start with •. You MUST write at least 5 bullets. Keep the most important responsibilities. If the source has fewer than 5 distinct points, expand slightly but stay relevant:
${roleProfileSection}

PERSONAL PROFILE
Summarise the following into EXACTLY 5 to 6 bullet points. You MUST use a bullet point (•) at the start of every single line. Every line must start with •. You MUST write at least 5 bullets. Keep the most important qualifications and skills. If the source has fewer than 5 distinct points, expand slightly but stay relevant:
${personalProfileSection}

Stop immediately after the last PERSONAL PROFILE bullet. Do not add a NICE TO HAVE section. Do not add any section after PERSONAL PROFILE. Output nothing else.`
    : `You are writing a job advertisement. Output ONLY this structure:

DESIGNATION: ${roleTitle.toUpperCase()}
COMPANY NAME: ${company.toUpperCase()}
LOCATION: ${location.toUpperCase()}

ROLE PROFILE
- [Key responsibility 1]
- [Key responsibility 2]
- [Key responsibility 3]
- [Key responsibility 4]
- [Key responsibility 5]

PERSONAL PROFILE
- [Education requirement]
- [Years of experience]
- [Technical skill]
- [Soft skill]
- [Other requirement]

Stop immediately after the last PERSONAL PROFILE bullet. Do not add a NICE TO HAVE section. Do not add any section after PERSONAL PROFILE. Output nothing else.`;

  // Generate advert
  const advertRes = await fetch(`${backendBase}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      role_title: roleTitle,
      reason: "Generate job advert only",
      tasks: advertPrompt,
      must_have: personalProfileSection || "",
      company: company,
      company_description: "Follow the instructions in the tasks field exactly. Output only what is specified. Do not add any extra sections, headings, or content. Do not add click here to apply or any closing lines.",
    }),
  });

  let advertText = "";
  if (advertRes.ok) {
    const advertData = await advertRes.json();
    advertText = advertData.final_jd || "";
  }

  // Strip any unwanted sections the AI adds after PERSONAL PROFILE
  if (advertText) {
    const unwanted = ["NICE TO HAVE", "CLICK HERE", "APPLY WITHIN", "CONDITIONS", "THE TEAM"];
    for (const phrase of unwanted) {
      const idx = advertText.toUpperCase().indexOf(phrase);
      if (idx > -1) {
        advertText = advertText.substring(0, idx).trim();
      }
    }
  }

  // Also generate full JD for internal use
  const mainRes = await fetch(`${backendBase}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      role_title: roleTitle,
      reason: reason,
      tasks: roleProfileSection || roleTitle,
      must_have: personalProfileSection || "",
      company: company,
      company_description: "CBL Group is a leading FMCG conglomerate in Sri Lanka.",
      location: location,
    }),
  });

  let mainData: any = {};
  if (mainRes.ok) {
    mainData = await mainRes.json();
  }

  return NextResponse.json({
    ...mainData,
    advert_text: advertText,
  });
}
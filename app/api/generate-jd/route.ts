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

  const roleTitle = body.role_title || "";
  const location = body.location || "Pannipitiya";
  const company = body.company || "Ceylon Biscuits Limited";
  const manualJd = body.tasks || "";
  const mustHave = body.must_have || "";

  // Extract just the company intro from the Word doc (everything before DESIGNATION:)
  let companyIntro = "";
  if (docText) {
    const designationIndex = docText.toUpperCase().indexOf("DESIGNATION:");
    if (designationIndex > 0) {
      companyIntro = docText.substring(0, designationIndex).trim();
    } else {
      companyIntro = docText.trim();
    }
  }

  // Build the advert prompt
  const advertPrompt = companyIntro
    ? `You are writing a job advertisement for ${company}. Follow these rules strictly:

1. Start with this EXACT company introduction, word for word, do not change a single word, comma, or full stop:

${companyIntro}

2. Then add these lines exactly:
DESIGNATION: ${roleTitle.toUpperCase()}
COMPANY NAME: ${company.toUpperCase()}
LOCATION: ${location.toUpperCase()}

3. Then write ROLE PROFILE using dashes (-). Extract ALL key responsibilities from this job description — do not limit to 5, include every meaningful point:
${manualJd}
Make each bullet point specific and action-oriented. Do not copy verbatim — summarise into clear concise bullets. Minimum 5, no maximum.

4. Then write PERSONAL PROFILE using dashes (-). Extract ALL requirements from the personal profile — do not limit to 5, include every meaningful qualification, skill and experience point:
${mustHave}
Always include education requirements, years of experience, technical skills, soft skills and any other relevant criteria mentioned. Minimum 5, no maximum.

5. End with exactly these two lines:
Click here to apply now!
Apply within 7 days of this advert being published.

Do not add any other sections. Do not add salary, conditions, team info, or screening questions. Output only the advert text, nothing else.`
    : `Write a job advertisement for ${company} in this exact format:

JOIN A TEAM DRIVEN BY EXCELLENCE
[3 paragraph company introduction about CBL Group being Sri Lanka's largest food conglomerate, their brands including Munchee, Ritzbury, Revello, Tiara, Samaposha, and their values of caring, quality, innovation and integrity]

DESIGNATION: ${roleTitle.toUpperCase()}
COMPANY NAME: ${company.toUpperCase()}
LOCATION: ${location.toUpperCase()}

ROLE PROFILE
[All key responsibilities as bullet points using dashes (-) based on: ${manualJd}. Include every meaningful point, minimum 5, no maximum limit.]

PERSONAL PROFILE
[All requirements as bullet points using dashes (-) based on: ${mustHave}. Include education, years of experience, technical skills, soft skills and any other relevant criteria. Minimum 5, no maximum limit.]

Click here to apply now!
Apply within 7 days of this advert being published.

Output only the advert, no extra sections, no salary, no conditions.`;

  // Step 1 — generate main JD (for the full JD text)
  const mainRes = await fetch(`${backendBase}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...body,
      company_description: companyIntro
        ? `Use this VERBATIM as the company introduction, do not change any words:\n\n${companyIntro}`
        : "CBL Group is a leading FMCG conglomerate in Sri Lanka.",
    }),
  });

  let mainData: any = {};
  if (mainRes.ok) {
    mainData = await mainRes.json();
  } else {
    const text = await mainRes.text();
    console.error("Railway JD error:", text);
    return NextResponse.json({ error: text }, { status: 500 });
  }

  // Step 2 — generate advert separately with strict prompt
  const advertRes = await fetch(`${backendBase}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      role_title: roleTitle,
      reason: body.reason || "Replacement hire",
      tasks: advertPrompt,
      must_have: mustHave,
      company: company,
      company_description: "Follow the instructions in the tasks field exactly. Output only the advert.",
    }),
  });

  let advertText = "";
  if (advertRes.ok) {
    const advertData = await advertRes.json();
    advertText = advertData.final_jd || "";
  }

  return NextResponse.json({
    ...mainData,
    advert_text: advertText,
  });
}
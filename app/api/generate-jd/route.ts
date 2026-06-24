import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

async function callOpenAI(systemPrompt: string, userPrompt: string): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.4,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error("OpenAI error: " + text);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "";

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
  const location = body.location || "";
  const company = body.company || "Ceylon Biscuits Limited";
  const reason = body.reason || "";
  const customPrompt = body.custom_prompt || "";

  // Extract role profile and personal profile from uploaded doc
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

  // Build advert prompt
  const advertPrompt = customPrompt
    ? `${customPrompt}

Use the following details:
DESIGNATION: ${roleTitle.toUpperCase()}
COMPANY NAME: ${company.toUpperCase()}
LOCATION: ${location.toUpperCase()}

ROLE PROFILE content to use:
${roleProfileSection}

PERSONAL PROFILE content to use:
${personalProfileSection}

Output format must be:
DESIGNATION: ${roleTitle.toUpperCase()}
COMPANY NAME: ${company.toUpperCase()}
LOCATION: ${location.toUpperCase()}

ROLE PROFILE
- [bullet]
- [bullet]

PERSONAL PROFILE
- [bullet]
- [bullet]

Stop after PERSONAL PROFILE. No NICE TO HAVE. No click here to apply. No extra sections.`
    : `You are writing a concise job advertisement. Output ONLY the following structure. Nothing before, nothing after. No company introduction. No click here to apply. No closing lines. No extra headings.

DESIGNATION: ${roleTitle.toUpperCase()}
COMPANY NAME: ${company.toUpperCase()}
LOCATION: ${location.toUpperCase()}

ROLE PROFILE
Summarise the following into EXACTLY 5 to 6 bullet points. You MUST use a bullet point (•) at the start of every single line. Every line must start with •. You MUST write at least 5 bullets. Keep the most important responsibilities:
${roleProfileSection || reason}

PERSONAL PROFILE
Summarise the following into EXACTLY 5 to 6 bullet points. You MUST use a bullet point (•) at the start of every single line. Every line must start with •. You MUST write at least 5 bullets. Keep the most important qualifications and skills:
${personalProfileSection}

Stop immediately after the last PERSONAL PROFILE bullet. Do not add a NICE TO HAVE section. Do not add any section after PERSONAL PROFILE. Output nothing else.`;

  // Generate advert
  let advertText = "";
  try {
    advertText = await callOpenAI(
      "You are a professional HR copywriter. Follow instructions exactly. Output only what is asked.",
      advertPrompt
    );

    // Strip unwanted sections
    const unwanted = ["NICE TO HAVE", "CLICK HERE", "APPLY WITHIN", "CONDITIONS", "THE TEAM"];
    for (const phrase of unwanted) {
      const idx = advertText.toUpperCase().indexOf(phrase);
      if (idx > -1) advertText = advertText.substring(0, idx).trim();
    }

    // Convert dashes to bullets
    advertText = advertText
      .split("\n")
      .map((line) => {
        const trimmed = line.trim();
        if (trimmed.startsWith("- ")) return "• " + trimmed.substring(2);
        if (trimmed.startsWith("* ")) return "• " + trimmed.substring(2);
        return line;
      })
      .join("\n");
  } catch (e) {
    console.error("Advert generation failed:", e);
  }

  // Generate full JD + parsed fields + best_fit
  const fullJdPrompt = `You are an expert HR professional writing a detailed internal job description for ${company}.

Role: ${roleTitle}
Location: ${location}
Reason for opening: ${reason}
Role responsibilities: ${roleProfileSection || "See role title"}
Requirements: ${personalProfileSection}

Generate a comprehensive job description. Then respond with a JSON object at the end in this exact format (after the JD text):

---JSON---
{
  "skills": "comma separated list of required skills",
  "tags": "comma separated tags for this role",
  "knockout_filters": "1. Question one\n2. Question two\n3. Question three",
  "screening_questions": "1. Question one\n2. Question two\n3. Question three",
  "best_fit": {
    "summary": "2-3 sentence description of the ideal candidate",
    "years_experience_min": 2,
    "years_experience_max": 5,
    "ideal_titles": ["Title 1", "Title 2", "Title 3"],
    "must_have_keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
    "nice_to_have_keywords": ["keyword1", "keyword2", "keyword3"],
    "red_flag_keywords": ["red flag 1", "red flag 2", "red flag 3"]
  }
}`;

  let finalJd = "";
  let parsed: any = {};
  let bestFit: any = null;

  try {
    const fullResponse = await callOpenAI(
      "You are an expert HR professional. Write detailed, specific job descriptions.",
      fullJdPrompt
    );

    const jsonSplit = fullResponse.split("---JSON---");
    finalJd = jsonSplit[0].trim();

    if (jsonSplit[1]) {
      try {
        const jsonText = jsonSplit[1].trim().replace(/```json|```/g, "").trim();
        const jsonData = JSON.parse(jsonText);
        parsed = {
          skills: jsonData.skills || "",
          tags: jsonData.tags || "",
          knockout_filters: jsonData.knockout_filters || "",
          screening_questions: jsonData.screening_questions || "",
          job_description: finalJd,
        };
        bestFit = jsonData.best_fit || null;
      } catch (e) {
        console.error("JSON parse failed:", e);
      }
    }
  } catch (e) {
    console.error("Full JD generation failed:", e);
  }

  return NextResponse.json({
    final_jd: finalJd,
    advert_text: advertText,
    parsed,
    best_fit: bestFit,
  });
}
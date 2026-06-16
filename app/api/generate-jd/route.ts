import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const base = "https://vezpr-jd-gen-production.up.railway.app";
  console.log("Calling Railway:", `${base}/api/generate`);

  const res = await fetch(`${base}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Railway error:", text);
    return NextResponse.json({ error: text }, { status: 500 });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
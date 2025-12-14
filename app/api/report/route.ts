import { NextResponse } from "next/server";
import { generateSessionReport } from "@/app/lib/gemini";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { report: "No conversation history to analyze." },
        { status: 400 }
      );
    }

    const report = await generateSessionReport(messages);

    return NextResponse.json({ report });
  } catch (error) {
    console.error("Report generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}

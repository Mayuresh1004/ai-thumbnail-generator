import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.GEMINI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
});
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, type, style, mood, placement, colors } = body;

    const prompt = `
      Create a detailed thumbnail design prompt.
      Video Title: ${title}
      Video Type: ${type}
      Style: ${style}
      Mood/Angle: ${mood}
      Placement of photo: ${placement}
      Brand colors: ${JSON.stringify(colors)}

      Make it visual, describing background, lighting, composition, and any text overlay.
    `;

    const response = await openai.chat.completions.create({
      model: "gemini-1.5-flash",
      messages: [{ role: "user", content: prompt }],
    });

    const rewritten = response.choices[0].message?.content;

    return NextResponse.json({ rewrittenPrompt: rewritten });
  } catch (error: any) {
    console.error("Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

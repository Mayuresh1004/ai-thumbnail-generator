import OpenAI from "openai";
import "dotenv/config";
import { NextRequest } from "next/server";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, images = [], model = "google/gemini-2.5-flash-image-preview:free" } = body;

    let imageUrl;

    if (model.includes("gemini")) {
      const completion = await openai.chat.completions.create({
        model,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
                             ...images.map((img: string) => ({
                 type: "image_url",
                 image_url: { url: `data:image/png;base64,${img}` },
               })),
            ],
          },
        ],
      });

      imageUrl = (completion.choices[0]?.message as any)?.images?.[0]?.image_url?.url;
    } else {
      // Fallback for models that don’t take multiple images
      const result = await openai.images.generate({
        model,
        prompt,
        size: "1024x1024",
      });

      imageUrl = result.data?.[0]?.url;
    }

    if (!imageUrl) {
      return new Response(JSON.stringify({ error: "No image URL returned!" }), { status: 500 });
    }

    return new Response(JSON.stringify({ url: imageUrl }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("❌ Error generating image:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500,
    });
  }
}

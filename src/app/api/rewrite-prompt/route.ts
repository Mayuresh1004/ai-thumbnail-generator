import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      title = "", 
      type = "", 
      style = "", 
      mood = "", 
      placement = "right"
    } = body;

    // Validate API key
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API key not configured" }, 
        { status: 500 }
      );
    }

    // Create a comprehensive prompt for thumbnail design
    const prompt = `
You are a professional YouTube thumbnail designer. Create a detailed, specific prompt for generating an eye-catching YouTube thumbnail with these requirements:

**Video Details:**
- Title: "${title}"
- Video Type: "${type}"
- Style: "${style}"
- Mood/Angle: "${mood}"
- Subject Placement: ${placement} side of the thumbnail

**Layout Requirements:**
- Leave a 20-30% area on the left for overlaying bold, readable title text

**Requirements:**
1. Create a visually stunning, click-worthy thumbnail
2. Leave space for the subject image on the ${placement} side
3. Include bold, readable text areas
4. Use dramatic lighting and composition
5. Make it optimized for small mobile screens
6. Ensure high contrast and visual impact
7. If u recognize any brand name in the user prompt, use the brand name as a keyword in the prompt and consider to add its logo

**Design Elements to Include:**
- Dynamic background with gradients or textures
- Bold typography areas for title overlay
- Professional lighting effects
- Visual elements that support the "${mood}" mood
- Space reserved for subject placement on the ${placement}
- Style inspired by trending YouTube thumbnails for gaming/tech/lifestyle
- U can also change the outfit of the subject to make it more appealing and relevant to the video content.
- Always add the photo given by the user in the prompt, give it a special attention.
- u can search and add logo of the brand in the prompt, give it a special attention.
- u can also add some background if needed

You can also use following design aspects:
-"cinematic lighting with strong shadows"
-"high contrast, saturated colors"
-"3D depth with layered composition"
-"motion blur for dynamic effect"
-"Cartoonish, realistic, hyper-detailed, or cinematic look"

You can also add some camera angle like "Top-down view", "close-up on face", "wide-angle cinematic shot"

Create a detailed prompt that describes the background, lighting, composition, and any graphic elements. Focus on making it highly specific and actionable for an AI image generator.

The thumbnail should convey: ${mood} energy and be suitable for ${type} content.
Style direction: ${style}

Make the prompt detailed and specific, focusing on visual elements, lighting, and composition.
Example:
Prompt is to create a photo of a person  with video title travel volg of paris
Rewritten prompt: Create a photo of a person wearing travel clothes, with a background of Paris, and the title "Travel Volg of Paris" in bold, readable text areas.

`;

    const response = await openai.chat.completions.create({
      model: "gemini-2.5-flash",
      messages: [{ 
        role: "user", 
        content: prompt 
      }],
      temperature: 0.8, // Increase creativity
      max_tokens: 1000, // Allow for detailed responses
    });

    const rewritten = response.choices[0].message?.content;

    if (!rewritten) {
      // Fallback prompt if API fails
      const fallbackPrompt = `Create a ${style || 'bold and dynamic'} YouTube thumbnail background with ${mood || 'exciting'} energy. The background should have dramatic lighting, gradients, and visual effects that support "${title}" content. Leave the ${placement} side open for subject placement. Include space for bold text overlays. Style: ${style}. Perfect for ${type} video content.`;
      
      return NextResponse.json({ 
        rewrittenPrompt: fallbackPrompt,
        fallback: true 
      });
    }

    return NextResponse.json({ 
      rewrittenPrompt: rewritten,
      originalInputs: {
        title,
        type,
        style,
        mood,
        placement
      },
      success: true
    });

  } catch (error: any) {
    console.error("❌ Error rewriting prompt:", error);
    
    // Provide more specific error handling
    let errorMessage = "Failed to rewrite prompt";
    let statusCode = 500;

    if (error.message?.includes("API key")) {
      errorMessage = "Invalid Gemini API key";
      statusCode = 401;
    } else if (error.message?.includes("quota") || error.message?.includes("limit")) {
      errorMessage = "API quota exceeded. Please try again later.";
      statusCode = 429;
    } else if (error.message) {
      errorMessage = error.message;
    }

    // Return a fallback prompt even on error
    const { title = "", type = "", style = "", mood = "", placement = "right" } = await req.json().catch(() => ({}));
    
    const fallbackPrompt = `Create a ${style || 'bold and dynamic'} YouTube thumbnail background with ${mood || 'exciting'} energy. The background should have dramatic lighting, gradients, and visual effects that support "${title}" content. Leave the ${placement} side open for subject placement. Include space for bold text overlays. Style: ${style}. Perfect for ${type} video content.`;

    return NextResponse.json({ 
      rewrittenPrompt: fallbackPrompt,
      error: errorMessage,
      fallback: true,
      success: false
    }, { status: statusCode });
  }
}
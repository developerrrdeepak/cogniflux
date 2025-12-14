import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { text, memory, persona } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // Voice Mapping based on Persona
    const VOICE_MAP: Record<string, string> = {
        atlas: "21m00Tcm4TlvDq8ikWAM", // Rachel (Balanced)
        sage: "ErXwobaYiN019PkySvjV",  // Antoni (Calm/Wise)
        cipher: "TxGEqnHWrfWFTfGW9XjX" // Josh (Deep/Tech)
    };

    const voiceId = VOICE_MAP[persona] || VOICE_MAP.atlas;
    
    // Adjust voice settings based on cognitive memory
    let stability = 0.5;
    let similarity_boost = 0.75;
    let style = 0.0;

    if (memory) {
      if (memory.confusionScore === "high" || memory.detectedSignals.includes("frustration")) {
        // More stable, calming, consistent
        stability = 0.85;
        similarity_boost = 0.8;
        style = 0.0; 
      } else if (memory.userLevel === "expert") {
        // Faster, more expressive/dynamic
        stability = 0.4;
        similarity_boost = 0.7;
        style = 0.2; 
      }
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      console.warn("ELEVENLABS_API_KEY not found in environment variables");
       return NextResponse.json({ error: "API Key missing" }, { status: 500 });
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_monolingual_v1", 
          voice_settings: {
            stability,
            similarity_boost,
            style,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
        const errorText = await response.text();
        console.error("ElevenLabs API Error:", errorText);
        return NextResponse.json({ error: "Failed to generate speech" }, { status: response.status });
    }

    const audioBuffer = await response.arrayBuffer();
    
    // Return the audio as a base64 string so the client can play it easily
    const base64Audio = Buffer.from(audioBuffer).toString("base64");

    return NextResponse.json({ audio: base64Audio });

  } catch (error) {
    console.error("TTS Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { computeLiveMemory } from "@/app/lib/liveMemory";
import { runGemini } from "@/app/lib/gemini";
import { publishCognitiveEvent } from "@/app/lib/kafka";
import { sendDatadogTelemetry } from "@/app/lib/datadog";

export async function POST(req: Request) {
  const startTime = Date.now();
  
  try {
    const { message, signals, image, persona } = await req.json();

    // 1. Compute Cognitive State (Inference Time)
    const memory = computeLiveMemory(signals || []);

    // 2. Publish to Confluent (The "Collective Memory")
    publishCognitiveEvent(memory, message).catch(err => 
        console.error("Background Kafka publish failed", err)
    );

    // 3. Generate AI Response
    const reply = await runGemini(message, memory, image, persona);

    // 4. Send Datadog Telemetry
    const duration = Date.now() - startTime;
    sendDatadogTelemetry(memory, message, duration).catch(err =>
        console.error("Background Datadog telemetry failed", err)
    );

    return NextResponse.json({
      reply,
      memory,
    });
  } catch (error) {
    console.error("Gemini error:", error);

    // Send Error Telemetry to Datadog if possible
    // (Simplified for now)

    return NextResponse.json({
      reply:
        "I'm having trouble responding right now, but I'm still adapting to your needs.",
      memory: {
        confusionScore: "medium",
        userLevel: "intermediate",
        detectedSignals: [],
      },
    });
  }
}

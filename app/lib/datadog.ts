export async function sendDatadogTelemetry(memory: any, message: string, responseTimeMs: number) {
  const apiKey = process.env.DATADOG_API_KEY;
  const site = process.env.DATADOG_SITE || "datadoghq.com"; // Default to US1

  if (!apiKey) {
    console.log("[MOCK DATADOG] Telemetry skipped (No API Key)");
    return;
  }

  // Map confusion to numeric for graphing
  const confusionMap: Record<string, number> = {
    low: 0,
    medium: 1,
    high: 2
  };
  const confusionValue = confusionMap[memory.confusionScore] || 0;

  // 1. Send Metric (Custom Metric)
  // Metric: cogniflux.cognitive_load
  const metricBody = {
    series: [
      {
        metric: "cogniflux.cognitive_load",
        points: [[Math.floor(Date.now() / 1000), confusionValue]],
        type: "gauge",
        tags: [`user_level:${memory.userLevel}`, "env:hackathon"],
      },
      {
          metric: "cogniflux.response_time",
          points: [[Math.floor(Date.now() / 1000), responseTimeMs]],
          type: "gauge",
          tags: ["model:gemini-2.5-flash"]
      }
    ],
  };

  try {
    // Send Metric
    await fetch(`https://api.${site}/api/v1/series?api_key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(metricBody),
    });

    // 2. Send Log (Event)
    // Only send significant events (High Confusion or Frustration)
    if (memory.confusionScore === "high" || memory.detectedSignals.includes("frustration")) {
        const logBody = {
            ddsource: "cogniflux-ai",
            ddtags: "env:hackathon",
            hostname: "vercel-function",
            message: `High Cognitive Load Detected: User is ${memory.userLevel}`,
            service: "cognitive-engine",
            status: "warn", // Warning level for Datadog Monitors
            structured_data: {
                user_message: message,
                signals: memory.detectedSignals,
                confusion_score: memory.confusionScore
            }
        };

        await fetch(`https://http-intake.logs.${site}/api/v2/logs?dd-api-key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify([logBody]), // Array of logs
        });
        
        console.log("Datadog Alert Sent");
    }

  } catch (error) {
    console.error("Datadog Telemetry Error:", error);
  }
}

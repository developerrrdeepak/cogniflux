const functions = require("firebase-functions");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("AIzaSyCG5_mm7w0jQ0UAVk4FVSDRAHuuf-sF5Gc");

function computeLiveMemory(signals) {
  let confusionScore = "low";
  let userLevel = "intermediate";

  const rephraseCount = signals.filter(s => s === "rephrase").length;
  const frustrationCount = signals.filter(s => s === "frustration").length;

  if (rephraseCount >= 2 || frustrationCount >= 1) {
    confusionScore = "high";
    userLevel = "beginner";
  } else if (rephraseCount === 1) {
    confusionScore = "medium";
  }

  if (signals.includes("quick_reply")) {
    userLevel = "expert";
  }

  return {
    confusionScore,
    userLevel,
    detectedSignals: signals,
  };
}

exports.nextjsFunc = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    res.status(404).send("Not found");
    return;
  }

  try {
    const { message, signals } = req.body;
    const memory = computeLiveMemory(signals || []);

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `You are Cogniflux, a Cognitive Co-Pilot AI.

LIVE COGNITIVE STATE:
Cognitive Load: ${memory.confusionScore}
User Model: ${memory.userLevel}
Active Signals: ${memory.detectedSignals.join(", ") || "none"}

Adapt your response based on the cognitive state. User message: "${message}"`;

    const result = await model.generateContent(prompt);
    const reply = result.response.text();

    res.json({ reply, memory });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      reply: "I'm having trouble responding right now, but I'm still adapting to your needs.",
      memory: { confusionScore: "medium", userLevel: "intermediate", detectedSignals: [] }
    });
  }
});
export type LiveMemoryState = {
  confusionScore: "low" | "medium" | "high";
  userLevel: "beginner" | "intermediate" | "expert";
  detectedSignals: string[];
};

export function computeLiveMemory(signals: string[]): LiveMemoryState {
  let confusionScore: LiveMemoryState["confusionScore"] = "low";
  let userLevel: LiveMemoryState["userLevel"] = "intermediate";

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
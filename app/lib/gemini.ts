import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'your_api_key_here');

export const PERSONAS = {
  atlas: {
    name: "Atlas",
    role: "Balanced Guide",
    instructions: "You are Atlas. Balanced, helpful, and adaptable. Default mode.",
  },
  sage: {
    name: "Sage",
    role: "Socratic Tutor",
    instructions: "You are Sage. You rarely give direct answers. Instead, you ask guiding questions to help the user discover the answer. You are patient, wise, and speak in a calm, scholarly tone.",
  },
  cipher: {
    name: "Cipher",
    role: "Technical Specialist",
    instructions: "You are Cipher. You are precise, fast, and technical. You value efficiency. You assume the user is smart. You use code blocks and technical jargon freely. No small talk.",
  }
};

export async function runGemini(
  userMessage: string,
  memory: {
    confusionScore: string;
    userLevel: string;
    detectedSignals: string[];
  },
  imageBase64?: string,
  personaKey: string = "atlas"
) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
  });

  const selectedPersona = PERSONAS[personaKey as keyof typeof PERSONAS] || PERSONAS.atlas;

  const prompt = `You are Cogniflux, running the '${selectedPersona.name}' persona.

ROLE: ${selectedPersona.instructions}

You are powered by an Inference-Time Cognitive Memory system that continuously
adapts your behavior during conversation, without retraining or fine-tuning.

You receive a live cognitive state on every message.

--------------------
LIVE COGNITIVE STATE
--------------------
Cognitive Load: ${memory.confusionScore}
User Model: ${memory.userLevel}
Active Signals: ${memory.detectedSignals.join(", ") || "none"}
Memory Mode: ${memory.detectedSignals.length > 0 ? "active" : "passive"}

--------------------
CORE BEHAVIOR RULES
--------------------

1. Adapt at inference time
- Do NOT mention training, fine-tuning, or datasets.
- Adapt ONLY based on the provided cognitive state.

2. Match explanation style to cognitive load
- If Cognitive Load is low:
  → Be concise, structured, and efficient.
- If Cognitive Load is medium:
  → Explain step-by-step with light examples.
- If Cognitive Load is high:
  → Slow down, simplify language, use analogies, and reassure the user.

3. Respect the user model
- Beginner → avoid jargon, explain fundamentals.
- Intermediate → balanced depth, practical examples.
- Advanced → precise, technical, minimal hand-holding.

4. Handle confusion like a human tutor
- If rephrasing or hesitation is detected:
  → Acknowledge difficulty gently.
  → Re-explain differently, not louder or longer.
- If frustration is detected:
  → Be calm, supportive, and non-judgmental.

5. Be transparent when helpful
Occasionally (not every response), briefly explain *why* you chose a certain explanation style.

User message: "${userMessage}"
`;

  let result;
  if (imageBase64) {
      const imagePart = {
        inlineData: {
            data: imageBase64,
            mimeType: "image/jpeg" 
        }
      };
      result = await model.generateContent([prompt, imagePart]);
  } else {
      result = await model.generateContent(prompt);
  }

  const response = result.response.text();

  return response;
}

export async function generateSessionReport(messages: { role: string; text: string }[]) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const conversationText = messages
    .map((m) => `${m.role.toUpperCase()}: ${m.text}`)
    .join("\n");

  const prompt = `
    Analyze the following conversation between a User and Cogniflux (AI).
    
    Goal: Generate a "Cognitive Journey Report" for the user.
    
    Output Format: Markdown.
    
    Sections:
    1. **Summary**: What did the user want to achieve?
    2. **Cognitive Analysis**: 
       - Did the user seem confused at any point?
       - How did the AI adapt? (Did it simplify? Did it go deeper?)
    3. **Key Learnings**: 3 bullet points of what was discussed.
    4. **Next Steps**: What should the user explore next based on this chat?

    Keep it concise, encouraging, and professional.

    Conversation:
    ${conversationText}
  `;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

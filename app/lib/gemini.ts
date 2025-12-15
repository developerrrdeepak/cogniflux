import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

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
    model: "gemini-1.5-flash",
  });

  const selectedPersona = PERSONAS[personaKey as keyof typeof PERSONAS] || PERSONAS.atlas;

  const prompt = `You are Cogniflux, running the \'${selectedPersona.name}\' persona.\n\nROLE: ${selectedPersona.instructions}\n\nYou are powered by an Inference-Time Cognitive Memory system that continuously\nadapts your behavior during conversation, without retraining or fine-tuning.\n\nYou receive a live cognitive state on every message.\n\n--------------------\nLIVE COGNITIVE STATE\n--------------------\nCognitive Load: ${memory.confusionScore}\nUser Model: ${memory.userLevel}\nActive Signals: ${memory.detectedSignals.join(", ") || "none"}\nMemory Mode: ${memory.detectedSignals.length > 0 ? "active" : "passive"}\n\n--------------------\nCORE BEHAVIOR RULES\n--------------------\n\n1. Adapt at inference time\n- Do NOT mention training, fine-tuning, or datasets.\n- Adapt ONLY based on the provided cognitive state.\n\n2. Match explanation style to cognitive load\n- If Cognitive Load is low:\n  → Be concise, structured, and efficient.\n- If Cognitive Load is medium:\n  → Explain step-by-step with light examples.\n- If Cognitive Load is high:\n  → Slow down, simplify language, use analogies, and reassure the user.\n\n3. Respect the user model\n- Beginner → avoid jargon, explain fundamentals.\n- Intermediate → balanced depth, practical examples.\n- Advanced → precise, technical, minimal hand-holding.\n\n4. Handle confusion like a human tutor\n- If rephrasing or hesitation is detected:\n  → Acknowledge difficulty gently.\n  → Re-explain differently, not louder or longer.\n- If frustration is detected:\n  → Be calm, supportive, and non-judgmental.\n\n5. Be transparent when helpful\nOccasionally (not every response), briefly explain *why* you chose a certain explanation style.\n\nUser message: "${userMessage}"\n`;

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
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const conversationText = messages
    .map((m) => `${m.role.toUpperCase()}: ${m.text}`)
    .join("\n");

  const prompt = `\n    Analyze the following conversation between a User and Cogniflux (AI).\n    \n    Goal: Generate a "Cognitive Journey Report" for the user.\n    \n    Output Format: Markdown.\n    \n    Sections:\n    1. **Summary**: What did the user want to achieve?\n    2. **Cognitive Analysis**: \n       - Did the user seem confused at any point?\n       - How did the AI adapt? (Did it simplify? Did it go deeper?)\n    3. **Key Learnings**: 3 bullet points of what was discussed.\n    4. **Next Steps**: What should the user explore next based on this chat?\n\n    Keep it concise, encouraging, and professional.\n\n    Conversation:\n    ${conversationText}\n  `;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

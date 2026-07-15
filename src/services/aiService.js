import OpenAI from "openai";
import { config } from "../config/env.js";
import { buildPrompt } from "../utils/promptBuilder.js";

const client = new OpenAI({
  apiKey: config.deepseek.apiKey,
  baseURL: config.deepseek.baseURL,
});

// Typed error classes so the error handler can map them precisely
export class AITimeoutError extends Error {
  constructor() {
    super("AI request timed out");
    this.name = "AITimeoutError";
  }
}

export class AIServiceError extends Error {
  constructor(message) {
    super(message);
    this.name = "AIServiceError";
  }
}

/**
 * Validates the parsed JSON from DeepSeek matches the AnalysisResult shape.
 * Throws AIServiceError if it doesn't.
 */
function validateAnalysisResult(parsed) {
  if (!parsed || typeof parsed !== "object") {
    throw new AIServiceError("AI returned a non-object response");
  }

  if (!Array.isArray(parsed.interpretations) || parsed.interpretations.length < 2) {
    throw new AIServiceError("AI returned fewer than 2 interpretations");
  }

  if (parsed.interpretations.length > 4) {
    throw new AIServiceError("AI returned more than 4 interpretations");
  }

  for (const interp of parsed.interpretations) {
    if (
      typeof interp.meaning !== "string" ||
      typeof interp.explanation !== "string" ||
      typeof interp.tone !== "string" ||
      typeof interp.confidence !== "number"
    ) {
      throw new AIServiceError(
        "AI interpretation is missing required fields (meaning, explanation, tone, confidence)"
      );
    }

    if (interp.confidence < 0 || interp.confidence > 100) {
      throw new AIServiceError("AI interpretation confidence must be between 0 and 100");
    }
  }

  if (typeof parsed.dominantTone !== "string") {
    throw new AIServiceError("AI response missing dominantTone");
  }
}

/**
 * Analyzes a sentence and returns interpretations from DeepSeek.
 * @param {string} sentence
 * @param {object} [context]
 * @returns {Promise<{ interpretations: Array, dominantTone: string }>}
 */
export async function analyzeSentence(sentence, context) {
  const { systemPrompt, userPrompt } = buildPrompt(sentence, context);

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new AITimeoutError()), config.deepseek.timeoutMs)
  );

  const callPromise = client.chat.completions.create({
    model: config.deepseek.model,
    max_tokens: 1000,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  let completion;
  try {
    completion = await Promise.race([callPromise, timeoutPromise]);
  } catch (err) {
    if (err instanceof AITimeoutError) throw err;
    // Upstream network / auth errors
    console.error("[aiService] API call failed:", err.message, err.status, err.error);
    throw new AIServiceError(`DeepSeek API error: ${err.message}`);
  }

  const rawText = completion.choices?.[0]?.message?.content;
  if (!rawText) {
    throw new AIServiceError("AI returned an empty response");
  }

  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new AIServiceError("AI returned malformed JSON");
  }

  validateAnalysisResult(parsed);

  return {
    interpretations: parsed.interpretations,
    dominantTone: parsed.dominantTone,
  };
}
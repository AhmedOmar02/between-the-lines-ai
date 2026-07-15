const TONE_VOCABULARY = [
  "neutral",
  "friendly",
  "frustrated",
  "sarcastic",
  "anxious",
  "affectionate",
  "dismissive",
  "apologetic",
];

/**
 * Builds the system and user prompts for the DeepSeek analysis call.
 * @param {string} sentence
 * @param {{ relationshipType?: string, channel?: string, background?: string }} [context]
 * @returns {{ systemPrompt: string, userPrompt: string }}
 */
export function buildPrompt(sentence, context = {}) {
  const toneList = TONE_VOCABULARY.join(", ");

  const systemPrompt = `You are an expert in communication analysis and interpersonal dynamics.
Your job is to identify multiple plausible interpretations of a sentence, considering the context in which it was said.

Return ONLY a valid JSON object — no markdown, no explanation outside the JSON — matching this exact shape:
{
  "interpretations": [
    {
      "meaning": "string — the possible interpretation in plain language",
      "explanation": "string — why this reading is plausible",
      "tone": "string — one of the allowed tone values",
      "confidence": "number — 0 to 100, how likely this interpretation is correct"
    }
  ],
  "dominantTone": "string — the single most likely tone overall"
}

Rules:
- Return exactly 2 to 4 interpretations. No more, no fewer.
- If context fields are provided, ground your interpretations in that context.
- The "tone" field MUST be one of this closed set: ${toneList}.
- "dominantTone" MUST also be from the same set.
- "confidence" is a number from 0 to 100 reflecting how likely each interpretation is correct relative to the others. They do not need to sum to 100 — just rank your genuine confidence.
- Use simple, everyday English. Avoid complex or academic words. Write as if explaining to a non-native English speaker.
- Do not add any keys beyond those specified above.`;

  const contextLines = [];
  if (context.relationshipType)
    contextLines.push(`Relationship: ${context.relationshipType}`);
  if (context.channel) contextLines.push(`Channel: ${context.channel}`);
  if (context.background)
    contextLines.push(`Background: ${context.background}`);

  const contextBlock =
    contextLines.length > 0
      ? `\n\nContext:\n${contextLines.join("\n")}`
      : "\n\nNo additional context was provided.";

  const userPrompt = `Analyze the following sentence and return all plausible interpretations as JSON.

Sentence: "${sentence}"${contextBlock}`;

  return { systemPrompt, userPrompt };
}

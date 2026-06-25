import { analyzeSentence } from "../services/aiService.js";

export async function analyze(req, res, next) {
  const { sentence, context } = req.body;

  const startTime = Date.now();

  try {
    const result = await analyzeSentence(sentence, context);
    const processingTimeMs = Date.now() - startTime;

    return res.status(200).json({
      success: true,
      data: {
        interpretations: result.interpretations,
        dominantTone: result.dominantTone,
        processingTimeMs,
      },
    });
  } catch (err) {
    next(err);
  }
}

import { analyzeSentence } from "../services/aiService.js";
import Analysis from "../models/Analysis.js";

export async function analyze(req, res, next) {
  const { sentence, context } = req.body;

  const startTime = Date.now();

  try {
    const result = await analyzeSentence(sentence, context);
    const processingTimeMs = Date.now() - startTime;

    await Analysis.create({
      userId: req.userId,
      sentence,
      context,
      interpretations: result.interpretations,
      dominantTone: result.dominantTone,
      processingTimeMs,
    });

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

export async function listAnalyses(req, res, next) {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);

  try {
    const [analyses, total] = await Promise.all([
      Analysis.find({ userId: req.userId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Analysis.countDocuments({ userId: req.userId }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        analyses,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getAnalysisById(req, res, next) {
  try {
    const analysis = await Analysis.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!analysis) {
      return res.status(404).json({
        success: false,
        error: "Analysis not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: analysis,
    });
  } catch (err) {
    next(err);
  }
}

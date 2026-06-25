import { AITimeoutError, AIServiceError } from "../services/aiService.js";

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof AITimeoutError) {
    return res.status(504).json({
      success: false,
      error: "Analysis timed out, please try again",
    });
  }

  if (err instanceof AIServiceError) {
    return res.status(502).json({
      success: false,
      error: "AI service unavailable, please try again",
    });
  }

  // Unexpected errors — don't leak internals
  console.error("[errorHandler] Unhandled error:", err);
  return res.status(500).json({
    success: false,
    error: "An unexpected error occurred",
  });
}

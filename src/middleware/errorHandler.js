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

  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      error: Object.values(err.errors)[0]?.message || "Validation failed",
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      error: `Invalid value for ${err.path}`,
    });
  }

  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      error: "A record with this value already exists",
    });
  }

  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      error: "Invalid or expired token",
    });
  }

  // Unexpected errors — don't leak internals
  console.error("[errorHandler] Unhandled error:", err);
  return res.status(500).json({
    success: false,
    error: "An unexpected error occurred",
  });
}

import { verifyToken } from "../utils/jwt.js";

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      error: "Missing or invalid Authorization header",
    });
  }

  const token = authHeader.slice("Bearer ".length);

  try {
    req.userId = verifyToken(token);
    next();
  } catch {
    return res.status(401).json({
      success: false,
      error: "Invalid or expired token",
    });
  }
}

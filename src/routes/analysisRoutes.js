import { Router } from "express";
import { validateAnalyzeBody } from "../middleware/validateRequest.js";
import { analyze } from "../controllers/analysisController.js";

const router = Router();

// POST /api/analyze
router.post("/analyze", validateAnalyzeBody, analyze);

// GET /api/health
router.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

export default router;

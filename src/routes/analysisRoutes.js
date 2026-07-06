import { Router } from "express";
import { validateAnalyzeBody } from "../middleware/validateRequest.js";
import { authenticate } from "../middleware/authenticate.js";
import { analyze, listAnalyses, getAnalysisById } from "../controllers/analysisController.js";

const router = Router();

// POST /api/analyze
router.post("/analyze", authenticate, validateAnalyzeBody, analyze);

// GET /api/analyses
router.get("/analyses", authenticate, listAnalyses);

// GET /api/analyses/:id
router.get("/analyses/:id", authenticate, getAnalysisById);

// GET /api/health
router.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

export default router;

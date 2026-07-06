import { Router } from "express";
import { validateRegisterBody, validateLoginBody } from "../middleware/validateRequest.js";
import { register, login } from "../controllers/authController.js";

const router = Router();

// POST /api/auth/register
router.post("/auth/register", validateRegisterBody, register);

// POST /api/auth/login
router.post("/auth/login", validateLoginBody, login);

export default router;

import { Router } from "express";
import { validateRegisterBody, validateLoginBody, validateUpdateMeBody } from "../middleware/validateRequest.js";
import { authenticate } from "../middleware/authenticate.js";
import { register, login, updateMe } from "../controllers/authController.js";

const router = Router();

// POST /api/auth/register
router.post("/auth/register", validateRegisterBody, register);

// POST /api/auth/login
router.post("/auth/login", validateLoginBody, login);

// PATCH /api/auth/me
router.patch("/auth/me", authenticate, validateUpdateMeBody, updateMe);

export default router;

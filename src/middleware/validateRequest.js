import { body, validationResult } from "express-validator";

export const validateAnalyzeBody = [
  body("sentence")
    .exists({ checkNull: true })
    .withMessage("sentence is required")
    .isString()
    .withMessage("sentence must be a string")
    .trim()
    .notEmpty()
    .withMessage("sentence is required"),

  // Optional context fields — must be strings if present
  body("context.relationshipType")
    .optional()
    .isString()
    .withMessage("context.relationshipType must be a string"),
  body("context.channel")
    .optional()
    .isString()
    .withMessage("context.channel must be a string"),
  body("context.background")
    .optional()
    .isString()
    .withMessage("context.background must be a string"),

  // Reject the request if validation fails
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg,
      });
    }
    next();
  },
];

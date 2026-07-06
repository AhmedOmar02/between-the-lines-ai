import { body, validationResult } from "express-validator";

const checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: errors.array()[0].msg,
    });
  }
  next();
};

export const validateRegisterBody = [
  body("email")
    .exists({ checkNull: true })
    .withMessage("email is required")
    .isEmail()
    .withMessage("email must be a valid email address")
    .normalizeEmail(),
  body("password")
    .exists({ checkNull: true })
    .withMessage("password is required")
    .isString()
    .withMessage("password must be a string")
    .isLength({ min: 8 })
    .withMessage("password must be at least 8 characters"),
  checkValidation,
];

export const validateLoginBody = [
  body("email")
    .exists({ checkNull: true })
    .withMessage("email is required")
    .isEmail()
    .withMessage("email must be a valid email address")
    .normalizeEmail(),
  body("password")
    .exists({ checkNull: true })
    .withMessage("password is required")
    .isString()
    .withMessage("password must be a string"),
  checkValidation,
];

export const validateAnalyzeBody = [
  body("sentence")
    .exists({ checkNull: true })
    .withMessage("sentence is required")
    .isString()
    .withMessage("sentence must be a string")
    .trim()
    .notEmpty()
    .withMessage("sentence is required")
    .isLength({ max: 1000 })
    .withMessage("sentence must not exceed 1000 characters"),

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

  checkValidation,
];

import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { signToken } from "../utils/jwt.js";

const SALT_ROUNDS = 10;

export async function register(req, res, next) {
  const { email, password } = req.body;

  try {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({ email, passwordHash });

    const token = signToken(user._id.toString());

    return res.status(201).json({
      success: true,
      data: {
        token,
        user: { id: user._id, email: user.email },
      },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        error: "An account with this email already exists",
      });
    }
    next(err);
  }
}

export async function updateMe(req, res, next) {
  const { email, password } = req.body;

  try {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.findByIdAndUpdate(
      req.userId,
      { email, passwordHash },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      data: {
        user: { id: user._id, email: user.email },
      },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        error: "An account with this email already exists",
      });
    }
    next(err);
  }
}

export async function login(req, res, next) {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    const token = signToken(user._id.toString());

    return res.status(200).json({
      success: true,
      data: {
        token,
        user: { id: user._id, email: user.email },
      },
    });
  } catch (err) {
    next(err);
  }
}

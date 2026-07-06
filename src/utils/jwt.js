import jwt from "jsonwebtoken";
import { config } from "../config/env.js";

export function signToken(userId) {
  return jwt.sign({ sub: userId }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
}

export function verifyToken(token) {
  const payload = jwt.verify(token, config.jwt.secret);
  return payload.sub;
}

import mongoose from "mongoose";
import { config } from "./env.js";

export async function connectDB() {
  try {
    await mongoose.connect(config.mongodb.uri);
    console.log("[db] Connected to MongoDB");
  } catch (err) {
    console.error("[db] Connection failed:", err.message);
    process.exit(1);
  }
}

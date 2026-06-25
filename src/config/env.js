import dotenv from "dotenv";
dotenv.config();

const required = ["DEEPSEEK_API_KEY"];

for (const key of required) {
  if (!process.env[key]) {
    console.error(`[startup] Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

export const config = {
  port: parseInt(process.env.PORT || "3000", 10),
  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
    model: process.env.DEEPSEEK_MODEL || "deepseek-v4-flash",
    timeoutMs: parseInt(process.env.AI_TIMEOUT_MS || "4000", 10),
  },
};

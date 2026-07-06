import express from "express";
import cors from "cors";
import analysisRoutes from "./routes/analysisRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { apiLimiter } from "./middleware/rateLimiter.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "10kb" }));
app.use("/api", apiLimiter);

app.get("/", (req, res) => {
    res.send("Backend is running!");
});


// Routes
app.use("/api", authRoutes);
app.use("/api", analysisRoutes);

// Centralized error handler — must be registered last
app.use(errorHandler);

export default app;

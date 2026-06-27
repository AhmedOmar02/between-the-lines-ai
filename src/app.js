import express from "express";
import cors from "cors";
import analysisRoutes from "./routes/analysisRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Backend is running!");
});


// Routes
app.use("/api", analysisRoutes);

// Centralized error handler — must be registered last
app.use(errorHandler);

export default app;

import { config } from "./config/env.js";
import { connectDB } from "./config/db.js";
import app from "./app.js";

await connectDB();

app.listen(config.port, () => {
  console.log(`[server] BetweenTheLines.AI running on port ${config.port}`);
});

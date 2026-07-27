import dotenv from "dotenv";
dotenv.config(); // 🔥 MUST BE FIRST

import app from "./app.js";

// 🔥 Initialize BullMQ background worker inside the server process for Render single-instance deployments
import "./workers/analysis.worker.js";

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
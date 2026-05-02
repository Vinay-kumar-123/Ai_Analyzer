import dotenv from "dotenv";
dotenv.config(); // 🔥 MUST BE FIRST

import app from "./app.js";

// DEBUG
console.log("REDIS:", process.env.REDIS_URL);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
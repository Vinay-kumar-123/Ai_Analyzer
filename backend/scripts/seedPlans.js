import mongoose from "mongoose";
import dotenv from "dotenv";
import Plan from "../models/Plan.js";
import connectDB from "../config/db.js";

dotenv.config();
await connectDB();

await Plan.deleteMany();

await Plan.insertMany([
  {
    name: "Basic",
    price: 1,
    credits: 30,
    validityDays: 30,
  },
  {
    name: "Pro",
    price: 199,
    credits: 70,
    validityDays: 30,
    isPopular: true,
  },
  {
    name: "Premium",
    price: 299,
    credits: 120,
    validityDays: 30,
  },
]);

console.log("✅ Plans Seeded");
process.exit();
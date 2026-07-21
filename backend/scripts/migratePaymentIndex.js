import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "../config/db.js";
import Payment from "../models/Payment.js";

dotenv.config();

const runMigration = async () => {
  try {
    console.log("🚀 Starting Payment index migration...");
    await connectDB();

    const db = mongoose.connection.client ? mongoose.connection.client.db() : mongoose.connection.db;
    if (!db) {
      console.log("ℹ️ Database connection not ready. Syncing indexes naturally...");
      await Payment.createIndexes();
      console.log("✅ Indexes synchronized successfully");
      return;
    }
    
    // Check if the payments collection exists
    const collections = await db.listCollections({ name: "payments" }).toArray();
    if (collections.length === 0) {
      console.log("ℹ️ Payments collection does not exist yet. Syncing indexes naturally...");
      await Payment.createIndexes();
      console.log("✅ Indexes synchronized successfully");
      process.exit(0);
    }

    const paymentCollection = db.collection("payments");
    const indexes = await paymentCollection.listIndexes().toArray();
    
    // Find index named paymentId_1
    const oldIndex = indexes.find(idx => idx.name === "paymentId_1");
    if (oldIndex) {
      const isPartial = !!oldIndex.partialFilterExpression;
      if (!isPartial) {
        console.log("⚠️ Found old non-partial index 'paymentId_1'. Dropping it...");
        await paymentCollection.dropIndex("paymentId_1");
        console.log("✅ Old 'paymentId_1' index dropped successfully.");
      } else {
        console.log("ℹ️ Index 'paymentId_1' is already a partial index. No drop needed.");
      }
    } else {
      console.log("ℹ️ Old index 'paymentId_1' not found. No drop needed.");
    }

    console.log("🔄 Syncing new partial index...");
    await Payment.createIndexes();
    console.log("✅ Index migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
};

if (process.argv[1] && process.argv[1].includes("migratePaymentIndex")) {
  runMigration();
}

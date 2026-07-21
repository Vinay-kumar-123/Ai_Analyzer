import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "../config/db.js";
import Analysis from "../models/Analysis.js";

dotenv.config();

const runMigration = async () => {
  try {
    console.log("🚀 Starting Analysis index migration...");
    await connectDB();

    const db = mongoose.connection.client ? mongoose.connection.client.db() : mongoose.connection.db;
    if (!db) {
      console.log("ℹ️ Database connection not ready. Syncing indexes naturally...");
      await Analysis.createIndexes();
      console.log("✅ Indexes synchronized successfully");
      return;
    }
    
    // Check if the analyses collection exists
    const collections = await db.listCollections({ name: "analyses" }).toArray();
    if (collections.length === 0) {
      console.log("ℹ️ Analyses collection does not exist yet. Syncing indexes naturally...");
      await Analysis.createIndexes();
      console.log("✅ Indexes synchronized successfully");
      process.exit(0);
    }

    const analysisCollection = db.collection("analyses");
    const indexes = await analysisCollection.listIndexes().toArray();
    
    // Find and drop index inputHash_1_aiVersion_1 (the old unique index)
    const oldUniqueIndex = indexes.find(idx => idx.name === "inputHash_1_aiVersion_1");
    if (oldUniqueIndex) {
      console.log("⚠️ Found old cache index 'inputHash_1_aiVersion_1'. Dropping it...");
      await analysisCollection.dropIndex("inputHash_1_aiVersion_1");
      console.log("✅ Old 'inputHash_1_aiVersion_1' index dropped successfully.");
    } else {
      console.log("ℹ️ Old index 'inputHash_1_aiVersion_1' not found. No drop needed.");
    }

    // Find and drop index inputHash_1_language_1_aiVersion_1 (composite index without language_override)
    const oldCompositeIndex = indexes.find(idx => idx.name === "inputHash_1_language_1_aiVersion_1");
    if (oldCompositeIndex && oldCompositeIndex.language_override !== "dummy_language") {
      console.log("⚠️ Found old index 'inputHash_1_language_1_aiVersion_1' without language override. Dropping it...");
      await analysisCollection.dropIndex("inputHash_1_language_1_aiVersion_1");
      console.log("✅ Old 'inputHash_1_language_1_aiVersion_1' index dropped successfully.");
    } else {
      console.log("ℹ️ Old index 'inputHash_1_language_1_aiVersion_1' not found or already has override. No drop needed.");
    }

    // Find and drop index inputHash_1_goal_1_language_1_status_1 (old index without language_override)
    const oldLangIndex = indexes.find(idx => idx.name === "inputHash_1_goal_1_language_1_status_1");
    if (oldLangIndex && oldLangIndex.language_override !== "dummy_language") {
      console.log("⚠️ Found old index 'inputHash_1_goal_1_language_1_status_1' without language override. Dropping it...");
      await analysisCollection.dropIndex("inputHash_1_goal_1_language_1_status_1");
      console.log("✅ Old 'inputHash_1_goal_1_language_1_status_1' index dropped successfully.");
    } else {
      console.log("ℹ️ Old index 'inputHash_1_goal_1_language_1_status_1' not found or already has override. No drop needed.");
    }

    // Find and drop text index videoTitle_text_summary_text (old text index without language_override)
    const oldTextIndex = indexes.find(idx => idx.name === "videoTitle_text_summary_text");
    if (oldTextIndex && oldTextIndex.language_override !== "dummy_language") {
      console.log("⚠️ Found old index 'videoTitle_text_summary_text' without language override. Dropping it...");
      await analysisCollection.dropIndex("videoTitle_text_summary_text");
      console.log("✅ Old 'videoTitle_text_summary_text' index dropped successfully.");
    } else {
      console.log("ℹ️ Old index 'videoTitle_text_summary_text' not found or already has override. No drop needed.");
    }

    console.log("🔄 Syncing new composite cache index...");
    await Analysis.createIndexes();
    console.log("✅ Index migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
};

if (process.argv[1] && process.argv[1].includes("migrateAnalysisIndex")) {
  runMigration();
}

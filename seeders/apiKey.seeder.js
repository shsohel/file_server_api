require("dotenv").config();
const mongoose = require("mongoose");
const crypto = require("crypto");
const ApiKey = require("../src/models/ApiKey");

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/file_server";

const generateApiKey = () => crypto.randomBytes(32).toString("hex");

const seedApiKey = async () => {
  try {
    await mongoose.connect(MONGO_URI);

    console.log("✅ MongoDB connected for seeding...");

    // Check if an API key already exists
    const existingKey = await ApiKey.findOne();
    if (existingKey) {
      console.log("⚠️ API key already exists:", existingKey.key);
      process.exit(0);
    }

    const newKey = new ApiKey({
      name: "Default Key", // required
      key: generateApiKey(),
      owner: "694cb0ecc0ed8e98266f903f",
      active: true,
      description: "Default API key",
    });

    await newKey.save();

    console.log("✅ Default API key generated:");
    console.log("API KEY:", newKey.key);

    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding API key:", err);
    process.exit(1);
  }
};

seedApiKey();

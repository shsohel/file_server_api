const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Enable debug mode
    mongoose.set("debug", false);

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      autoIndex: false, // better for production
      serverSelectionTimeoutMS: 5000,
    });

    console.log(
      `✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`
    );
  } catch (error) {
    console.error("❌ MongoDB connection failed");
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = connectDB;

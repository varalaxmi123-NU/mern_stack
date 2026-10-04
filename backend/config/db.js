const mongoose = require("mongoose");

const DEFAULT_MONGO_URI = "mongodb://varalaxminu:varalaxminu@ac-yokmdwz-shard-00-00.ygkdzjk.mongodb.net:27017,ac-yokmdwz-shard-00-01.ygkdzjk.mongodb.net:27017,ac-yokmdwz-shard-00-02.ygkdzjk.mongodb.net:27017/?ssl=true&replicaSet=atlas-yp0p3m-shard-0&authSource=admin&appName=Cluster0";

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  try {
    const rawUri = process.env.MONGO_URI || DEFAULT_MONGO_URI;
    const uri = rawUri.trim().replace(/^["']|["']$/g, '');
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      bufferCommands: false,
    });
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    // Retry with DEFAULT_MONGO_URI if custom MONGO_URI failed
    if (process.env.MONGO_URI && process.env.MONGO_URI !== DEFAULT_MONGO_URI) {
      console.log("Attempting fallback to default MongoDB Atlas cluster...");
      await mongoose.connect(DEFAULT_MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
        bufferCommands: false,
      });
      console.log("Fallback MongoDB connected successfully");
    }
  }
};

module.exports = connectDB;
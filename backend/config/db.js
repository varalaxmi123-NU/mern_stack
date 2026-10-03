const mongoose = require("mongoose");

const DEFAULT_MONGO_URI = "mongodb://varalaxminu:varalaxminu@ac-yokmdwz-shard-00-00.ygkdzjk.mongodb.net:27017,ac-yokmdwz-shard-00-01.ygkdzjk.mongodb.net:27017,ac-yokmdwz-shard-00-02.ygkdzjk.mongodb.net:27017/?ssl=true&replicaSet=atlas-yp0p3m-shard-0&authSource=admin&appName=Cluster0";

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  try {
    const uri = process.env.MONGO_URI || DEFAULT_MONGO_URI;
    await mongoose.connect(uri);
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
  }
};

module.exports = connectDB;
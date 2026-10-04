const mongoose = require("mongoose");

const DEFAULT_MONGO_URI = "mongodb://varalaxminu:varalaxminu@ac-yokmdwz-shard-00-00.ygkdzjk.mongodb.net:27017,ac-yokmdwz-shard-00-01.ygkdzjk.mongodb.net:27017,ac-yokmdwz-shard-00-02.ygkdzjk.mongodb.net:27017/?ssl=true&replicaSet=atlas-yp0p3m-shard-0&authSource=admin&appName=Cluster0";

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  
  const urisToTry = [];
  if (process.env.MONGO_URI) {
    const clean = process.env.MONGO_URI.trim().replace(/^["']|["']$/g, '');
    if (clean) urisToTry.push(clean);
  }
  if (!urisToTry.includes(DEFAULT_MONGO_URI)) {
    urisToTry.push(DEFAULT_MONGO_URI);
  }

  for (const uri of urisToTry) {
    try {
      console.log("Attempting MongoDB connection...");
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
      });
      console.log("MongoDB connected successfully");
      return;
    } catch (err) {
      console.error(`MongoDB connection failed (${err.message})`);
    }
  }
};

module.exports = connectDB;
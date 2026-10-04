const app = require('../backend/server');

module.exports = (req, res) => {
  try {
    return app(req, res);
  } catch (err) {
    console.error("Vercel Serverless Function Error:", err);
    return res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
};


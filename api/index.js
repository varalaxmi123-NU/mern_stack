const app = require('../backend/server');

module.exports = (req, res) => {
  if (req.url && req.url.startsWith('/api')) {
    req.url = req.url.substring(4);
    if (!req.url.startsWith('/')) req.url = '/' + req.url;
  }
  return app(req, res);
};

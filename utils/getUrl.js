var url = require("url");

const fullUrl = (req) => {
  return url.format({
    protocol: req.protocol,
    host: req.get("host"),
    // pathname: req.originalUrl,
  });
};

module.exports = {
  fullUrl: fullUrl,
};

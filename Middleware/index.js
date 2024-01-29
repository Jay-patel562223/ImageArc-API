module.exports = {
  authentication: require("./passport"),
  guestOrAuthenticate: require("./passport_guest"),
  hasRole: require("./permission"),
};

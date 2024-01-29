const env = require("dotenv").config().parsed;
const environment = "DEVELOPMENT";
const messages = require("../lang/en.js");

const sendResponse = (res, success, statusCode = 200, data = {}, message) => {
  if (
    data &&
    data.hasOwnProperty("code") &&
    data.code === "E_INVALID_CRITERIA"
  ) {
    message = data.details;
  } else if (message && typeof message !== "string" && message.isJoi) {
    message = message.details[0].message.replace(/\"/g, "");
  } else if (message && typeof message === "object") {
    message =
      environment === "DEVELOPMENT"
        ? message.message
        : messages.SOMETHING_WRONG;
  }

  return res.status(statusCode).send({ ...data, status: success, message });
};

exports.sendResponse = sendResponse;

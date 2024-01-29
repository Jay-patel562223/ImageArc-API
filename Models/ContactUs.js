const joi = require("joi");
const mongoose = require("mongoose");

const schema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
});

const createRequest = (body) => {
  const schema = joi.object().keys({
    name: joi.string().required().label("Name field"),
    email: joi.string().required().label("Email field"),
    subject: joi.string().required().label("Subject field"),
    description: joi.string().required().label("Description field"),
  });
  return joi.validate(body, schema, { allowUnknown: true });
};

module.exports = {
  ContactUs: mongoose.model("ContactUs", schema),
  createRequest: createRequest,
};

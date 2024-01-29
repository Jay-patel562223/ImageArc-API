const joi = require("joi");
const mongoose = require("mongoose");

const schema = mongoose.Schema({
  country: {
    type: String,
    required: true,
    unique: true
  },
  states: {
    type: Array,
    required: true,
  },
  status: {
    type: String,
    default: "active",
  },
  created_at: {
    type: Date,
    required: true,
    default: Date.now,
    select: false,
  },
  updated_at: {
    type: Date,
    required: true,
    default: Date.now,
    select: false,
  },
});

const createCountryRequest = (body) => {
  const schema = joi.object().keys({
    country: joi.string().required().label("Country field"),
  });
  return joi.validate(body, schema, { allowUnknown: true });
};

const createStateRequest = (body) => {
  const schema = joi.object().keys({
    country: joi.string().required().label("Country field"),
    state: joi.array().required().label("State field"),
  });
  return joi.validate(body, schema, { allowUnknown: true });
};

module.exports = {
  Countries: mongoose.model("Countries", schema),
  createCountryRequest: createCountryRequest,
  createStateRequest: createStateRequest,
};

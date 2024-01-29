const joi = require("joi");
const mongoose = require("mongoose");

const schema = mongoose.Schema({
  country_id: {
    type: Object,
    required: true,
    ref: "Countries",
  },
  states: {
    type: String,
    required: true,
    unique: true
  },
  country: {
    type: String,
    // required: true,
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

const createStatesRequest = (body) => {
  const schema = joi.object().keys({
    country_id: joi.string().required().label("Country field"),
    states: joi.string().required().label("State field"),
  });
  return joi.validate(body, schema, { allowUnknown: true });
};

// const createStateRequest = (body) => {
//   const schema = joi.object().keys({
//     country: joi.string().required().label("States field"),
//     state: joi.array().required().label("State field"),
//   });
//   return joi.validate(body, schema, { allowUnknown: true });
// };

module.exports = {
  States: mongoose.model("States", schema),
  createStatesRequest: createStatesRequest,
  // createStateRequest: createStateRequest,
};

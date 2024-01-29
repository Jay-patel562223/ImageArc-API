const joi = require("joi");
const mongoose = require("mongoose");

const schema = mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: true,
  },
  is_editable: {
    type: Boolean,
    default: true,
  },
  body_content: {
    type: String,
    default: true,
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

const createRequest = (body) => {
  const schema = joi.object().keys({
    title: joi.string().required().label("Title field"),
    slug: joi.string().required().label("Slug field"),
    // body_content: joi.string().required().label("Body content field"),
  });
  return joi.validate(body, schema, { allowUnknown: true });
};

module.exports = {
  Page: mongoose.model("Page", schema),
  createRequest: createRequest,
};

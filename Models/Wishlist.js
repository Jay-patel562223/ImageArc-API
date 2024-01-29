const joi = require("joi");
const mongoose = require("mongoose");

const schema = mongoose.Schema({
  user_id: {
    type: String,
    required: true,
  },
  product_id: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    // default: "active",
  },
  created_by: {
    type: String,
  },
  updated_by: {
    type: String,
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
  deleted_at: {
    type: Date,
    // required: true,
    // default: Date.now,
    select: false,
  },
});

const createRequest = (body) => {
  const schema = joi.object().keys({
    user_id: joi.string().required().label("User id field"),
    product_id: joi.string().required().label("Product id field"),
  });
  return joi.validate(body, schema, { allowUnknown: true });
};

module.exports = {
  Wishlist: mongoose.model("Wishlist", schema),
  createRequest: createRequest,
};

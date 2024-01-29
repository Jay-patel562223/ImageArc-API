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
  order_id: {
    type: String,
    required: true,
  },
  comment: {
    type: String,
    // required: true,
  },
  // photos: {
  //   type: String,
  //   // required: true,
  // },
  rating: {
    type: String,
  },
  status: {
    type: String,
    default: "active",
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
    order_id: joi.string().required().label("Order id field"),
    // comment: joi.string().required().label("Comment field"),
    // photos: joi.string().required().label("Photos field"),
    rating: joi.required().label("Rating field"),
    // rating: joi.array().required().label("Rating field"),
  });
  return joi.validate(body, schema, { allowUnknown: true });
};

const updateRequest = (body) => {
  const schema = joi.object().keys({
    // user_id: joi.string().required().label("User id field"),
    product_id: joi.string().required().label("Product id field"),
    order_id: joi.string().required().label("Order id field"),
    // comment: joi.string().required().label("Comment field"),
    // photos: joi.string().required().label("Photos field"),
    rating: joi.required().label("Rating field"),
    // rating: joi.array().required().label("Rating field"),
  });
  return joi.validate(body, schema, { allowUnknown: true });
};

const getReviewRequest = (body) => {
  const schema = joi.object().keys({
    user_id: joi.string().required().label("User id field"),
    order_id: joi.string().required().label("Order id field"),
    product_id: joi.string().required().label("Product id field"),
  });
  return joi.validate(body, schema, { allowUnknown: true });
};

module.exports = {
  Review: mongoose.model("Review", schema),
  createRequest: createRequest,
  updateRequest: updateRequest,
  getReviewRequest: getReviewRequest,
};

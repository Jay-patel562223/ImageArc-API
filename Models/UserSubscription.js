const joi = require("joi");
const mongoose = require("mongoose");

const schema = mongoose.Schema({
  user_id: {
    type: String,
    required: true,
  },
  package_id: {
    type: String,
    required: true,
    ref: "SubscriptionPackage",
  },
  price: {
    type: String,
    required: true,
  },
  qnty: {
    type: String,
    required: true,
  },
  used_qnty: {
    type: Number,
    // type: String,
    required: true,
    default: "0",
  },
  available_qnty: {
    type: Number,
    // type: String,
    required: true,
    default: "0",
  },
  file_type: {
    type: String,
    required: true,
    ref: "ProductPrice",
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
  razorpay_payment_id: {
    type: String,
  },
  unique_id: {
    type: String,
    required: true,
  },
  payment_method: {
    type: String,
    required: true,
  },
});

const createRequest = (body) => {
  const schema = joi.object().keys({
    // package_type

    user_id: joi.string().required().label("User id field"),
    package_id: joi.string().required().label("Package id field"),
    price: joi.string().required().label("Price field"),
    qnty: joi.string().required().label("Quantity field"),
    file_type: joi.string().required().label("File type field"),
    // file_type: joi.string().required().label("File Type field"),
    // qnty: joi.string().required().label("Quantity field"),
    // price: joi.string().required().label("Price field"),
    // name: joi.string().required().label("Name field"),
  });
  return joi.validate(body, schema, { allowUnknown: true });
};

const checkCountRequest = (body) => {
  const schema = joi.object().keys({
    file_type: joi.string().required().label("File type field"),
  });
  return joi.validate(body, schema, { allowUnknown: true });
};

module.exports = {
  UserSubscription: mongoose.model("UserSubscription", schema),
  createRequest,
  checkCountRequest,
};

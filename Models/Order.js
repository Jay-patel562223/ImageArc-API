const joi = require("joi");
const mongoose = require("mongoose");

const schema = mongoose.Schema({
  user_id: {
    type: String,
    required: true,
    ref: "User",
  },
  amount: {
    type: Number,
    required: true,
  },
  // billing_address: {
  //   type: Object,
  //   // required: true,
  // },
  // customer_contact: {
  //   type: String,
  //   // required: true,
  // },
  description: {
    type: String,
  },
  // paid_total
  payment_gateway: {
    type: String,
  },
  products: {
    type: Array,
  },
  // shipping_address: {
  //   type: Object,
  // },
  total: {
    type: Number,
  },
  // use_wallet_points: {
  //   type: String,
  // },
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
    // select: false,
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
  unique_id: {
    type: String,
    required: true,
  },
});

const createRequest = (body) => {
  const schema = joi.object().keys({
    user_id: joi.string().required().label("User id field"),
    amount: joi.number().required().label("Amount field"),
    customer_contact: joi.string().required().label("Customer Contact field"),
    description: joi.string().required().label("Description field"),
    payment_gateway: joi.string().required().label("Payment Gateway field"),
    products: joi.array().required().label("Product field"),
    total: joi.string().required().label("Total field"),
  });
  return joi.validate(body, schema, { allowUnknown: true });
};

const createRequestNew = (body) => {
  const schema = joi.object().keys({
    products: joi.array().required().label("Products field"),
    amount: joi.number().required().label("Amount field"),
    total: joi.number().required().label("Total field"),
    payment_gateway: joi.string().required().label("Payment Gateway field"),
    user_id: joi.string().required().label("User id field"),
    unique_id: joi.string().required().label("Unique id field"),

    // customer_contact: joi.string().required().label("Customer Contact field"),
    // description: joi.string().required().label("Description field"),
    // products: joi.array().required().label("Product field"),
  });
  return joi.validate(body, schema, { allowUnknown: true });
};

module.exports = {
  Order: mongoose.model("Order", schema),
  createRequest: createRequest,
  createRequestNew: createRequestNew,
};

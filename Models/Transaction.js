const joi = require("joi");
const mongoose = require("mongoose");

const schema = mongoose.Schema({
  user_id: {
    type: String,
    required: true,
    ref: "User",
  },
  order_id: {
    type: String,
    // required: true,
    // ref: "User",
  },
  amount: {
    type: Number,
    required: true,
  },
  payment_intent_id: {
    type: String,
    // default: "active",
  },
  customer_id: {
    type: String,
  },
  charge_id: {
    type: String,
  },
  payment_method: {
    type: String,
  },
  last4: {
    type: String,
  },
  brand: {
    type: String,
  },
  status: {
    type: String,
  },
  failed_error: {
    type: String,
  },
  pay_type: {
    type: String,
  },
  payment_gateway: {
    type: String,
  },
  razorpay_id: {
    type: String,
  },
  razorpay_card_id: {
    type: String,
  },
  razorpay_method: {
    type: String,
  },
  razorpay_bank: {
    type: String,
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
  unique_order_id: {
    type: String,
    required: true,
  },
});

const createRequest = (body) => {
  const schema = joi.object().keys({
    user_id: joi.string().required().label("User id field"),
    amount: joi.string().required().label("Amount field"),
    payment_intent_id: joi.string().required().label("Payment intent id field"),
    customer_id: joi.string().required().label("Customer id field"),
    charge_id: joi.string().required().label("Charge id field"),
    payment_method: joi.string().required().label("Payment method field"),
    brand: joi.string().required().label("Brand field"),
    pay_type: joi.string().required().label("Pay type field"),
  });
  return joi.validate(body, schema, { allowUnknown: true });
};

const razorpayOrderRequest = (body) => {
  const schema = joi.object().keys({
    amount: joi.number().required().label("Amount field"),
  });
  return joi.validate(body, schema, { allowUnknown: true });
};

module.exports = {
  Transaction: mongoose.model("Transaction", schema),
  createRequest: createRequest,
  razorpayOrderRequest: razorpayOrderRequest,
};

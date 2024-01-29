const joi = require("joi");
const mongoose = require("mongoose");

const schema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  // dpi: {
  //   type: Object,
  //   required: true,
  //   ref: "ProductDpi",
  // },
  price: {
    type: Number,
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
    name: joi.string().required().label("Name field"),
    // dpi: joi.string().required().label("DPI field"),
    price: joi.number().required().label("Price field"),
    // body_content: joi.string().required().label("Body content field"),
  });
  return joi.validate(body, schema, { allowUnknown: true });
};

module.exports = {
  ProductPrice: mongoose.model("ProductPrice", schema),
  createRequest: createRequest,
};

const joi = require("joi");
const mongoose = require("mongoose");

const schema = mongoose.Schema({
  package_type: {
    type: String,
    // type: Object,
    required: true,
    ref: "PackageType",
  },
  file_type: {
    type: String,
    required: true,
    ref: "ProductPrice",
  },
  // file_type_new: {
  //   type: Object,
  //   required: true,
  // },
  qnty: {
    type: Number,
    // type: String,
    required: true,
  },
  price: {
    type: String,
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

const createRequest = (body) => {
  const schema = joi.object().keys({
    // package_type
    file_type: joi.string().required().label("File Type field"),
    qnty: joi.number().required().label("Quantity field"),
    price: joi.number().required().label("Price field"),
    // name: joi.string().required().label("Name field"),
  });
  return joi.validate(body, schema, { allowUnknown: true });
};

module.exports = {
  SubscriptionPackage: mongoose.model("SubscriptionPackage", schema),
  createRequest,
};

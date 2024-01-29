const joi = require("joi");
const mongoose = require("mongoose");

const schema = mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  // title: {
  //   type: String,
  //   // required: true,
  // },
  image: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  tag: {
    type: Array,
  },
  // category_id: {
  //   type: String,
  // },
  // price: {
  //   type: String,
  // },
  product_status: {
    type: String,
    default: "pending",
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
  unit: {
    type: String,
    required: true,
  },
  product_type: {
    type: String,
  },
  // minPrice: {
  //   type: String,
  // },
  // maxPrice: {
  //   type: String,
  // },
  type: {
    type: Object,
  },
  // quantity: {
  //   type: String,
  // },
  // base_amount: {
  //   type: String,
  // },
  // sale_price: {
  //   type: String,
  // },
  // in_stock: {
  //   type: String,
  // },
  // is_taxable: {
  //   type: String,
  // },
  // ratings: {
  //   type: String,
  // },
  categories: {
    type: Array,
    ref: "Category",
  },
  access_type: {
    type: String,
  },
  product_unique_id: {
    type: String,
    required: true,
  },
  dpi: {
    type: String,
  },
  resolution: {
    type: String,
  },
});

const createRequest = (body) => {
  const schema = joi.object().keys({
    name: joi.string().required().label("Name field"),
    // image: joi.string().required().label("Image field"),
    description: joi.string().required().label("Description field"),
    tag: joi.string().required().label("Tag field"),
    categories: joi.array().required().label("Category field"),
    // category_id: joi.string().required().label("Category field"),
  });
  return joi.validate(body, schema, { allowUnknown: true });
};

module.exports = {
  Product: mongoose.model("Product", schema),
  createRequest: createRequest,
};

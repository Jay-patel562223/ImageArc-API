const { ProductDpi } = require("../Models/ProductDpi");
const messages = require("../lang/en");
const lodash = require("lodash");

//Get Users from DB
const getProductDpi = (
  criteria,
  projection,
  options,
  fields = [],
  callback
) => {
  ProductDpi.findOne(criteria, projection, options, callback).select(fields);
};

const getProductDpiList = async (
  criteria,
  projection,
  options,
  fields = [],
  callback
) => {
  await ProductDpi.find(criteria, projection, options, callback).select(fields);
};

//Insert ProductDpi in DB
const createProductDpi = (objToSave, callback) => {
  new ProductDpi(objToSave).save(callback);
};

//Update ProductDpi in DB
const updateProductDpi = (criteria, dataToSet, options, callback) => {
  ProductDpi.findOneAndUpdate(criteria, dataToSet, options, callback);
};

//Delete ProductDpi in DB
const deleteProductDpi = (criteria, callback) => {
  ProductDpi.findOneAndRemove(criteria, callback);
};

const countProductDpi = (criteria, callback) => {
  ProductDpi.countDocuments(criteria, callback);
};

module.exports = {
  getProductDpi,
  getProductDpiList,
  updateProductDpi,
  deleteProductDpi,
  createProductDpi,
  countProductDpi,
};

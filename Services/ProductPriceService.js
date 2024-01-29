const { ProductPrice } = require("../Models/ProductPrice");
const messages = require("../lang/en");
const lodash = require("lodash");

//Get Users from DB
const getProductPrice = (
  criteria,
  projection,
  options,
  fields = [],
  callback
) => {
  ProductPrice.findOne(criteria, projection, options, callback)
    .populate("dpi", "_id name")
    .select(fields);
};

const getProductPriceList = async (
  criteria,
  projection,
  options,
  fields = [],
  callback
) => {
  await ProductPrice.find(criteria, projection, options, callback)
    .populate("dpi", "_id name")
    .select(fields);
};

//Insert ProductPrice in DB
const createProductPrice = (objToSave, callback) => {
  new ProductPrice(objToSave).save(callback);
};

//Update ProductPrice in DB
const updateProductPrice = (criteria, dataToSet, options, callback) => {
  ProductPrice.findOneAndUpdate(criteria, dataToSet, options, callback);
};

//Delete ProductPrice in DB
const deleteProductPrice = (criteria, callback) => {
  ProductPrice.findOneAndRemove(criteria, callback);
};

const countProductPrice = (criteria, callback) => {
  ProductPrice.countDocuments(criteria, callback);
};

module.exports = {
  getProductPrice,
  getProductPriceList,
  updateProductPrice,
  deleteProductPrice,
  createProductPrice,
  countProductPrice,
};

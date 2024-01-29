const { Category } = require("../Models/Category");
const messages = require("../lang/en");
const lodash = require("lodash");

//Get Users from DB
const getCategory = (criteria, projection, options, fields = [], callback) => {
  Category.findOne(criteria, projection, options, callback).select(fields);
};

const getCategoryList = (
  criteria,
  projection,
  options,
  fields = [],
  callback
) => {
  Category.find(criteria, projection, options, callback).select(fields);
};

//Insert Category in DB
const createCategory = (objToSave, callback) => {
  new Category(objToSave).save(callback);
};

//Update Category in DB
const updateCategory = (criteria, dataToSet, options, callback) => {
  Category.findOneAndUpdate(criteria, dataToSet, options, callback);
};

//Delete Category in DB
const deleteCategory = (criteria, callback) => {
  Category.findOneAndRemove(criteria, callback);
};

const countCategory = (criteria, callback) => {
  Category.countDocuments(criteria, callback);
};

module.exports = {
  getCategory,
  getCategoryList,
  updateCategory,
  deleteCategory,
  createCategory,
  countCategory,
};

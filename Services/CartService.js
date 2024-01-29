const { Cart } = require("../Models/Cart");
const messages = require("../lang/en");
const lodash = require("lodash");

//Get Users from DB
const getCart = (criteria, projection, options, fields = [], callback) => {
  Cart.findOne(criteria, projection, options, callback).select(fields);
};

const getCartList = (criteria, projection, options, fields = [], callback) => {
  Cart.find(criteria, projection, options, callback).select(fields);
};

//Insert Cart in DB
const createCart = (objToSave, callback) => {
  new Cart(objToSave).save(callback);
};

//Update Cart in DB
const updateCart = (criteria, dataToSet, options, callback) => {
  Cart.findOneAndUpdate(criteria, dataToSet, options, callback);
};

//Delete One Cart in DB
const deleteCart = (criteria, callback) => {
  Cart.findOneAndRemove(criteria, callback);
};

//Delete many cart in DB
const deleteManyCart = (criteria, callback) => {
  Cart.deleteMany(criteria, callback);
};

const countCart = (criteria, callback) => {
  Cart.countDocuments(criteria, callback);
};

module.exports = {
  getCart,
  getCartList,
  updateCart,
  deleteCart,
  deleteManyCart,
  createCart,
  countCart,
};

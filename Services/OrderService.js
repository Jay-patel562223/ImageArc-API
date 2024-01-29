const { Order } = require("../Models/Order");
const messages = require("../lang/en");
const lodash = require("lodash");

//Get Users from DB
const getOrder = (criteria, projection, options, fields = [], callback) => {
  Order.findOne(criteria, projection, options, callback).select(fields);
};

const getOrderList = (criteria, projection, options, fields = [], callback) => {
  Order.find(criteria, projection, options, callback).select(fields);
};

//Insert Order in DB
const createOrder = (objToSave, callback) => {
  new Order(objToSave).save(callback);
};

//Update Order in DB
const updateOrder = (criteria, dataToSet, options, callback) => {
  Order.findOneAndUpdate(criteria, dataToSet, options, callback);
};

//Delete one Order in DB
const deleteOrder = (criteria, callback) => {
  Order.findOneAndRemove(criteria, callback);
};

//Delete many Order in DB
const deleteManyOrder = (criteria, callback) => {
  Order.deleteMany(criteria, callback);
};

const countOrder = (criteria, callback) => {
  Order.countDocuments(criteria, callback);
};

module.exports = {
  getOrder,
  getOrderList,
  updateOrder,
  deleteOrder,
  deleteManyOrder,
  createOrder,
  countOrder,
};

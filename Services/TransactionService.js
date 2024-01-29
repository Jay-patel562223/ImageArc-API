const { Transaction } = require("../Models/Transaction");
const messages = require("../lang/en");
const lodash = require("lodash");

//Get Users from DB
const getTransaction = (
  criteria,
  projection,
  options,
  fields = [],
  callback
) => {
  Transaction.findOne(criteria, projection, options, callback).select(fields);
};

const getTransactionList = (
  criteria,
  projection,
  options,
  fields = [],
  callback
) => {
  Transaction.find(criteria, projection, options, callback).select(fields);
};

//Insert Transaction in DB
const createTransaction = (objToSave, callback) => {
  new Transaction(objToSave).save(callback);
};

//Update Transaction in DB
const updateTransaction = (criteria, dataToSet, options, callback) => {
  Transaction.findOneAndUpdate(criteria, dataToSet, options, callback);
};

//Delete One Transaction in DB
const deleteTransaction = (criteria, callback) => {
  Transaction.findOneAndRemove(criteria, callback);
};

//Delete Many Transaction in DB
const deleteManyTransaction = (criteria, callback) => {
  Transaction.deleteMany(criteria, callback);
};

const countTransaction = (criteria, callback) => {
  Transaction.countDocuments(criteria, callback);
};

module.exports = {
  getTransaction,
  getTransactionList,
  updateTransaction,
  deleteTransaction,
  deleteManyTransaction,
  createTransaction,
  countTransaction,
};

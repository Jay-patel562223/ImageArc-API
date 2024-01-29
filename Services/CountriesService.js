const { Countries } = require("../Models/Countries");
const messages = require("../lang/en");
const lodash = require("lodash");

//Get Users from DB
const getCountry = (criteria, projection, options, fields = [], callback) => {
  Countries.findOne(criteria, projection, options, callback).select(fields);
};

const getCountryList = (
  criteria,
  projection,
  options,
  fields = [],
  callback
) => {
  Countries.find(criteria, projection, options, callback).select(fields);
};

//Insert Countries in DB
const createCountry = (objToSave, callback) => {
  new Countries(objToSave).save(callback);
};

//Update Countries in DB
const updateCountry = (criteria, dataToSet, options, callback) => {
  Countries.findOneAndUpdate(criteria, dataToSet, options, callback);
};

//Delete Countries in DB
const deleteCountry = (criteria, callback) => {
  Countries.findOneAndRemove(criteria, callback);
};

const countCountry = (criteria, callback) => {
  Countries.countDocuments(criteria, callback);
};

module.exports = {
  getCountry,
  getCountryList,
  updateCountry,
  deleteCountry,
  createCountry,
  countCountry,
};

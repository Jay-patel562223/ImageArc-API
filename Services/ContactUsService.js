const { ContactUs } = require("../Models/ContactUs");
const messages = require("../lang/en");
const lodash = require("lodash");

//Get Users from DB
const getContactUs = (criteria, projection, options, fields = [], callback) => {
  ContactUs.findOne(criteria, projection, options, callback).select(fields);
};

const getContactUsList = (
  criteria,
  projection,
  options,
  fields = [],
  callback
) => {
  ContactUs.find(criteria, projection, options, callback).select(fields);
};

//Insert ContactUs in DB
const createContactUs = (objToSave, callback) => {
  new ContactUs(objToSave).save(callback);
};

//Update ContactUs in DB
const updateContactUs = (criteria, dataToSet, options, callback) => {
  ContactUs.findOneAndUpdate(criteria, dataToSet, options, callback);
};

//Delete ContactUs in DB
const deleteContactUs = (criteria, callback) => {
  ContactUs.findOneAndRemove(criteria, callback);
};

const countContactUs = (criteria, callback) => {
  ContactUs.countDocuments(criteria, callback);
};

module.exports = {
  getContactUs,
  getContactUsList,
  updateContactUs,
  deleteContactUs,
  createContactUs,
  countContactUs,
};

const { SubscriptionPackage } = require("../Models/SubscriptionPackage");
const messages = require("../lang/en");
const lodash = require("lodash");

//Get Users from DB
const getSubscriptionPackage = (
  criteria,
  projection,
  options,
  fields = [],
  callback
) => {
  SubscriptionPackage.findOne(criteria, projection, options, callback)
    .populate("package_type", "_id name")
    .populate("file_type", "_id name")
    .lean()
    .select(fields);
};

const getSubscriptionPackageList = (
  criteria,
  projection,
  options,
  fields = [],
  callback
) => {
  SubscriptionPackage.find(criteria, projection, options, callback)
    .populate("package_type", "_id name")
    .populate("file_type", "_id name")
    .select(fields);
};

//Insert SubscriptionPackage in DB
const createSubscriptionPackage = (objToSave, callback) => {
  new SubscriptionPackage(objToSave).save(callback);
};

//Update SubscriptionPackage in DB
const updateSubscriptionPackage = (criteria, dataToSet, options, callback) => {
  SubscriptionPackage.findOneAndUpdate(criteria, dataToSet, options, callback);
};

//Delete SubscriptionPackage in DB
const deleteSubscriptionPackage = (criteria, callback) => {
  SubscriptionPackage.findOneAndRemove(criteria, callback);
};

const countSubscriptionPackage = (criteria, callback) => {
  SubscriptionPackage.countDocuments(criteria, callback);
};

module.exports = {
  getSubscriptionPackage,
  getSubscriptionPackageList,
  updateSubscriptionPackage,
  deleteSubscriptionPackage,
  createSubscriptionPackage,
  countSubscriptionPackage,
};

const { UserSubscription } = require("../Models/UserSubscription");
const messages = require("../lang/en");
const lodash = require("lodash");

//Get Users from DB
const getUserSubscription = (
  criteria,
  projection,
  options,
  fields = [],
  callback
) => {
  UserSubscription.findOne(criteria, projection, options, callback)
    .populate("package_id")
    .select(fields);
};

const getUserSubscriptionList = (
  criteria,
  projection,
  options,
  fields = [],
  callback
) => {
  UserSubscription.find(criteria, projection, options, callback).select(fields);
};

//Insert UserSubscription in DB
const createUserSubscription = (objToSave, callback) => {
  new UserSubscription(objToSave).save(callback);
};

//Update UserSubscription in DB
const updateUserSubscription = (criteria, dataToSet, options, callback) => {
  UserSubscription.findOneAndUpdate(criteria, dataToSet, options, callback);
};

//Delete One UserSubscription in DB
const deleteUserSubscription = (criteria, callback) => {
  UserSubscription.findOneAndRemove(criteria, callback);
};

//Delete Many UserSubscription in DB
const deleteManyUserSubscription = (criteria, callback) => {
  UserSubscription.deleteMany(criteria, callback);
};

const countUserSubscription = (criteria, callback) => {
  UserSubscription.countDocuments(criteria, callback);
};

module.exports = {
  getUserSubscription,
  getUserSubscriptionList,
  updateUserSubscription,
  deleteUserSubscription,
  deleteManyUserSubscription,
  createUserSubscription,
  countUserSubscription,
};

const { States } = require("../Models/States");
const messages = require("../lang/en");
const lodash = require("lodash");

//Get Users from DB
const getState = (criteria, projection, options, fields = [], callback) => {
  // .populate("user_id", "_id first_name last_name")
  States.findOne(criteria, projection, options, callback)
    .populate("country_id", "_id country")
    .select(fields);
};

const getStateList = (criteria, projection, options, fields = [], callback) => {
  States.find(criteria, projection, options, callback).select(fields);
};

//Insert States in DB
const createState = (objToSave, callback) => {
  new States(objToSave).save(callback);
};

//Update States in DB
const updateState = (criteria, dataToSet, options, callback) => {
  States.findOneAndUpdate(criteria, dataToSet, options, callback);
};

//Delete States in DB
const deleteState = (criteria, callback) => {
  States.findOneAndRemove(criteria, callback);
};

const countState = (criteria, callback) => {
  States.countDocuments(criteria, callback);
};

module.exports = {
  getState,
  getStateList,
  updateState,
  deleteState,
  createState,
  countState,
};

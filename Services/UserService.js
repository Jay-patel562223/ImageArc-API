const { User } = require("../Models/User");
const messages = require("../lang/en");
const lodash = require("lodash");

//Get Users from DB
const getUser = (criteria, projection, options, fields = [], callback) => {
  User.findOne(criteria, projection, options, callback)
    .populate("country", "_id country")
    .populate("state", "_id states")
    .select(fields);
};

const getUserList = (criteria, projection, options, fields = [], callback) => {
  User.find(criteria, projection, options, callback).select(fields);
};

//Insert User in DB
const createUser = (objToSave, callback) => {
  new User(objToSave).save(callback);
};

//Update User in DB
const updateUser = (criteria, dataToSet, options, callback) => {
  User.findOneAndUpdate(criteria, dataToSet, options, callback);
};

//Delete User in DB
const deleteUser = (criteria, callback) => {
  User.findOneAndRemove(criteria, callback);
};

const countUser = (criteria, callback) => {
  User.countDocuments(criteria, callback);
};

module.exports = {
  getUser,
  getUserList,
  updateUser,
  deleteUser,
  createUser,
  countUser,
};

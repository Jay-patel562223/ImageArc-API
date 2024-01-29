const { Setting } = require("../Models/Setting");
const messages = require("../lang/en");
const lodash = require("lodash");

//Get Users from DB
const getSetting = (criteria, projection, options, fields = [], callback) => {
  Setting.findOne(criteria, projection, options, callback).select(fields);
};

const getSettingList = (
  criteria,
  projection,
  options,
  fields = [],
  callback
) => {
  Setting.find(criteria, projection, options, callback).select(fields);
};

//Insert Setting in DB
const createSetting = (objToSave, callback) => {
  new Setting(objToSave).save(callback);
};

//Update Setting in DB
const updateSetting = (criteria, dataToSet, options, callback) => {
  Setting.findOneAndUpdate(criteria, dataToSet, options, callback);
};

//Delete Setting in DB
const deleteSetting = (criteria, callback) => {
  Setting.findOneAndRemove(criteria, callback);
};

const countSetting = (criteria, callback) => {
  Setting.countDocuments(criteria, callback);
};

module.exports = {
  getSetting,
  getSettingList,
  updateSetting,
  deleteSetting,
  createSetting,
  countSetting,
};

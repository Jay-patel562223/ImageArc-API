const { PackageType } = require("../Models/PackageType");
const messages = require("../lang/en");
const lodash = require("lodash");

//Get Users from DB
const getPackageType = (
  criteria,
  projection,
  options,
  fields = [],
  callback
) => {
  PackageType.findOne(criteria, projection, options, callback).select(fields);
};

const getPackageTypeList = (
  criteria,
  projection,
  options,
  fields = [],
  callback
) => {
  PackageType.find(criteria, projection, options, callback).select(fields);
};

//Insert PackageType in DB
const createPackageType = (objToSave, callback) => {
  new PackageType(objToSave).save(callback);
};

//Update PackageType in DB
const updatePackageType = (criteria, dataToSet, options, callback) => {
  PackageType.findOneAndUpdate(criteria, dataToSet, options, callback);
};

//Delete PackageType in DB
const deletePackageType = (criteria, callback) => {
  PackageType.findOneAndRemove(criteria, callback);
};

const countPackageType = (criteria, callback) => {
  PackageType.countDocuments(criteria, callback);
};

module.exports = {
  getPackageType,
  getPackageTypeList,
  updatePackageType,
  deletePackageType,
  createPackageType,
  countPackageType,
};

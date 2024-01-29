const { Page } = require("../Models/Page");
const messages = require("../lang/en");
const lodash = require("lodash");

//Get Users from DB
const getPage = (criteria, projection, options, fields = [], callback) => {
  Page.findOne(criteria, projection, options, callback).select(fields);
};

const getPageList = (criteria, projection, options, fields = [], callback) => {
  Page.find(criteria, projection, options, callback).select(fields);
};

//Insert Page in DB
const createPage = (objToSave, callback) => {
  new Page(objToSave).save(callback);
};

//Update Page in DB
const updatePage = (criteria, dataToSet, options, callback) => {
  Page.findOneAndUpdate(criteria, dataToSet, options, callback);
};

//Delete Page in DB
const deletePage = (criteria, callback) => {
  Page.findOneAndRemove(criteria, callback);
};

const countPage = (criteria, callback) => {
  Page.countDocuments(criteria, callback);
};

module.exports = {
  getPage,
  getPageList,
  updatePage,
  deletePage,
  createPage,
  countPage,
};

const { Review } = require("../Models/Review");
const messages = require("../lang/en");
const lodash = require("lodash");

//Get Users from DB
const getReview = (criteria, projection, options, fields = [], callback) => {
  Review.findOne(criteria, projection, options, callback).select(fields);
};

const getReviewList = (
  criteria,
  projection,
  options,
  fields = [],
  callback
) => {
  Review.find(criteria, projection, options, callback).select(fields);
};

//Insert Review in DB
const createReview = (objToSave, callback) => {
  new Review(objToSave).save(callback);
};

//Update Review in DB
const updateReview = (criteria, dataToSet, options, callback) => {
  Review.findOneAndUpdate(criteria, dataToSet, options, callback);
};

//Delete One Review in DB
const deleteReview = (criteria, callback) => {
  Review.findOneAndRemove(criteria, callback);
};
//Delete Many Review in DB
const deleteManyReview = (criteria, callback) => {
  Review.deleteMany(criteria, callback);
};

const countReview = (criteria, callback) => {
  Review.countDocuments(criteria, callback);
};

module.exports = {
  getReview,
  getReviewList,
  updateReview,
  deleteReview,
  deleteManyReview,
  createReview,
  countReview,
};

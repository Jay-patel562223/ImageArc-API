const { SocialMedia } = require("../Models/SocialMedia");
const messages = require("../lang/en");
const lodash = require("lodash");

//Get Social links from DB
const getSocialMedia = (
  criteria,
  projection,
  options,
  fields = [],
  callback
) => {
  SocialMedia.findOne(criteria, projection, options, callback).select(fields);
};

const getSocialMediaList = (
  criteria,
  projection,
  options,
  fields = [],
  callback
) => {
  SocialMedia.find(criteria, projection, options, callback).select(fields);
};

//Insert Social in DB
const createSocialMedia = (objToSave, callback) => {
  new SocialMedia(objToSave).save(callback);
};

//Update Social in DB
const updateSocialMedia = (criteria, dataToSet, options, callback) => {
  SocialMedia.findOneAndUpdate(criteria, dataToSet, options, callback);
};

//Delete One Social in DB
const deleteSocialMedia = (criteria, callback) => {
  SocialMedia.findOneAndRemove(criteria, callback);
};

//Delete Many Social in DB
const deleteManySocialMedia = (criteria, callback) => {
  SocialMedia.deleteMany(criteria, callback);
};

const countSocialMedia = (criteria, callback) => {
  SocialMedia.countDocuments(criteria, callback);
};

module.exports = {
  getSocialMedia,
  getSocialMediaList,
  updateSocialMedia,
  deleteSocialMedia,
  deleteManySocialMedia,
  createSocialMedia,
  countSocialMedia,
};
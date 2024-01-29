const { Wishlist } = require("../Models/Wishlist");
const messages = require("../lang/en");
const lodash = require("lodash");

//Get Users from DB
const getWishlist = (criteria, projection, options, fields = [], callback) => {
  Wishlist.findOne(criteria, projection, options, callback).select(fields);
};

const getWishlistList = (
  criteria,
  projection,
  options,
  fields = [],
  callback
) => {
  Wishlist.find(criteria, projection, options, callback).select(fields);
};

//Insert Wishlist in DB
const createWishlist = (objToSave, callback) => {
  new Wishlist(objToSave).save(callback);
};

//Update Wishlist in DB
const updateWishlist = (criteria, dataToSet, options, callback) => {
  Wishlist.findOneAndUpdate(criteria, dataToSet, options, callback);
};

//Delete One Wishlist in DB
const deleteWishlist = (criteria, callback) => {
  Wishlist.findOneAndRemove(criteria, callback);
};

//Delete Many Wishlist in DB
const deleteManyWishlist = (criteria, callback) => {
  Wishlist.deleteMany(criteria, callback);
};

const countWishlist = (criteria, callback) => {
  Wishlist.countDocuments(criteria, callback);
};

module.exports = {
  getWishlist,
  getWishlistList,
  updateWishlist,
  deleteWishlist,
  deleteManyWishlist,
  createWishlist,
  countWishlist,
};

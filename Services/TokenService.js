const { Token } = require("../Models/Token");
const crypto = require("crypto");

//Get Roles from DB
const getToken = async (user_id, callback) => {
  const Otp = Math.floor(100000 + Math.random() * 900000);
  let tokenData = await Token.findOne({ userId: user_id });
  if (!tokenData) {
    tokenData = await new Token({
      userId: user_id,
      otp: Otp,
    }).save();
  }
  callback("", tokenData);
};

const checkToken = (data, callback) => {
  // const checkToken = async (data,callback) => {
  Token.findOne(data, callback);
  // let tokenData = await Token.findOne(data);
  // callback('',tokenData);
};

const deleteToken = (criteria, callback) => {
  Token.findOneAndRemove(criteria, callback);
  // callback('',tokenData);
};

// Delete Many token in DB
const deleteManyToken = (criteria, callback) => {
  Token.deleteMany(criteria, callback);
  // callback('',tokenData);
};
// const deleteToken = async (criteria, callback) => {
//     let tokenData = await Token.findOneAndRemove(criteria);
//     callback('',tokenData);
// }

module.exports = {
  getToken: getToken,
  checkToken: checkToken,
  deleteToken: deleteToken,
  deleteManyToken: deleteManyToken
};

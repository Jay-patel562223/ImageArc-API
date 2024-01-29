const passport = require("passport");
const { sendResponse } = require("../Support/APIResponse");
const HttpCode = require("../Support/HttpCode");
const jwt = require("jsonwebtoken");
const func = require("joi/lib/types/func");
const _ = require("lodash");
const {User} = require("../Models/User");

function guestOrAuthenticate(req, res, next) {
  // const token = req.header(tokenHeaderKey);

  if (!_.isEmpty(req.headers.authorization)) {
    let token = req.headers.authorization;
    // token = token.replace("jwt", " ");

    return jwt.verify(token, "secret", function (err, user, info) {
      if (err) {
        return sendResponse(
          res,
          false,
          HttpCode.UNAUTHORIZED,
          null,
          "Unauthenticated."
        );
      }
      if (!user) {
        return sendResponse(
          res,
          false,
          HttpCode.UNAUTHORIZED,
          null,
          "Unauthenticated."
        );
      }
      User.findOne(
        { _id: user?.data?.user_id }
      )
      .exec((err,data)=>{
        if (err) {
          return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
        }
        if (!data) {
          return sendResponse(
            res,
            false,
            HttpCode.UNAUTHORIZED,
            null,
            "Unauthenticated."
          );
        }else{
          // Forward user information to the next middleware
          req.user = user;
          next();
        }
      })
    });
  } else {
    next();
  }
}

module.exports = guestOrAuthenticate;

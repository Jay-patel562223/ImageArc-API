const passport = require("passport");
const { sendResponse } = require("../Support/APIResponse");
const HttpCode = require("../Support/HttpCode");
const jwt = require("jsonwebtoken");
const func = require("joi/lib/types/func");
const {User} = require("../Models/User");

function authentication(req, res, next) {
  // const token = req.header(tokenHeaderKey);

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
    if (!user && user.status == "inactive") {
      return sendResponse(
        res,
        false,
        HttpCode.UNAUTHORIZED,
        null,
        "You are not allowed to login, please contact to admin."
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
  // return jwt.verify(token, "secret", function (err, data) {
  //   if (err) {
  //     return sendResponse(
  //       res,
  //       false,
  //       HttpCode.SERVER_ERROR,
  //       null,
  //       "Unauthenticated."
  //     );
  //   }
  //   req.user = data;
  // });
  // if (verified) {
  //   return res.send("Successfully Verified");
  // } else {
  //   // Access Denied
  //   return res.status(401).send(error);
  // }

  //   const token = usertoken.split(" ");
  //   const decoded = jwt.verify(token[1], "secret", function (err, data) {
  //     if (err) {
  //       return sendResponse(
  //         res,
  //         false,
  //         HttpCode.SERVER_ERROR,
  //         null,
  //         "Unauthenticated."
  //       );
  //     }
  //     if (data) {
  //       const newdata = data?.data?.user;
  //       return sendResponse(res, true, HttpCode.OK, { data: newdata }, "");
  //     }
  //   });
  // return passport.authenticate(
  //   "jwt",
  //   {
  //     session: false,
  //   },
  //   (err, user, info) => {
  //     if (err) {
  //       return next(err);
  //     }
  //     if (!user) {
  //       return sendResponse(
  //         res,
  //         false,
  //         HttpCode.UNPROCESSABLE_ENTITY,
  //         null,
  //         "Unauthenticated."
  //       );
  //     }
  //     // Forward user information to the next middleware
  //     req.user = user;
  //     //   next();
  //   }
  // )(req, res, next);
}

module.exports = authentication;

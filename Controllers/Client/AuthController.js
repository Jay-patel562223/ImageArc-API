const HttpCode = require("../../Support/HttpCode");
const { sendResponse } = require("../../Support/APIResponse");
const {
  createRequest,
  loginRequest,
  forgetRequest,
  resetRequest,
  User,
  verifyRequest,
  matchEmailOTPRequest,
  notifyRequest,
} = require("../../Models/User");
const async = require("async");
const bcrypt = require("bcryptjs");
const {
  UserService,
  RoleService,
  TokenService,
} = require("../../Services/index");
const messages = require("../../lang/en");
const config = require("../../config/index");
const jwt = require("jsonwebtoken");
const lodash = require("lodash");
const { sendEmail } = require("../../utils/sendEmail");
const sharp = require("sharp");
const path = require("path");
const { fullUrl } = require("../../utils/getUrl");
const getSymbolFromCurrency = require("currency-symbol-map");
const { checkFileType } = require("../../Services/CommonService");

const register = (req, res, next) => {
  const body = req.body;
  let user = {};

  async.series([
    (next) => {
      if (req.files != undefined && req.files.length != 0) {
        if (typeof req.files[0] == "object") {
          const file = req.files[0];

          if (checkFileType(file)) {
            return sendResponse(
              res,
              false,
              HttpCode.UNPROCESSABLE_ENTITY,
              null,
              // "Image file should be png, jpg or jpeg"
              messages.VALID_FILE
            );
          }

          var base_path = __basedir;
          const filename = path.join(
            base_path,
            "/public/user/" + file.originalname
          );

          sharp(file.buffer)
            .resize(250, 180)
            // .jpeg({ quality: 80 })
            .toFile(filename);

          body.image = file.originalname;
        }
      } else {
        // body.image = "";
        return sendResponse(
          res,
          false,
          HttpCode.SERVER_ERROR,
          null,
          "Image field is required!"
        );
      }

      next();
    },
    (next) => {
      let { error } = createRequest(body);
      if (error) {
        return sendResponse(
          res,
          false,
          HttpCode.UNPROCESSABLE_ENTITY,
          null,
          error
        );
      }
      if (body.country == "undefined") {
        return sendResponse(
          res,
          false,
          HttpCode.UNPROCESSABLE_ENTITY,
          null,
          "Country field is required!"
        );
      }
      if (body.state == "undefined") {
        return sendResponse(
          res,
          false,
          HttpCode.UNPROCESSABLE_ENTITY,
          null,
          "State field is required!"
        );
      }
      const where = { $or: [] };
      if (!lodash.isEmpty(body.email)) {
        // where["$or"].push({ email: body.email });
        where["$or"].push({ email: body.email.toLowerCase() });
      }

      UserService.getUser(where, (err, data) => {
        if (data) {
          // if (body.mobile_no && data.mobile_no === body.mobile_no.toString()) {
          //   return sendResponse(
          //     res,
          //     false,
          //     HttpCode.UNPROCESSABLE_ENTITY,
          //     null,
          //     messages.AUTH.MOBILE_NO_EXIST
          //   );
          // } else
          if (body.email && data.email === body.email) {
            return sendResponse(
              res,
              false,
              HttpCode.UNPROCESSABLE_ENTITY,
              null,
              messages.AUTH.EMAIL_EXIST
            );
          } else {
            return sendResponse(
              res,
              false,
              HttpCode.UNPROCESSABLE_ENTITY,
              null,
              messages.AUTH.EMAIL_EXIST
            );
          }
        } else {
          next();
        }
      });
    },
    (next) => {
      RoleService.getRoles(
        { code: config.APP_CONSTANTS.DATABASE.USER_ROLES.USER },
        async (err, roles) => {
          if (err) {
            return sendResponse(
              res,
              false,
              HttpCode.SERVER_ERROR,
              null,
              messages.SOMETHING_WRONG
            );
          }
          body.role_ids = roles.map((role) => role._id);

          if (lodash.isEmpty(body.role_ids)) {
            return sendResponse(
              res,
              false,
              HttpCode.SERVER_ERROR,
              null,
              messages.AUTH.DEFINE_ROLES
            );
          } else {
            if (!lodash.isEmpty(body.password)) {
              body.password = bcrypt.hashSync(body.password, 10);
            }

            body.country = JSON.parse(body.country)._id;
            // body.country = JSON.parse(body.country);
            body.state = JSON.parse(body.state)._id;
            // body.state = JSON.parse(body.state);
            body.status = "active";

            UserService.createUser(body, (err, data) => {
              if (err) {
                return sendResponse(
                  res,
                  false,
                  HttpCode.SERVER_ERROR,
                  null,
                  messages.SOMETHING_WRONG
                );
              }
              user = data;
              next();
            });
          }
        }
      );
    },
    (next) => {
      const data = {
        user_id: user._id,
        user: user,
        name: user.first_name+' '+user.last_name
      };
      data.token =
        // "jwt " +
        jwt.sign(
          {
            type: "user",
            data: data,
          },
          config.DATABASE.secret,
          {}
        );

      return sendResponse(
        res,
        true,
        HttpCode.CREATED,
        data,
        messages.CRUD.CREATED("Account")
      );
    },
  ]);
};

const verifyRegister = (req, res, next) => {
  const body = req.body;
  if (!body.email && !body.mob_no) {
    return sendResponse(
      res,
      false,
      HttpCode.UNPROCESSABLE_ENTITY,
      null,
      messages.AUTH.ANYONE_KEY_REQUIRED_FOR_LOGIN
    );
  }
  const where = { $or: [] };
  if (!lodash.isEmpty(body.email)) {
    where["$or"].push({ email: body.email });
  }
  if (!lodash.isEmpty(body.mob_no)) {
    where["$or"].push({ mob_no: body.mob_no });
  }

  UserService.getUser(where, (err, data) => {
    if (data) {
      if (body.mob_no && data.mob_no === body.mob_no.toString()) {
        return sendResponse(
          res,
          false,
          HttpCode.OK,
          {
            status: false,
          },
          messages.AUTH.MOBILE_NO_EXIST
        );
      } else {
        return sendResponse(
          res,
          false,
          HttpCode.OK,
          {
            status: false,
          },
          messages.AUTH.EMAIL_EXIST
        );
      }
    } else {
      return sendResponse(
        res,
        true,
        HttpCode.OK,
        {
          status: true,
        },
        messages.AUTH.USER_CAN_REGISTER
      );
    }
  });
};

const login = (req, res, next) => {
  const body = req.body;

  let user = {};
  async.series([
    (next) => {
      let { error } = loginRequest(body);
      if (error) {
        return sendResponse(
          res,
          false,
          HttpCode.UNPROCESSABLE_ENTITY,
          null,
          error
        );
      }

      const where = {
        $or: [{ email: body.email.toLowerCase() }],
      };

      UserService.getUser(where, {}, {}, ["+password"], (err, data) => {
        if (!data) {
          return sendResponse(
            res,
            false,
            HttpCode.UNPROCESSABLE_ENTITY,
            null,
            messages.AUTH.WRONG_USER
          );
        }

        RoleService.getRoles(
          { code: config.APP_CONSTANTS.DATABASE.USER_ROLES.USER },
          async (err, roles) => {
            if (err) {
              return sendResponse(
                res,
                false,
                HttpCode.SERVER_ERROR,
                null,
                messages.SOMETHING_WRONG
              );
            }

            let role_ids = roles.map((role) => role._id);

            var arraycontains = data.role_ids.indexOf(role_ids[0]) > -1;
            user = data;

            if (!arraycontains) {
              return sendResponse(
                res,
                false,
                HttpCode.UNPROCESSABLE_ENTITY,
                null,
                messages.AUTH.NOT_ALLOWED
              );
            }

            if (lodash.isEmpty(role_ids)) {
              return sendResponse(
                res,
                false,
                HttpCode.UNPROCESSABLE_ENTITY,
                null,
                messages.AUTH.DEFINE_ROLES
              );
            }
            next();
          }
        );
      });
    },
    (next) => {
      bcrypt.compare(body.password, user.password, function (err, result) {
        if (!result) {
          return sendResponse(
            res,
            false,
            HttpCode.UNPROCESSABLE_ENTITY,
            null,
            messages.AUTH.PASSWORD_WRONG
          );
        }
        if (user.status != "active") {
          return sendResponse(
            res,
            false,
            HttpCode.UNPROCESSABLE_ENTITY,
            { status: false },
            messages.AUTH.ACCOUNT_DEACTIVATED
          );
        }
        next();
      });
    },
    (next) => {
      const data = {
        user_id: user._id,
        email: user.email,
        name: user.first_name+' '+user.last_name
      };

      // user = user.toArray();
      delete user.password;
      delete user["password"];

      data.token =
        // "jwt " +
        jwt.sign(
          {
            type: "user",
            data: data,
          },
          config.DATABASE.secret,
          {}
        );
      data.user = user;
      return sendResponse(
        res,
        true,
        HttpCode.OK,
        data,
        messages.AUTH.LOGIN_SUCCESS
      );
    },
  ]);
};

const forgetPassword = (req, res, next) => {
  const body = req.body;
  let user = {};
  async.series([
    (next) => {
      let { error } = forgetRequest(body);
      if (error) {
        return sendResponse(
          res,
          false,
          HttpCode.UNPROCESSABLE_ENTITY,
          null,
          error
        );
      }

      const where = {
        $or: [{ email: body.email.toLowerCase() }],
      };

      UserService.getUser(where, {}, {}, [], (err, data) => {
        if (!data) {
          return sendResponse(
            res,
            false,
            HttpCode.UNPROCESSABLE_ENTITY,
            null,
            messages.AUTH.WRONG_USER
          );
        }
        user = data;
        next();
      });
    },
    (next) => {
      TokenService.getToken(user._id, (err, data) => {
        if (!data) {
          return sendResponse(
            res,
            false,
            HttpCode.UNPROCESSABLE_ENTITY,
            null,
            messages.AUTH.WRONG_USER
          );
        }
        token = data;

        if(body.isDelete == "1"){
          const link = `Your account deletions OTP is ${token.otp}`;
          // const link = `${process.env.BASE_URL}/password-reset/${user._id}/${token.token}`;
          sendEmail(user.email, "Account deletions", link);
        }else{
          const link = `Your reset password OTP is ${token.otp}`;
          // const link = `${process.env.BASE_URL}/password-reset/${user._id}/${token.token}`;
          sendEmail(user.email, "Password reset", link);
        }

        return sendResponse(
          res,
          true,
          HttpCode.OK,
          "",
          body.isDelete == "1"
            ? messages.AUTH.PASSWORD_DELETE_LINK
            : messages.AUTH.PASSWORD_RESET_EMAIL
        );
      });
    },
  ]);
};

const logout = (req, res) => {
  const user = req.user.data;
  // jwt.destroy(req.headers.authorization);
  // res.cookie("jwt", "logout", {
  //   expires: new Date(Date.now() + 5 * 1000),
  //   httpOnly: true,
  // });
  const data = {
    user_id: user.user_id,
    email: user.email,
  };

  data.token = jwt.sign(
    {
      type: "user",
      data: data,
    },
    config.DATABASE.secret,
    {}
  );

  // req.logout();
  // req.session.destroy();
  // req.session.destroy(function (err, data) {
  //   // res.redirect("/"); //Inside a callback… bulletproof!
  // });
  // return "test";
  return sendResponse(res, true, HttpCode.OK, data, "Token verified");
};

const verifyPassword = (req, res, next) => {
  const body = req.body;
  let user = {};
  async.series([
    (next) => {
      let { error } = verifyRequest(body);
      if (error) {
        return sendResponse(
          res,
          false,
          HttpCode.UNPROCESSABLE_ENTITY,
          null,
          error
        );
      }

      const where = {
        $or: [{ email: body.email.toLowerCase() }],
      };

      UserService.getUser(where, {}, {}, [], (err, data) => {
        if (!data) {
          return sendResponse(
            res,
            false,
            HttpCode.UNPROCESSABLE_ENTITY,
            null,
            messages.AUTH.WRONG_RESET_TOKEN
          );
        }
        user = data;
        next();
      });
    },
    (next) => {
      TokenService.checkToken(
        {
          userId: user._id,
          otp: body.token,
          // token: body.token,
        },
        (err, data) => {
          if (!data) {
            return sendResponse(
              res,
              false,
              HttpCode.UNPROCESSABLE_ENTITY,
              null,
              messages.AUTH.WRONG_RESET_TOKEN
            );
          }
          token = data;
          return sendResponse(res, true, HttpCode.OK, token, "Token verified");
        }
      );
    },
  ]);
};

const resetPassword = (req, res, next) => {
  const body = req.body;
  let user = {};
  async.series([
    (next) => {
      let { error } = resetRequest(body);
      if (error) {
        return sendResponse(
          res,
          false,
          HttpCode.UNPROCESSABLE_ENTITY,
          null,
          error
        );
      }

      const where = {
        $or: [{ email: body.email.toLowerCase() }],
      };

      UserService.getUser(where, {}, {}, [], (err, data) => {
        if (!data) {
          return sendResponse(
            res,
            false,
            HttpCode.UNPROCESSABLE_ENTITY,
            null,
            messages.AUTH.WRONG_RESET_TOKEN
          );
        }
        user = data;
        next();
      });
    },
    (next) => {
      TokenService.checkToken(
        {
          userId: user._id,
          otp: body.otp,
        },
        (err, data) => {
          if (!data) {
            return sendResponse(
              res,
              false,
              HttpCode.UNPROCESSABLE_ENTITY,
              null,
              messages.AUTH.INVALID_TOKEN
            );
          }
          token = data;
          next();
        }
      );
    },
    (next) => {
      if (!lodash.isEmpty(body.password)) {
        body.password = bcrypt.hashSync(body.password, 10);
      }
      UserService.updateUser(
        { _id: user._id },
        { password: body.password },
        {},
        (err, result) => {
          if (err) {
            return sendResponse(
              res,
              false,
              HttpCode.UNPROCESSABLE_ENTITY,
              null,
              err.message
            );
          }
          next();
        }
      );
    },
    (next) => {
      TokenService.deleteToken({ userId: user._id }, (err, data) => {
        if (err) {
          return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
        }
        return sendResponse(
          res,
          true,
          HttpCode.OK,
          "",
          messages.AUTH.PASSWORD_RESET_DONE
        );
      });
    },
  ]);
};

const getLogginUserData = (req, res, next) => {
  const body = req.body;
  async.series([
    (next) => {
      const user_id = req?.user?.data?.user_id;

      User.findOne(
        { _id: user_id },
        [
          // "country.country",
          // "country._id",
          "email",
          "first_name",
          "image",
          "last_name",
          "mobile_no",
          // "state.country_id",
          // "state.states",
          // "state._id",
          "_id",
          "status",
          "notification_status",
        ],
        {}
      )
        .populate("country", "_id country")
        .populate("state", "_id states")
        .lean()
        .exec((err, data) => {
          if (!data) {
            return sendResponse(
              res,
              false,
              HttpCode.UNPROCESSABLE_ENTITY,
              null,
              "Unauthenticated."
            );
          }
          // UserService.getUser(
          //   { _id: user_id },
          //   {},
          //   {},
          //   [
          //     "country.country",
          //     "country._id",
          //     "email",
          //     "first_name",
          //     "image",
          //     "last_name",
          //     "mobile_no",
          //     "state.country_id",
          //     "state.states",
          //     "state._id",
          //     "_id",
          //     "status",
          //   ],
          //   (err, data) => {
          if (err) {
            return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
          }
          const data1 = data;
          // const data1 = data?._doc;

          if (data1.image) {
            data1.image = fullUrl(req) + "/user/" + data1.image;
          } else {
            data1.image = null;
          }
          data1.newStatus = data1.status;
          return sendResponse(
            res,
            true,
            HttpCode.OK,
            data1,
            messages.CRUD.RETRIEVED("User")
          );
        });
    },
  ]);
};

const emailExistorNot = (req, res) => {
  const body = req.body;
  async.series([
    (next) => {
      let { error } = forgetRequest(body);
      if (error) {
        return sendResponse(
          res,
          false,
          HttpCode.UNPROCESSABLE_ENTITY,
          null,
          error
        );
      }
      next();
    },
    (next) => {
      UserService.getUser(
        { email: body.email.toLowerCase() },
        {},
        {},
        [],
        (err, data) => {
          if (!data) {
            return sendResponse(
              res,
              true,
              HttpCode.OK,
              "",
              messages.AUTH.EMAIL_AVAILABLE
            );
          }
          return sendResponse(
            res,
            false,
            HttpCode.UNPROCESSABLE_ENTITY,
            null,
            messages.AUTH.EMAIL_EXIST
          );
        }
      );
    },
  ]);
};

const matchEmailOTP = (req, res) => {
  const body = req.body;
  let user = {};
  async.series([
    (next) => {
      let { error } = matchEmailOTPRequest(body);
      if (error) {
        return sendResponse(
          res,
          false,
          HttpCode.UNPROCESSABLE_ENTITY,
          null,
          error
        );
      }

      const where = {
        $or: [{ email: body.email.toLowerCase() }],
      };

      UserService.getUser(where, {}, {}, [], (err, data) => {
        if (!data) {
          return sendResponse(
            res,
            false,
            HttpCode.UNPROCESSABLE_ENTITY,
            null,
            messages.AUTH.WRONG_RESET_TOKEN
          );
        }
        user = data;
        next();
      });
    },
    (next) => {
      TokenService.checkToken(
        {
          userId: user._id,
          otp: body.otp,
        },
        (err, data) => {
          if (!data) {
            return sendResponse(
              res,
              false,
              HttpCode.UNPROCESSABLE_ENTITY,
              null,
              messages.AUTH.INVALID_TOKEN
            );
          }
          // token = data;
          // next();
          return sendResponse(
            res,
            true,
            HttpCode.OK,
            "",
            messages.AUTH.VALID_TOKEN
          );
        }
      );
    },
  ]);
};

const deleteAccount = (req, res) => {
  const body = req.body;
  let user = {};
  async.series([
    (next) => {
      let { error } = matchEmailOTPRequest(body);
      if (error) {
        return sendResponse(
          res,
          false,
          HttpCode.UNPROCESSABLE_ENTITY,
          null,
          error
        );
      }

      const where = {
        $or: [{ email: body.email.toLowerCase() }],
      };

      UserService.getUser(where, {}, {}, [], (err, data) => {
        if (!data) {
          return sendResponse(
            res,
            false,
            HttpCode.UNPROCESSABLE_ENTITY,
            null,
            messages.AUTH.WRONG_RESET_TOKEN
          );
        }
        user = data;
        next();
      });
    },
    (next) => {
      TokenService.checkToken(
        {
          userId: user._id,
          otp: body.otp,
        },
        (err, data) => {
          if (!data) {
            return sendResponse(
              res,
              false,
              HttpCode.UNPROCESSABLE_ENTITY,
              null,
              messages.AUTH.INVALID_TOKEN
            );
          }
          // token = data;
          next();
          // return sendResponse(
          //   res,
          //   true,
          //   HttpCode.OK,
          //   "",
          //   messages.AUTH.VALID_TOKEN
          // );
        }
      );
    },
    (next) => {
      TokenService.deleteToken({ userId: user._id }, (err, data) => {
        if (err) {
          return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
        }
        // return sendResponse(
        //   res,
        //   true,
        //   HttpCode.OK,
        //   "",
        //   messages.AUTH.PASSWORD_RESET_DONE
        // );
        next();
      });
    },
    (next) => {
      const dataUpdate = {
        status: "inactive",
      };
      UserService.updateUser(
        {
          email: body.email.toLowerCase(),
        },
        dataUpdate,
        (err, data) => {
          if (err) {
            return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
          }

          return sendResponse(
            res,
            true,
            HttpCode.OK,
            {},
            "Account deleted successfully."
          );
        }
      );
    },
  ]);
};

const getSettings = (req, res) => {
  var config = require("../../src/db/pickbazar/settings.json");
  const symbol = getSymbolFromCurrency(config.options.currency);
  const data = {
    currency: symbol,
    code: config.options.currency,
  };
  return sendResponse(
    res,
    true,
    HttpCode.OK,
    { data: data },
    "Setting data fetched successfully"
  );
};

const changeNotificationStatus = (req, res) => {
  const body = req.body;
  const user_id = req.user.data.user_id;
  // body.notification_status = Number(body.notification_status);
  let user = {};
  async.series([
    (next) => {
      let { error } = notifyRequest(body);
      if (error) {
        return sendResponse(
          res,
          false,
          HttpCode.UNPROCESSABLE_ENTITY,
          null,
          error
        );
      }
      next();
    },
    (next) => {
      const dataUpdate = {
        notification_status: body.notification_status,
      };
      UserService.updateUser(
        {
          _id: user_id,
        },
        dataUpdate,
        (err, data) => {
          if (err) {
            return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
          }

          return sendResponse(
            res,
            true,
            HttpCode.OK,
            {},
            "Data updated successfully."
          );
        }
      );
    },
  ]);
};

module.exports = {
  register,
  verifyRegister,
  login,
  forgetPassword,
  verifyPassword,
  resetPassword,
  getLogginUserData,
  emailExistorNot,
  matchEmailOTP,
  logout,
  deleteAccount,
  getSettings,
  changeNotificationStatus,
};

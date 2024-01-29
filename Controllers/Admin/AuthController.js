const HttpCode = require("../../Support/HttpCode");
const { sendResponse } = require("../../Support/APIResponse");
const { createRequest, loginRequest } = require("../../Models/User");
const async = require("async");
const bcrypt = require("bcryptjs");
const {
  UserService,
  RoleService,
  OrderService,
} = require("../../Services/index");
const messages = require("../../lang/en");
const config = require("../../config/index");
const jwt = require("jsonwebtoken");
const lodash = require("lodash");
const { fullUrl } = require("../../utils/getUrl");
const sharp = require("sharp");
const path = require("path");
const moment = require("moment");
const { Order } = require("../../Models/Order");
const { Transaction } = require("../../Models/Transaction");
const { checkFileType } = require("../../Services/CommonService");

const register = (req, res, next) => {
  const body = req.body;
  let user = {};
  async.series([
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
        where["$or"].push({ email: body.email.toLowerCase() });
      }

      UserService.getUser(where, (err, data) => {
        if (data) {
          if (body.mobile_no && data.mobile_no === body.mobile_no.toString()) {
            return sendResponse(
              res,
              false,
              HttpCode.UNPROCESSABLE_ENTITY,
              null,
              messages.AUTH.MOBILE_NO_EXIST
            );
          } else if (body.email && data.email === body.email) {
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
        // delete body.image;
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
      RoleService.getRoles(
        { code: config.APP_CONSTANTS.DATABASE.USER_ROLES.ADMIN },
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

            body.status = "active";
            body.country = JSON.parse(body.country)._id;
            // body.country = JSON.parse(body.country);
            body.state = JSON.parse(body.state)._id;
            // body.state = JSON.parse(body.state);

            // body.mobile_no = random(10);
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
        // $or: [{ email: body.email }, { mobile_no: body.email }],
        $or: [{ email: body.email.toLowerCase() }],
        // where["$or"].push({ email: body.email.toLowerCase() });
      };

      UserService.getUser(where, {}, {}, [], (err, data) => {
        // UserService.getUser(where, {}, {}, [], (err, data) => {
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
          { code: config.APP_CONSTANTS.DATABASE.USER_ROLES.ADMIN },
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
                HttpCode.SERVER_ERROR,
                null,
                messages.AUTH.NOT_ALLOWED
              );
            }

            if (lodash.isEmpty(role_ids)) {
              return sendResponse(
                res,
                false,
                HttpCode.SERVER_ERROR,
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
            { status: user.status },
            messages.AUTH.ACCOUNT_DEACTIVATED
          );
        }
        next();
      });
    },
    (next) => {
      const data = {
        user_id: user._id,
        user: user,
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
        HttpCode.OK,
        data,
        messages.AUTH.LOGIN_SUCCESS
      );
    },
  ]);
};

const getLogginUserData = (req, res, next) => {
  const body = req.body;
  async.series([
    (next) => {
      const user_id = req?.user?.data?.user?._id;

      UserService.getUser(
        { _id: user_id },
        [
          "status",
          "_id",
          "first_name",
          "last_name",
          "mobile_no",
          "country",
          "state",
          "email",
          "image",
        ],
        (err, data) => {
          if (err) {
            return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
          }
          const data1 = data?._doc;

          if (data1 != undefined) {
            data1.newStatus = data1.status;
            if (data1.image) {
              data1.image = fullUrl(req) + "/user/" + data1.image;
            } else {
              data1.image = null;
            }
          }

          return sendResponse(
            res,
            true,
            HttpCode.OK,
            data1,
            messages.CRUD.RETRIEVED("User")
          );
        }
      );
    },
  ]);
};

const logout = (req, res, next) => {
  let token = req.headers.authorization;
  jwt.sign(token, "secret", { expiresIn: 1 }, (logout, err) => {
    if (logout) {
      return sendResponse(
        res,
        true,
        HttpCode.OK,
        "",
        messages.AUTH.LOGOUT_SUCCESS
      );
    } else {
      return sendResponse(
        res,
        false,
        HttpCode.UNPROCESSABLE_ENTITY,
        null,
        messages.SOMETHING_WRONG
      );
    }
  });
};

const analytics = async (req, res) => {
  // const totalOrder = OrderService.countOrder({}, function (err, data) {
  // });
  // var start = moment().startOf("day");
  // var end = moment(start).endOf("day");

  // var start = moment().startOf("day");
  // var end = moment(start).endOf("day");
  const end = moment();
  // const next = moment().subtract(1, "days");
  // const today = moment().format;
  const start = moment(end).subtract(30, "days");

  const momentDate = moment.utc(new Date());

  const startOfDay = momentDate.clone().startOf("day");
  const endOfDay = momentDate.clone().endOf("day");

  const todayOrder = [];

  await Order.aggregate([{ $group: { _id: null, total: { $sum: 1 } } }]).then(
    (res) => {
      if (res.length != 0) {
        todayOrder.push({ totalOrder: res[0].total });
      } else {
        todayOrder.push({ totalOrder: 0 });
      }
    }
  );

  await Transaction.aggregate([
    {
      $match: {
        created_at: {
          $gte: new Date(startOfDay),
          $lte: new Date(endOfDay),
        },
        status: {$ne: "failed"}
      },
    },
    { $group: { _id: null, amount: { $sum: "$amount" } } },
  ]).then((res) => {
    if (res.length != 0) {
      todayOrder.push({ todayOrderRevenue: res[0].amount });
    } else {
      todayOrder.push({ todayOrderRevenue: 0 });
    }
  });

  await Transaction.aggregate([
    {
      $match: {
        created_at: {
          $gte: new Date(start),
          $lte: new Date(end),
        },
        status: {$ne: "failed"}
      },
    },
    { $group: { _id: null, amount: { $sum: "$amount" } } },
  ]).then((res) => {
    if (res.length != 0) {
      todayOrder.push({ totalOrderRevenue: res[0].amount });
    } else {
      todayOrder.push({ totalOrderRevenue: 0 });
    }
  });

  // await Order.aggregate([{ $group: { _id: null, total: { $sum: 1 } } }]).then(
  //   (res) => {
  //     if (res.length != 0) {
  //       todayOrder.push({ totalOrder: res[0].total });
  //     } else {
  //       todayOrder.push({ totalOrder: 0 });
  //     }
  //   }
  // );

  // await Order.aggregate([
  //   {
  //     $match: {
  //       created_at: {
  //         $gte: new Date(start),
  //         $lte: new Date(end),
  //       },
  //     },
  //   },
  //   { $group: { _id: null, total: { $sum: "$total" } } },
  // ]).then((res) => {
  //   if (res.length != 0) {
  //     todayOrder.push({ todayOrderRevenue: res[0].total });
  //   } else {
  //     todayOrder.push({ todayOrderRevenue: 0 });
  //   }
  // });

  // await Order.aggregate([
  //   { $group: { _id: null, total: { $sum: "$total" } } },
  // ]).then((res) => {
  //   if (res.length != 0) {
  //     todayOrder.push({ totalOrderRevenue: res[0].total });
  //   } else {
  //     todayOrder.push({ totalOrderRevenue: 0 });
  //   }
  // });

  return sendResponse(
    res,
    true,
    HttpCode.OK,
    { data: todayOrder },
    messages.CRUD.RETRIEVED("Dashboard count")
  );
};

const blockUser = (req, res) => {
  const body = req.body;

  let user = {};
  async.series([
    (next) => {
      const dataUpdate = {
        status: "inactive",
      };
      UserService.updateUser(
        {
          _id: body.id,
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
            { data },
            "Status changed successfully."
          );
        }
      );
    },
  ]);
};

const unblockUser = (req, res) => {
  const body = req.body;

  let user = {};
  async.series([
    (next) => {
      const dataUpdate = {
        status: "active",
      };
      UserService.updateUser(
        {
          _id: body.id,
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
            { data },
            "Status changed successfully."
          );
        }
      );
    },
  ]);
};

module.exports = {
  register,
  login,
  getLogginUserData,
  logout,
  analytics,
  blockUser,
  unblockUser,
};

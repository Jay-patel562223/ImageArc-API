const { sendResponse } = require("../../Support/APIResponse");
const HttpCode = require("../../Support/HttpCode");
const { UserService, RoleService, CartService, OrderService, TokenService, TransactionService, UserSubscriptionService, WishlistService } = require("../../Services");
const lodash = require("lodash");
const async = require("async");
const messages = require("../../lang/en");
const config = require("../../config/index");
const { createRequest, updateRequest, User } = require("../../Models/User");
const bcrypt = require("bcryptjs");
const sharp = require("sharp");
const path = require("path");
const { paginate } = require("../../config/Paginate");
const { fullUrl } = require("../../utils/getUrl");
const {
  checkFileType,
  capitalizeFirstLetter,
  uploadPhoto,
} = require("../../Services/CommonService");

const index = async (req, res) => {
  const query = req.query;
  let where = {},
    skip = 0,
    page = 1,
    limit = config.APP_CONSTANTS.PAGINATION_SIZE;

  if (query.skip) {
    skip = parseInt(query.skip);
  }

  if (query.limit) {
    limit = parseInt(query.limit);
  }

  if (query.page) {
    page = parseInt(query.page);
  }

  if (!page) {
    page = 1;
  }

  if (!limit) limit = config.APP_CONSTANTS.PAGINATION_SIZE;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const user_id = req?.user?.data?.user_id;

  const column = query.orderBy;
  const sort = query.sortedBy == "asc" ? 1 : -1;
  const searchNew =
    query.search != undefined && query.search != ""
      ? query.search.split(":")
      : "";
  const key = searchNew[0];
  let val = searchNew[1];
  val = val != undefined ? val.trim().toLowerCase() : val;
  let queryNew = {};
  if (val != undefined) {
    queryNew = {
      $or: [
        { [key]: new RegExp(`.*${val}.*`) },
        { first_name: new RegExp(`.*${val.toLowerCase()}.*`) },
        { first_name: new RegExp(`.*${val.toUpperCase()}.*`) },
        { first_name: new RegExp(`.*${capitalizeFirstLetter(val)}.*`) },
        { email: new RegExp(`.*${val.toLowerCase()}.*`) },
        { email: new RegExp(`.*${val.toUpperCase()}.*`) },
        { email: new RegExp(`.*${capitalizeFirstLetter(val)}.*`) },
        { status: new RegExp(`.*${val.toLowerCase()}.*`) },
        { status: new RegExp(`.*${val.toUpperCase()}.*`) },
        { status: new RegExp(`.*${capitalizeFirstLetter(val)}.*`) },
      ],
      _id: { $ne: user_id },
    };
  }
  const search =
    query.search != undefined && query.search != ""
      ? queryNew
      : { _id: { $ne: user_id } };

  User.find(
    search,
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
    {
      /*skip, limit*/
    }
  )
    .populate({
      path: "role_ids",
      // match: { code: "USER" },
    })
    .sort({ [column]: sort })
    // .skip(skip)
    // .limit(limit)
    // .sort({ _id: -1 })
    .exec((err, data) => {
      if (data != undefined) {
        const results = data.slice(startIndex, endIndex);
        const url = `/products?limit=${limit}`;

        return sendResponse(
          res,
          true,
          HttpCode.OK,
          {
            data: results,
            ...paginate(data.length, page, limit, results.length, url),
            // data,
            // limit,
            // skip,
          },
          messages.CRUD.RETRIEVED("Users")
        );
      }
      return sendResponse(
        res,
        true,
        HttpCode.OK,
        {
          data: [],
        },
        messages.CRUD.RETRIEVED("Users")
      );
    });
};

const create = (req, res) => {
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
        where["$or"].push({ email: body.email });
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
              return sendResponse(
                res,
                true,
                HttpCode.CREATED,
                data,
                messages.CRUD.CREATED("User")
              );
            });
          }
        }
      );
    },
  ]);
};

const show = async (req, res) => {
  const user_id = req.params.user_id;

  UserService.getUser({ _id: user_id }, (err, data) => {
    if (err) {
      return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
    }

    if (data != undefined) {
      if (data.image) {
        data.image = fullUrl(req) + "/user/" + data.image;
      } else {
        data.image = null;
      }
    }

    return sendResponse(
      res,
      true,
      HttpCode.OK,
      {
        data,
      },
      messages.CRUD.RETRIEVED("User")
    );
  });
};

const update = (req, res) => {
  const body = req.body;
  const user_id = req.params.user_id;
  delete body.password;

  async.series([
    (next) => {
      let { error } = updateRequest(body);
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
      next();
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
              messages.VALID_FILE
            );
          }

          var base_path = __basedir;
          // const filename = path.join(
          //   base_path,
          //   "/public/user/" + file.originalname
          // );

          // sharp(file.buffer)
          //   .resize(250, 180)
          //   // .jpeg({ quality: 80 })
          //   .toFile(filename);
          const name = uploadPhoto(user_id, file);

          body.image = name;
          // body.image = file.originalname;
        }
      } else {
        delete body.image;
      }

      next();
    },
    (next) => {
      body.country = JSON.parse(body.country)._id;
      // body.country = JSON.parse(body.country);
      body.state = JSON.parse(body.state)._id;
      // body.state = JSON.parse(body.state);

      UserService.updateUser(
        {
          _id: user_id,
        },
        body,
        (err, data) => {
          if (err) {
            return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
          }
          if (!data) {
            return sendResponse(
              res,
              false,
              HttpCode.NOT_FOUND,
              {
                data,
              },
              "You can't edit this user."
            );
          } else {
            return sendResponse(
              res,
              true,
              HttpCode.OK,
              {
                data,
              },
              messages.CRUD.UPDATED("User")
            );
          }
        }
      );
    },
  ]);
};

const destroy = (req, res) => {
  const body = req.body;
  const user_id = req.params.user_id;

  if (!user_id) {
    return sendResponse(
      res,
      false,
      HttpCode.SERVER_ERROR,
      null,
      "Request is not valid."
    );
  }
  async.waterfall([
    (cb) => {
      UserService.deleteUser(
        {
          _id: user_id,
        },
        (err, data) => {
          if (err) {
            return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
          }
          if (!data) {
            return sendResponse(
              res,
              false,
              HttpCode.NOT_FOUND,
              {
                data,
              },
              "You can't delete this user."
            );
          } else {
            CartService.deleteManyCart(
              {
                user_id: user_id
              },
              async (err, data)=>{
                if (err) {
                  return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
                }
              }
            )
            OrderService.deleteManyOrder(
              {
                user_id: user_id
              },
              async (err, data)=>{
                if (err) {
                  return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
                }
              }
            )
            TokenService.deleteManyToken(
              {
                user_id: user_id
              },
              async (err, data)=>{
                if (err) {
                  return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
                }
              }
            )
            TransactionService.deleteManyTransaction(
              {
                user_id: user_id
              },
              async (err, data)=>{
                if (err) {
                  return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
                }
              }
            )
            UserSubscriptionService.deleteManyUserSubscription(
              {
                user_id: user_id
              },
              async (err, data)=>{
                if (err) {
                  return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
                }
              }
            )
            WishlistService.deleteManyWishlist(
              {
                user_id: user_id
              },
              async (err, data)=>{
                if (err) {
                  return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
                }
              }
            )
            return sendResponse(
              res,
              true,
              HttpCode.OK,
              {
                data,
              },
              messages.CRUD.DELETED("User")
            );
          }
        }
      );
    },
  ]);
};

module.exports = {
  index: index,
  create: create,
  show: show,
  update: update,
  destroy: destroy,
};

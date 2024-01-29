const { sendResponse } = require("../../Support/APIResponse");
const HttpCode = require("../../Support/HttpCode");
const { PackageTypeService } = require("../../Services");
const async = require("async");
const messages = require("../../lang/en");
const config = require("../../config/index");
const { createRequest, PackageType } = require("../../Models/PackageType");
const sharp = require("sharp");
const path = require("path");
const { fullUrl } = require("../../utils/getUrl");
const { paginate } = require("../../config/Paginate");
const { capitalizeFirstLetter } = require("../../Services/CommonService");
const { SubscriptionPackage } = require("../../Models/SubscriptionPackage");
const { UserSubscription } = require("../../Models/UserSubscription");

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

  const column = query.orderBy;
  const sort = query.sortedBy == "asc" ? 1 : -1;
  const searchNew =
    query.search != undefined && query.search != ""
      ? query.search.split(":")
      : "";
  const key = searchNew[0];
  let val = searchNew[1];
  val = val != undefined ? val.trim() : val;
  let queryNew = {};
  if (val != undefined) {
    queryNew = {
      $or: [
        { name: new RegExp(`.*${val.toLowerCase()}.*`) },
        { name: new RegExp(`.*${val.toUpperCase()}.*`) },
        { name: new RegExp(`.*${capitalizeFirstLetter(val)}.*`) },
        { status: new RegExp(`.*${val.toLowerCase()}.*`) },
        { status: new RegExp(`.*${val.toUpperCase()}.*`) },
        { status: new RegExp(`.*${capitalizeFirstLetter(val)}.*`) },
        // { name: new RegExp(`.*${val}.*`) },
        // { status: new RegExp(`.*${val}.*`) },
      ],
    };
  }
  const search =
    query.search != undefined && query.search != "" ? queryNew : {};

  PackageType.find(search, ["status", "_id", "name"], {
    /*skip, limit*/
  })
    .sort({ [column]: sort })
    // .skip(skip)
    // .limit(limit)
    // .sort({ _id: -1 })
    .exec((err, data) => {
      if (data != undefined) {
        const results = data.slice(startIndex, endIndex);
        const url = `/package-type?limit=${limit}`;

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
          messages.CRUD.RETRIEVED("Package Type")
        );
      }
      return sendResponse(
        res,
        true,
        HttpCode.OK,
        {
          data: [],
        },
        messages.CRUD.RETRIEVED("Package Type")
      );
    });
};

const create = (req, res) => {
  const body = req.body;
  async.series([
    (next) => {
      body.name = body.name.trim();
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
      if (body.description == "undefined") {
        return sendResponse(
          res,
          false,
          HttpCode.UNPROCESSABLE_ENTITY,
          null,
          "Description is required."
        );
      }

      // if (!["jpg", "png", "tif"].includes(body.name.toLowerCase())) {
      //   return sendResponse(
      //     res,
      //     false,
      //     HttpCode.UNPROCESSABLE_ENTITY,
      //     null,
      //     "Only jpg, png, tif file is allowed."
      //   );
      // }

      next();
    },
    (next) => {
      const regex = new RegExp(["^", body.name, "$"].join(""), "i");
      PackageTypeService.getPackageType({ name: regex }, (err, data) => {
        if (data) {
          return sendResponse(
            res,
            false,
            HttpCode.SERVER_ERROR,
            null,
            "Package Type already exist!"
          );
        }

        // body.status = "active";
        PackageTypeService.createPackageType(body, (err, data) => {
          if (err) {
            return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
          }
          return sendResponse(
            res,
            true,
            HttpCode.OK,
            {
              data,
            },
            messages.CRUD.CREATED("Package Type")
          );
        });
      });
    },
  ]);
};

const show = async (req, res) => {
  const package_type_id = req.params.package_type_id;

  PackageTypeService.getPackageType(
    { _id: package_type_id },
    ["status", "_id", "name", "description"],
    (err, data) => {
      if (err) {
        return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
      }

      return sendResponse(
        res,
        true,
        HttpCode.OK,
        { data },
        messages.CRUD.RETRIEVED("Package Type")
      );
    }
  );
};

const update = (req, res) => {
  const body = req.body;
  const package_type_id = req.params.package_type_id;
  body.name = body.name.trim();

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
      if (body.description == "undefined") {
        return sendResponse(
          res,
          false,
          HttpCode.UNPROCESSABLE_ENTITY,
          null,
          "Description is required."
        );
      }
      // if (!["jpg", "png", "tif"].includes(body.name.toLowerCase())) {
      //   return sendResponse(
      //     res,
      //     false,
      //     HttpCode.UNPROCESSABLE_ENTITY,
      //     null,
      //     "Only jpg, png, tif file is allowed."
      //   );
      // }
      next();
    },
    (next) => {
      if (body.status == "active") {
        next();
      } else {
        SubscriptionPackage.findOne(
          { package_type: package_type_id, status: "active" },
          ["_id"],
          {}
        ).exec(async (err, data) => {
          if (err) {
            return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
          }

          if (data) {
            return sendResponse(
              res,
              false,
              HttpCode.UNPROCESSABLE_ENTITY,
              null,
              "You can't inactive this package type because currently using in subscription package"
            );
          }
          next();
        });
      }
    },
    (next) => {
      PackageTypeService.updatePackageType(
        {
          _id: package_type_id,
        },
        body,
        (err, data) => {
          data = {};
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
              "You can't edit this Package Type."
            );
          } else {
            return sendResponse(
              res,
              true,
              HttpCode.OK,
              {
                data,
              },
              messages.CRUD.UPDATED("Package Type")
            );
          }
        }
      );
    },
  ]);
};

const destroy = (req, res) => {
  const body = req.body;
  const package_type_id = req.params.package_type_id;

  async.series([
    (next) => {
      if (!package_type_id) {
        return sendResponse(
          res,
          false,
          HttpCode.SERVER_ERROR,
          null,
          "Request is not valid."
        );
      }
      next();
    },
    (next) => {
      SubscriptionPackage.findOne(
        { package_type: package_type_id, status: "active" },
        ["_id"],
        {}
      ).exec(async (err, data) => {
        if (err) {
          return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
        }

        if (data) {
          return sendResponse(
            res,
            false,
            HttpCode.UNPROCESSABLE_ENTITY,
            null,
            "You can't delete this package type because currently using in subscription package"
          );
        }
        next();
      });
    },
    (next) => {
      SubscriptionPackage.find(
        { package_type: package_type_id },
        ["_id"],
        {}
      ).exec(async (err, data) => {
        if (err) {
          return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
        }

        const ids = await filterType(data);
        console.log("dataids: ", ids);

        UserSubscription.findOne(
          { package_id: { $in: ids } },
          ["_id"],
          {}
        ).exec(async (err, data) => {
          if (err) {
            return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
          }

          if (data) {
            return sendResponse(
              res,
              false,
              HttpCode.UNPROCESSABLE_ENTITY,
              null,
              "You can't delete this package type because it's purchased by user"
            );
          }
          next();
        });
      });
    },
    (next) => {
      // async.waterfall([
      //   (cb) => {
      PackageTypeService.deletePackageType(
        {
          _id: package_type_id,
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
              "You can't delete this package type."
            );
          } else {
            return sendResponse(
              res,
              true,
              HttpCode.OK,
              {
                data,
              },
              messages.CRUD.DELETED("Package Type")
            );
          }
        }
      );
    },

    //   },
    // ]);
  ]);
};

const filterType = async (data) => {
  const finalData = data.map((res) => {
    return res._id;
  });
  return finalData;
};

module.exports = {
  index: index,
  create: create,
  show: show,
  update: update,
  destroy: destroy,
};

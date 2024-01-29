const { sendResponse } = require("../../Support/APIResponse");
const HttpCode = require("../../Support/HttpCode");
const { SubscriptionPackageService } = require("../../Services");
const async = require("async");
const messages = require("../../lang/en");
const config = require("../../config/index");
const {
  createRequest,
  SubscriptionPackage,
} = require("../../Models/SubscriptionPackage");
const sharp = require("sharp");
const path = require("path");
const { fullUrl } = require("../../utils/getUrl");
const { paginate } = require("../../config/Paginate");
const {
  capitalizeFirstLetter,
  capitalizeNewFirstLetter,
} = require("../../Services/CommonService");

const index = async (req, res) => {
  // db.collection("SubscriptionPackage")
  //   .aggregate([

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
  let anotherQuery = {};
  let subquery = {};
  let search = {};
  if (val != undefined) {
    if (val != "") {
      if (Number(val) == val) {
        queryNew = {
          $or: [{ qnty: val }],
        };
      } else {
        queryNew = {
          $or: [
            { "file_type_data.name": new RegExp(`.*${val.toLowerCase()}.*`) },
            { "file_type_data.name": new RegExp(`.*${val.toUpperCase()}.*`) },
            {
              "file_type_data.name": new RegExp(
                `.*${capitalizeFirstLetter(val)}.*`
              ),
            },
            { "package_data.name": new RegExp(`.*${val.toLowerCase()}.*`) },
            { "package_data.name": new RegExp(`.*${val.toUpperCase()}.*`) },
            {
              "package_data.name": new RegExp(
                `.*${capitalizeNewFirstLetter(val)}.*`
              ),
            },
            { status: new RegExp(`.*${val.toLowerCase()}.*`) },
            { status: new RegExp(`.*${val.toUpperCase()}.*`) },
            { status: new RegExp(`.*${capitalizeFirstLetter(val)}.*`) },
          ],
        };
      }
    } else {
      queryNew = {};
    }

    // if(val != ""){
    //   subquery = {
    //     $or:[
    //       { name: new RegExp(`.*${val.toLowerCase()}.*`) },
    //       { name: new RegExp(`.*${val.toUpperCase()}.*`) },
    //       {
    //         name: new RegExp(
    //           `.*${capitalizeNewFirstLetter(val)}.*`
    //         ),
    //       },
    //     ]
    //   }
    // }

    search = query.search != undefined && query.search != "" ? queryNew : {};
  }

  await SubscriptionPackage.aggregate([
    {
      $set: {
        package_type: { $toObjectId: "$package_type" },
        file_type: { $toObjectId: "$file_type" },
      },
    },
    {
      $lookup: {
        from: "packagetypes",
        localField: "package_type",
        foreignField: "_id",
        as: "package_data",
      },
    },
    {
      $unwind: "$package_data",
    },
    {
      $lookup: {
        from: "productprices",
        localField: "file_type",
        foreignField: "_id",
        as: "file_type_data",
      },
    },
    {
      $unwind: "$file_type_data",
    },
    {
      $project: {
        _id: 1,
        status: 1,
        _id: 1,
        qnty: 1,
        price: 1,
        "package_data._id": 1,
        "package_data.name": 1,
        "file_type_data._id": 1,
        "file_type_data.name": 1,
      },
    },
    { $match: search },
  ])
    .then((response) => {
      if (response != undefined) {
        const results = response.slice(startIndex, endIndex);
        const url = `/subscription?limit=${limit}`;

        return sendResponse(
          res,
          true,
          HttpCode.OK,
          {
            data: results,
            ...paginate(response.length, page, limit, results.length, url),
            // data,
            // limit,
            // skip,
          },
          messages.CRUD.RETRIEVED("Subscription Package")
        );
      }
      return sendResponse(
        res,
        true,
        HttpCode.OK,
        {
          data: [],
        },
        messages.CRUD.RETRIEVED("Subscription Package")
      );
    })
    .catch((err) => {
      console.log("err: ", err);
    });
  //
  // process.exit();

  // SubscriptionPackage.find(
  //   // {},
  //   search,
  //   ["status", "_id", "file_type", "qnty", "price", "package_type"],
  //   {
  //     /*skip, limit*/
  //   }
  // )
  //   // .populate({
  //   //   path: 'package_type',
  //   //   match: subquery,
  //   //   select:"_id name"
  //   // })
  //   .populate("package_type", "_id name")
  //   .populate("file_type", "_id name")
  //   .sort({ [column]: sort })
  //   // .skip(skip)
  //   // .limit(limit)
  //   // .sort({ _id: -1 })
  //   .exec((err, data) => {
  //     if (data != undefined) {
  //       const results = data.slice(startIndex, endIndex);
  //       const url = `/subscription?limit=${limit}`;

  //       return sendResponse(
  //         res,
  //         true,
  //         HttpCode.OK,
  //         {
  //           data: results,
  //           ...paginate(data.length, page, limit, results.length, url),
  //           // data,
  //           // limit,
  //           // skip,
  //         },
  //         messages.CRUD.RETRIEVED("Subscription Package")
  //       );
  //     }
  //     return sendResponse(
  //       res,
  //       true,
  //       HttpCode.OK,
  //       {
  //         data: [],
  //       },
  //       messages.CRUD.RETRIEVED("Subscription Package")
  //     );
  //   });
};

const create = (req, res) => {
  const body = req.body;
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
      if (body.package_type == "") {
        return sendResponse(
          res,
          false,
          HttpCode.UNPROCESSABLE_ENTITY,
          null,
          "Package Type is required."
        );
      }
      if (Number(body.price) < 0) {
        return sendResponse(
          res,
          false,
          HttpCode.UNPROCESSABLE_ENTITY,
          null,
          "Price should be greater than 0."
        );
      }
      if (Number(body.qnty) < 0) {
        return sendResponse(
          res,
          false,
          HttpCode.UNPROCESSABLE_ENTITY,
          null,
          "Quantity should be greater than 0."
        );
      }
      next();
    },
    (next) => {
      const regex = new RegExp(
        ["^", body?.package_type?.name, "$"].join(""),
        "i"
      );
      SubscriptionPackageService.getSubscriptionPackage(
        { package_type: body?.package_type?._id, file_type: body?.file_type },
        (err, data) => {
          if (data != null) {
            if (
              data?.package_type?._id == body?.package_type?._id &&
              data?.file_type?._id == body?.file_type
            ) {
              return sendResponse(
                res,
                false,
                HttpCode.SERVER_ERROR,
                null,
                "Subscription Package already exist!"
              );
            }
          }

          // if (
          //   body.file_type.match(/\.(jpg|jpeg)$/i) &&
          //   body.file_type.match(/\.(jpg|jpeg)$/i)
          // )

          // body.status = "active";
          SubscriptionPackageService.createSubscriptionPackage(
            body,
            (err, data) => {
              if (err) {
                return sendResponse(
                  res,
                  false,
                  HttpCode.SERVER_ERROR,
                  null,
                  err
                );
              }
              return sendResponse(
                res,
                true,
                HttpCode.OK,
                {
                  data,
                },
                messages.CRUD.CREATED("Subscription Package")
              );
            }
          );
        }
      );
    },
  ]);
};

const show = async (req, res) => {
  const id = req.params.id;

  SubscriptionPackageService.getSubscriptionPackage(
    { _id: id },
    [
      "status",
      "_id",
      // "file_type",
      // "file_type_new",
      "qnty",
      "price",
      // "package_type._id",
      // "package_type.name",
    ],
    (err, data) => {
      if (err) {
        return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
      }

      return sendResponse(
        res,
        true,
        HttpCode.OK,
        { data },
        messages.CRUD.RETRIEVED("Subscription Package")
      );
    }
  );
};

const update = (req, res) => {
  const body = req.body;
  const id = req.params.id;

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
      if (Number(body.price) < 0) {
        return sendResponse(
          res,
          false,
          HttpCode.UNPROCESSABLE_ENTITY,
          null,
          "Price should be greater than 0."
        );
      }
      if (Number(body.qnty) < 0) {
        return sendResponse(
          res,
          false,
          HttpCode.UNPROCESSABLE_ENTITY,
          null,
          "Quantity should be greater than 0."
        );
      }
      next();
    },
    (next) => {
      SubscriptionPackageService.updateSubscriptionPackage(
        {
          _id: id,
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
              "You can't edit this Subscription Package."
            );
          } else {
            return sendResponse(
              res,
              true,
              HttpCode.OK,
              {
                data,
              },
              messages.CRUD.UPDATED("Subscription Package")
            );
          }
        }
      );
    },
  ]);
};

const destroy = (req, res) => {
  const body = req.body;
  const id = req.params.id;

  if (!id) {
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
      SubscriptionPackageService.deleteSubscriptionPackage(
        {
          _id: id,
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
              "You can't delete this subscription package."
            );
          } else {
            return sendResponse(
              res,
              true,
              HttpCode.OK,
              {
                data,
              },
              messages.CRUD.DELETED("Subscription Package")
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

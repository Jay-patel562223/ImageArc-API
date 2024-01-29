const { sendResponse } = require("../../Support/APIResponse");
const HttpCode = require("../../Support/HttpCode");
const { UserSubscriptionService } = require("../../Services");
const async = require("async");
const messages = require("../../lang/en");
const config = require("../../config/index");
const {
  createRequest,
  UserSubscription,
  checkCountRequest,
} = require("../../Models/UserSubscription");
const sharp = require("sharp");
const path = require("path");
const { fullUrl } = require("../../utils/getUrl");
const { paginate } = require("../../config/Paginate");
const moment = require("moment");

const userSubscription = (req, res) => {
  const query = req.query;
  const user_id = req?.user?.data?.user_id;

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

  UserSubscription.find(
    { user_id: user_id },
    [
      "_id",
      "user_id",
      // "file_type",
      "qnty",
      "price",
      "created_at",
      "unique_id",
      "package_id",
      "payment_method",
      "status",
      "available_qnty",
      "used_qnty",
    ],
    {}
  )
    // .populate("package_id", "_id package_type._id package_type.name")
    .populate("file_type", "name")
    .populate({
      path: "package_id",
      select: "_id file_type qnty price ",
      // select: "_id file_type qnty price package_type._id package_type.name",
      populate: {
        path: "package_type",
        model: "PackageType",
        select: "_id name",
      },
    })
    .sort({ created_at: -1 })
    .lean()
    .exec(async (err, data) => {
      if (err) {
        return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
      }

      if (data != undefined) {
        data = await filterUserNew(data);
      }

      const results = data.slice(startIndex, endIndex);
      const url = `/subscription?limit=${limit}`;

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
    });
};

async function filterUserNew(data, req, user_id) {
  let finalData;
  const result = {};

  if (data != null || data != undefined) {
    finalData = data.map(async (res) => {
      res.tax = 0;
      res.total = res.price;
      res.created_at_new = res.created_at != undefined ? res.created_at : "";
      res.created_at =
        res.created_at != undefined
          ? moment(res.created_at).format("DD/MM/YYYY h:mma")
          : res.created_at;
      return res;
    });
    const newLof = await Promise.all(finalData);
    finalData = newLof;
  } else {
    finalData = [];
  }

  return finalData;
}

const getLoggedInUserSubscription = (req, res) => {
  let body = req.body;
  body.file_type = req.params.slug;
  async.series([
    (next) => {
      let { error } = checkCountRequest(body);
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
      const user_id = req?.user?.data?.user_id;
      // const slug = req.params.slug;
      const slugData = body.file_type.split(",");
      // const slugData = JSON.parse(slug);
      let newArr = [];
      newArr.push(...slugData);
      if (slugData.includes("jpg")) {
        newArr.push("jpeg");
      } else if (slugData.includes("jpeg")) {
        newArr.push("jpg");
      }

      UserSubscription.aggregate([
        {
          $set: {
            package_id: { $toObjectId: "$package_id" },
            file_type: { $toObjectId: "$file_type" },
          },
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
          $lookup: {
            from: "subscriptionpackages",
            localField: "package_id",
            foreignField: "_id",
            as: "package_id_data",
          },
        },
        {
          $unwind: "$package_id_data",
        },
        {
          $project: {
            user_id: 1,
            status: 1,
            used_qnty: 1,
            available_qnty: 1,
            _id: 1,
            file_type: 1,
            payment_method: 1,
            "file_type_data.name": 1,
            // "package_data._id": 1,
            // "package_data.name": 1,
            // "file_type_data._id": 1,
            // "file_type_data.name": 1,
          },
        },
        {
          $match: {
            // $and: [
            user_id: user_id,
            status: "active",
            "file_type_data.name": { $in: newArr },
            // ],
          },
        },
      ])
        .then(async (response) => {
          if (response != undefined) {
            response = await filterData(response);
            return sendResponse(
              res,
              true,
              HttpCode.OK,
              {
                data: response,
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
            messages.CRUD.RETRIEVED("Subscription Package")
          );
        })
        .catch((err) => {
          console.log("err: ", err);
          return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
        });

      // UserSubscription.find(
      //   {
      //     user_id: user_id,
      //     status: "active",
      //     // file_type: { $in: newArr },
      //     // available_qnty: { $gte: slugData.length },
      //     // "file_type.name": { $in: newArr },
      //   },
      //   ["used_qnty", "available_qnty", "_id", "file_type", "payment_method"],
      //   {}
      // )
      //   .populate({
      //     // $elemMatch: { id: id1 },
      //     path: "file_type",
      //     match: { name: { $in: newArr } },
      //     select: "name",
      //   })
      //   // .populate("file_type")
      //   .populate("package_id")
      //   .sort({ _id: -1 })
      //   .exec((err, data) => {
      //     if (err) {
      //       return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
      //     }
      //     console.log("data: ", data);
      //     return sendResponse(
      //       res,
      //       true,
      //       HttpCode.OK,
      //       {
      //         data,
      //         // limit,
      //         // skip,
      //       },
      //       messages.CRUD.RETRIEVED("Package Type")
      //     );
      //   });
    },
  ]);
  // const user_id = req?.user?.data?.user_id;
  // const slug = req.params.slug;
  // const slugData = JSON.parse(slug);
  // let newArr = [];
  // newArr.push(...slugData);
  // if (slugData.includes("jpg")) {
  //   newArr.push("jpeg");
  // } else if (slugData.includes("jpeg")) {
  //   newArr.push("jpg");
  // }

  // UserSubscription.findOne(
  //   {
  //     user_id: user_id,
  //     file_type: { $in: newArr },
  //     available_qnty: { $gte: slugData.length },
  //   },
  //   ["used_qnty", "available_qnty", "_id", "file_type"],
  //   {}
  // )
  //   .populate("package_id")
  //   .sort({ _id: -1 })
  //   .exec((err, data) => {
  //     if (err) {
  //       return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
  //     }
  //     return sendResponse(
  //       res,
  //       true,
  //       HttpCode.OK,
  //       {
  //         data,
  //         // limit,
  //         // skip,
  //       },
  //       messages.CRUD.RETRIEVED("Package Type")
  //     );
  //   });
};

const filterData = async (response) => {
  response = await response.map(async (data) => {
    data.file_type = data.file_type_data;
    return data;
  });
  return Promise.all(response);
};

const getLoggedInUserSubscriptionNew = (req, res) => {
  const body = req.body;
  async.series([
    (next) => {
      let { error } = checkCountRequest(body);
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
      const user_id = req?.user?.data?.user_id;
      // const slug = req.params.slug;
      let slugData = body.file_type.toLowerCase();
      slugData = slugData.split(",");
      // const slugData = body.file_type.split(",");
      // const slugData = JSON.parse(slug);
      let newArr = [];
      newArr.push(...slugData);
      if (slugData.includes("jpg")) {
        newArr.push("jpeg");
      } else if (slugData.includes("jpeg")) {
        newArr.push("jpg");
      }

      UserSubscription.find(
        {
          user_id: user_id,
          file_type: { $in: newArr },
          // available_qnty: { $gte: slugData.length },
        },
        ["used_qnty", "available_qnty", "_id", "file_type"],
        {}
      )
        .populate("package_id")
        .sort({ _id: -1 })
        .exec((err, data) => {
          if (err) {
            return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
          }
          return sendResponse(
            res,
            true,
            HttpCode.OK,
            {
              data,
              // limit,
              // skip,
            },
            messages.CRUD.RETRIEVED("Package Type")
          );
        });
    },
  ]);
};

const getUserSubscription = (req, res) => {
  const id = req.params.id;

  UserSubscription.findOne(
    { _id: id },
    [
      "_id",
      "user_id",
      "file_type",
      "qnty",
      "price",
      "created_at",
      "unique_id",
      "payment_method",
      "status",
      "available_qnty",
      "used_qnty",
    ],
    {}
  )
    // .populate("package_id")
    // .populate(
    //   "package_id",
    //   "_id file_type qnty price package_type._id package_type.name"
    // )
    .populate("file_type", "_id name")
    .populate({
      path: "package_id",
      select: "_id file_type qnty price ",
      // select: "_id file_type qnty price package_type._id package_type.name",
      populate: {
        path: "package_type",
        model: "PackageType",
        select: "_id name",
      },
    })
    .sort({ _id: -1 })
    .lean()
    .exec((err, data) => {
      if (err) {
        return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
      }

      if (data != null) {
        data.tax = 0;
        data.total = data.price;
        data.created_at_new = data.created_at;
        data.created_at = moment(data.created_at).format("DD/MM/YYYY h:mma");
      }
      // const results = data.slice(startIndex, endIndex);
      // const url = `/subscription?limit=${limit}`;

      return sendResponse(
        res,
        true,
        HttpCode.OK,
        { data },
        messages.CRUD.RETRIEVED("Package Type")
      );
    });
};

const getUserAllSubscription = (req, res) => {
  // const id = req.params.id;
  const user_id = req?.user?.data?.user_id;
  UserSubscription.find(
    { user_id: user_id },
    [
      "used_qnty",
      "available_qnty",
      "_id",
      "user_id",
      "package_id",
      "file_type",
      "price",
      "unique_id",
      "created_at",
      "payment_method",
    ],
    // ["_id", "file_type", "package_id"],
    {}
  )
    .sort({ created_at: -1 })
    // .populate(
    //   "package_id",
    //   "_id file_type qnty price package_type._id package_type.name"
    // )
    .populate({
      path: "package_id",
      select: "_id file_type qnty price ",
      // select: "_id file_type qnty price package_type._id package_type.name",
      populate: {
        path: "package_type",
        model: "PackageType",
        select: "_id name",
      },
    })
    .lean()
    .exec(async (err, data) => {
      if (err) {
        return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
      }

      if (data != undefined) {
        data = await filterUserNew(data);
      }

      return sendResponse(
        res,
        true,
        HttpCode.OK,
        { data },
        messages.CRUD.RETRIEVED("Package Type")
      );
    });
};

const create = (req, res) => {
  const body = req.body;
  async.series([
    // (next) => {
    //   let { error } = createRequest(body);
    //   if (error) {
    //     return sendResponse(
    //       res,
    //       false,
    //       HttpCode.UNPROCESSABLE_ENTITY,
    //       null,
    //       error
    //     );
    //   }
    //   if (body.description == "undefined") {
    //     return sendResponse(
    //       res,
    //       false,
    //       HttpCode.UNPROCESSABLE_ENTITY,
    //       null,
    //       "Description is required."
    //     );
    //   }
    //   next();
    // },
    (next) => {
      body.status = "active";
      body.available_qnty = body.qnty;
      UserSubscriptionService.createUserSubscription(body, (err, data) => {
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
          messages.CRUD.CREATED("User Subscription")
        );
      });
    },
  ]);
};

const deleteUserSubscription = (req, res) => {
  const id = req.params.id;

  UserSubscriptionService.deleteUserSubscription(
    {
      _id: id,
    },
    (err, data) => {
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
        messages.CRUD.DELETED("Category")
      );
    }
  );
};

module.exports = {
  create: create,
  userSubscription: userSubscription,
  getLoggedInUserSubscription: getLoggedInUserSubscription,
  getLoggedInUserSubscriptionNew: getLoggedInUserSubscriptionNew,
  getUserSubscription: getUserSubscription,
  getUserAllSubscription: getUserAllSubscription,
  deleteUserSubscription: deleteUserSubscription,
};

const { sendResponse } = require("../../Support/APIResponse");
const HttpCode = require("../../Support/HttpCode");
const {
  SubscriptionPackageService,
  PackageTypeService,
} = require("../../Services");
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
const { PackageType } = require("../../Models/PackageType");
const { UserSubscription } = require("../../Models/UserSubscription");

const index = async (req, res) => {
  const query = req.query;
  const user_id = req?.user?.data?.user_id;

  if (user_id == undefined) {
    SubscriptionPackage.find(
      { status: "active" },
      [
        "_id",
        // "package_type._id",
        // "package_type.name",
        // "file_type",
        "qnty",
        "price",
      ],
      {}
    )
      .populate("package_type", "_id name")
      .populate("file_type", "_id name")
      .lean()
      .sort({ package_type: -1 })
      .exec(async (err, data) => {
        data = await filterUserNew(data);

        return sendResponse(
          res,
          true,
          HttpCode.OK,
          {
            data,
          },
          messages.CRUD.RETRIEVED("Subscription Package")
        );
      });
  } else {
    const arrId = await getAllUserSubscription(user_id);

    let queryNew = { status: "active" };
    if (arrId.length != 0) {
      queryNew = { _id: { $nin: arrId }, status: "active" };
    }

    SubscriptionPackage.find(
      queryNew,
      // { _id: { $nin: arrId }, status: "active" },
      [
        "_id",
        // "package_type._id",
        // "package_type.name",
        // "file_type",
        "qnty",
        "price",
      ],
      {}
    )
      .populate("package_type", "_id name")
      .populate("file_type", "_id name")
      .lean()
      .sort({ package_type: -1 })
      .exec(async (err, data) => {
        data = await filterUserNew(data);
        return sendResponse(
          res,
          true,
          HttpCode.OK,
          {
            data,
          },
          messages.CRUD.RETRIEVED("Subscription Package")
        );
      });
  }
};

async function filterUserNew(data, req, user_id) {
  let finalData;
  const result = {};

  if (data != null || data != undefined) {
    let isLike = 2;
    finalData = data.map(async (res) => {
      res.tax = 0;
      res.total = res.price;
      return res;
    });
    const newLof = await Promise.all(finalData);
    finalData = newLof;
  } else {
    finalData = [];
  }

  return finalData;
}

const getAllUserSubscription = async (user_id) => {
  const results = await UserSubscription.find(
    { user_id: user_id, status: "active" },
    ["_id", "file_type", "package_id"],
    (err, data) => {
      if (err) {
        return null;
        // return null;
      }

      return data;
    }
  );

  const result = results.map((a) => a.package_id);
  return result;
};

const getAllSubscription = async (req, res) => {
  const user_id = req?.user?.data?.user_id;
  const arrId = await getAllUserSubscription(user_id);

  let queryNew = { status: "active" };
  if (arrId.length != 0) {
    queryNew = { _id: { $nin: arrId }, status: "active" };
  }

  const results = await SubscriptionPackage.find(
    queryNew,
    // { _id: { $nin: arrId }, status: "active" },
    [
      // { status: "active" },
      // "package_type._id",
      // "package_type.name",
    ],
    (err, data) => {
      if (err) {
        return null;
      }
      return data;
    }
  )
    .populate("package_type", "_id name")
    .populate("file_type", "_id name");

  const result = results.map((a) => {
    if (a.package_type != null) {
      return a.package_type._id;
    } else {
      return a.package_type;
    }
  });
  const resultData = removeDuplicates(result);

  return resultData;
};

// const getAllUserSubscription = async () => {
//   const results = await SubscriptionPackage.find(
//     { status: "active" },
//     ["package_type._id", "package_type.name"],
//     (err, data) => {
//       if (err) {
//         return null;
//       }
//       return data;
//     }
//   );

//   const result = results.map((a) => a.package_type._id);
//   const resultData = removeDuplicates(result);

//   return resultData;
// };

const removeDuplicates = (arr) => {
  return [...new Set(arr)];
};

const getSubPackageData = (req, res) => {
  const id = req.params.id;

  SubscriptionPackageService.getSubscriptionPackage(
    { _id: id },
    {},
    {},
    [
      "_id",
      // "package_type._id",
      // "package_type.name",
      // "file_type",
      "qnty",
      "price",
    ],
    (err, data) => {
      if (err) {
        return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
      }

      if (data != null) {
        data.tax = 0;
        data.total = data.price;
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

const package = async (req, res) => {
  const query = req.query;
  const allId = await getAllSubscription(req, res);

  let queryNew = { status: "active" };
  if (allId.length != 0) {
    queryNew = { _id: { $in: allId }, status: "active" };
  }

  // PackageType.find(queryNew, [], {})
  PackageType.find(queryNew, ["_id", "name"], {})
    // .sort({ package_type: -1 })
    // .populate("SubscriptionPackage")
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
        },
        messages.CRUD.RETRIEVED("Subscription Package")
      );
    });
};

const getPackages = async (req, res) => {
  const query = req.query;
  const allId = await getAllSubscription(req, res);

  let queryNew = { status: "active" };
  if (allId.length != 0) {
    queryNew = { _id: { $in: allId }, status: "active" };
  }

  PackageType.find(
    queryNew,
    // { _id: { $in: allId }, status: "active" },
    ["_id", "name"],
    {}
  )
    // .sort({ package_type: -1 })
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
        },
        messages.CRUD.RETRIEVED("Subscription Package")
      );
    });
};

module.exports = {
  index: index,
  getSubPackageData: getSubPackageData,
  package: package,
  getPackages: getPackages,
};

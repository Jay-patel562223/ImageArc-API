const { sendResponse } = require("../../Support/APIResponse");
const HttpCode = require("../../Support/HttpCode");
const { ProductPriceService } = require("../../Services");
const async = require("async");
const messages = require("../../lang/en");
const { createRequest, ProductPrice } = require("../../Models/ProductPrice");
const { paginate } = require("../../config/Paginate");
const { fullUrl } = require("../../utils/getUrl");
const config = require("../../config/index");
const { capitalizeFirstLetter } = require("../../Services/CommonService");
const { SubscriptionPackage } = require("../../Models/SubscriptionPackage");

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
  // const val = searchNew[1];
  let val = searchNew[1];
  val = val != undefined ? val.trim() : val;
  let queryNew = {};
  if (val != undefined) {
    queryNew =
      Number(val) == val
        ? { price: val }
        : {
            $or: [
              // { [key]: new RegExp(`.*${val}.*`) },
              { name: new RegExp(`.*${val.toLowerCase()}.*`) },
              { name: new RegExp(`.*${val.toUpperCase()}.*`) },
              { name: new RegExp(`.*${capitalizeFirstLetter(val)}.*`) },
              { status: new RegExp(`.*${val.toLowerCase()}.*`) },
              { status: new RegExp(`.*${val.toUpperCase()}.*`) },
              { status: new RegExp(`.*${capitalizeFirstLetter(val)}.*`) },
            ],
          };
  }
  const search =
    query.search != undefined && query.search != "" ? queryNew : {};

  ProductPrice.find(search, ["price", "status", "_id", "name"], {})
    .populate("dpi", "_id name")
    .sort({ [column]: sort })
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
          },
          messages.CRUD.RETRIEVED("Product price")
        );
      }
      return sendResponse(
        res,
        true,
        HttpCode.OK,
        {
          data: [],
        },
        messages.CRUD.RETRIEVED("Product price")
      );
    });
};

const getAllProductPrice = (req, res) => {
  ProductPrice.find({ status: "active" }, ["_id", "name"], {})
    .populate("dpi", "_id name")
    // .distinct(["_id", "name"])
    // .sort({ created_at: -1 })
    .exec((err, data) => {
      const newData = data.filter(
        (v, i, a) => a.findIndex((v2) => v2.name === v.name) === i
      );
      if (data != undefined) {
        return sendResponse(
          res,
          true,
          HttpCode.OK,
          {
            data: newData,
          },
          messages.CRUD.RETRIEVED("Product price")
        );
      }
      return sendResponse(
        res,
        true,
        HttpCode.OK,
        {
          data: [],
        },
        messages.CRUD.RETRIEVED("Product price")
      );
    });
};

// function capitalizeFirstLetter(str) {
//   str = str.toLowerCase();
//   return str[0].toUpperCase() + str.slice(1);
// }

const create = (req, res) => {
  const body = req.body;
  body.name = body.name.trim();

  // let newArr = [];
  // if (body.name.includes("jpg")) {
  //   newArr.push("jpeg");
  // } else if (body.name.includes("jpeg")) {
  //   newArr.push("jpg");
  // } else {
  //   newArr.push(body.name);
  // }

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
      if (!["jpg", "png", "tif"].includes(body.name.toLowerCase())) {
        return sendResponse(
          res,
          false,
          HttpCode.UNPROCESSABLE_ENTITY,
          null,
          "Only jpg, png, tif name is allowed"
        );
      }
      next();
    },
    (next) => {
      let query = {};
      let errShow = "";
      if (body.name == "jpeg" || body.name == "jpg") {
        query = {
          $or: [
            {
              name: "jpeg",
            },
            {
              name: "jpg",
            },
          ],
          // "dpi.name": body.dpi.name,
          // dpi: body.dpi,
        };
        errShow = "Name already exist!";
        // errShow = "JPEG or JPG name already exist!";
      } else {
        query = {
          name: body.name,
          // "dpi.name": body.dpi.name
          // dpi: body.dpi,
        };
        errShow = "Name already exist!";
      }
      // if (body.name == "jpeg") {
      //   if (data.name == "jpg" && data) {
      //     return sendResponse(
      //       res,
      //       false,
      //       HttpCode.UNPROCESSABLE_ENTITY,
      //       null,
      //       "Name already exist!"
      //     );
      //   }
      // }
      // if (body.name == "jpg") {
      //   if (data.name == "jpeg" && data) {
      //     return sendResponse(
      //       res,
      //       false,
      //       HttpCode.UNPROCESSABLE_ENTITY,
      //       null,
      //       "Name already exist!"
      //     );
      //   }
      // }
      ProductPrice.findOne(query, ["_id"], {})
        // .populate({
        //   path: "dpi",
        //   match: { _id: body.dpi },
        //   // match: { name: body.dpi.name },
        // })
        .exec(async (err, data) => {
          if (err) {
            return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
          }

          if (data) {
            return sendResponse(
              res,
              false,
              HttpCode.UNPROCESSABLE_ENTITY,
              null,
              errShow
            );
          }
          next();
        });

      // ProductPriceService.getProductPrice(
      //   query,
      //   // {
      //   //   ,
      //   //   // $or: [
      //   //   //   { name: body.name.toLowerCase() },
      //   //   //   { name: body.name.toUpperCase() },
      //   //   //   { name: capitalizeFirstLetter(body.name) },
      //   //   // ],
      //   // },
      //   ["_id"],
      //   (err, data) => {
      //     if (err) {
      //       return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
      //     }

      //     if (data) {
      //       return sendResponse(
      //         res,
      //         false,
      //         HttpCode.UNPROCESSABLE_ENTITY,
      //         null,
      //         errShow
      //       );
      //     }

      //     next();
      //   }
      // );
    },
    (next) => {
      body.name = body.name.toLowerCase();
      ProductPriceService.createProductPrice(body, (err, data) => {
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
          messages.CRUD.CREATED("Product price")
        );
      });
    },
  ]);
};

// const getWishlist = async (res, user_id) => {
//   const results = await Wishlist.findOne(
//     { product_id: res._id, user_id: user_id },
//     (err, data) => {
//       if (err) {
//         return null;
//       }

//       return data;
//     }
//   );

//   return results;
// };

// function capitalizeFirstLetter(str) {
//   str = str.toLowerCase();
//   return str[0].toUpperCase() + str.slice(1);
// }

const show = async (req, res) => {
  const id = req.params.id;

  ProductPriceService.getProductPrice(
    { _id: id },
    ["price", "status", "_id", "name", "dpi"],
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
        messages.CRUD.RETRIEVED("Product price")
      );
    }
  );
};

const update = (req, res) => {
  const body = req.body;
  const id = req.params.id;
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
      if (!["jpg", "png", "tif"].includes(body.name.toLowerCase())) {
        return sendResponse(
          res,
          false,
          HttpCode.UNPROCESSABLE_ENTITY,
          null,
          "Only jpg, png, tif name is allowed"
        );
      }
      next();
    },
    (next) => {
      if (body.status == "active") {
        next();
      } else {
        SubscriptionPackage.findOne(
          { file_type: id, status: "active" },
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
              "You can't inactive this product price because currently using in subscription package"
            );
          }
          next();
        });
      }
    },
    (next) => {
      // ProductPriceService.getProductPrice({ _id: id }, (err, data) => {
      ProductPriceService.updateProductPrice(
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
              "You can't edit this page."
            );
          } else {
            return sendResponse(
              res,
              true,
              HttpCode.OK,
              {
                data,
              },
              messages.CRUD.UPDATED("Product price")
            );
          }
        }
      );
      // });
    },
  ]);
};

const destroy = (req, res) => {
  const body = req.body;
  const id = req.params.id;

  async.series([
    (next) => {
      if (!id) {
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
        { file_type: id, status: "active" },
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
            "You can't delete this product price because currently using in subscription package"
          );
        }
        next();
      });
    },
    (next) => {
      // async.waterfall([
      //   (cb) => {
      ProductPriceService.deleteProductPrice(
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
              "You can't delete this product price."
            );
          } else {
            return sendResponse(
              res,
              true,
              HttpCode.OK,
              {
                data,
              },
              messages.CRUD.DELETED("Product price")
            );
          }
        }
      );
      //   },
      // ]);
    },
  ]);
};

module.exports = {
  index: index,
  getAllProductPrice: getAllProductPrice,
  create: create,
  show: show,
  update: update,
  destroy: destroy,
};

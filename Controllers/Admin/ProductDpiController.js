const { sendResponse } = require("../../Support/APIResponse");
const HttpCode = require("../../Support/HttpCode");
const { ProductDpiService } = require("../../Services");
const async = require("async");
const messages = require("../../lang/en");
const { createRequest, ProductDpi } = require("../../Models/ProductDpi");
const { paginate } = require("../../config/Paginate");
const { fullUrl } = require("../../utils/getUrl");
const config = require("../../config/index");
const { capitalizeFirstLetter } = require("../../Services/CommonService");

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

  ProductDpi.find(search, ["price", "status", "_id", "name"], {})
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

const getAllProductDpi = (req, res) => {
  ProductDpi.find({ status: "active" }, ["_id", "name"], {})
    .sort({ created_at: -1 })
    .exec((err, data) => {
      if (data != undefined) {
        return sendResponse(
          res,
          true,
          HttpCode.OK,
          {
            data: data,
          },
          messages.CRUD.RETRIEVED("Product dpi")
        );
      }
      return sendResponse(
        res,
        true,
        HttpCode.OK,
        {
          data: [],
        },
        messages.CRUD.RETRIEVED("Product dpi")
      );
    });
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
        };
        // errShow = "JPEG or JPG name already exist!";
        errShow = "Product price already created with the same DPI";
      } else {
        query = { name: body.name };
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
      ProductDpiService.getProductDpi(
        query,
        // {
        //   ,
        //   // $or: [
        //   //   { name: body.name.toLowerCase() },
        //   //   { name: body.name.toUpperCase() },
        //   //   { name: capitalizeFirstLetter(body.name) },
        //   // ],
        // },
        ["_id"],
        (err, data) => {
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
        }
      );
    },
    (next) => {
      body.name = body.name.toLowerCase();
      ProductDpiService.createProductDpi(body, (err, data) => {
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

// function capitalizeFirstLetter(str) {
//   str = str.toLowerCase();
//   return str[0].toUpperCase() + str.slice(1);
// }

const show = async (req, res) => {
  const id = req.params.id;

  ProductDpiService.getProductDpi(
    { _id: id },
    ["price", "status", "_id", "name"],
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
      next();
    },
    (next) => {
      // ProductDpiService.getProductDpi({ _id: id }, (err, data) => {
      ProductDpiService.updateProductDpi(
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
      ProductDpiService.deleteProductDpi(
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
    },
  ]);
};

module.exports = {
  index: index,
  getAllProductDpi: getAllProductDpi,
  create: create,
  show: show,
  update: update,
  destroy: destroy,
};

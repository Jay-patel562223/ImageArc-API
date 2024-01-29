const { sendResponse } = require("../../Support/APIResponse");
const HttpCode = require("../../Support/HttpCode");
const { ReviewService } = require("../../Services");
const {
  createRequest,
  updateRequest,
  Review,
  getReviewRequest,
} = require("../../Models/Review");
const async = require("async");
const messages = require("../../lang/en");
const sharp = require("sharp");
const path = require("path");
const { fullUrl } = require("../../utils/getUrl");

function filterUser(data, req, wishlist) {
  let finalData = data.map((res) => {
    if (res.image) {
      res.image = fullUrl(req) + "/product/" + res.image;
    } else {
      res.image = fullUrl(req) + "/product/";
    }

    return res;
  });

  finalData = finalData.map((item) => ({
    ...item._doc,
    product_type: "simple",
    quantity: "10",
    minPrice: "10",
    maxPrice: "10",
    quantity: "10",
    type: {
      settings: {
        isHome: true,
        layoutType: "classic",
        productCard: "neon",
      },
    },
    quantity: "1000",
    base_amount: item?._doc?.price,
    sale_price: 1.6,
    in_stock: 1,
    is_taxable: 0,
    unit: "JPG",
    wishlist: wishlist.filter((val) => {
      return val.product_id == item?._doc?._id;
    }),
  }));

  return finalData;
}

const create = (req, res) => {
  const body = req.body;
  const user_id = req?.user?.data?.user_id;
  body.user_id = user_id;

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
      ReviewService.createReview(body, (err, data) => {
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
          messages.CRUD.CREATED("Review")
        );
      });
    },
  ]);
};

const getReviewById = (req, res) => {
  const body = req.body;

  async.series([
    (next) => {
      let { error } = getReviewRequest(body);
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
      ReviewService.getReview(
        {
          user_id: body.user_id,
          order_id: body.order_id,
          product_id: body.product_id,
        },
        // { user_id: body.user_id, order_id: body.order_id },
        async (err, data) => {
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
            messages.CRUD.RETRIEVED("Review")
          );
        }
      );
    },
  ]);
};

const update = (req, res) => {
  const body = req.body;
  const id = req.params.id;
  const user_id = req?.user?.data?.user_id;
  body.user_id = user_id;

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
      next();
    },
    (next) => {
      ReviewService.updateReview(
        {
          order_id: body.order_id,
          product_id: body.product_id,
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
              "You can't edit this review."
            );
          } else {
            return sendResponse(
              res,
              true,
              HttpCode.OK,
              {
                data,
              },
              messages.CRUD.UPDATED("Review")
            );
          }
        }
      );
    },
  ]);
};

module.exports = {
  create: create,
  getReviewById: getReviewById,
  update: update,
};

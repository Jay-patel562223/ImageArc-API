const { sendResponse } = require("../../Support/APIResponse");
const HttpCode = require("../../Support/HttpCode");
const { ReviewService } = require("../../Services");
const async = require("async");
const messages = require("../../lang/en");
const config = require("../../config/index");
const { createRequest, Wishlist } = require("../../Models/Wishlist");
const { WishlistService } = require("../../Services");
const { Product } = require("../../Models/Product");
const { fullUrl } = require("../../utils/getUrl");
const { paginate } = require("../../config/Paginate");

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

  let arr = [];
  let wishlistNew = [];
  let ratingCount = [];
  async.series([
    (next) => {
      Wishlist.find(
        { user_id: user_id },
        ["_id", "product_id", "user_id"],
        {}
      ).exec(async (err, data) => {
        let wishlist = data;

        if (wishlist.length == 0) {
          data = [];
          return sendResponse(
            res,
            true,
            HttpCode.OK,
            {
              data,
              limit,
              skip,
            },
            messages.CRUD.RETRIEVED("Wishlist")
          );
        }
        await wishlist.map((val) => {
          arr.push(val.product_id);
        });
        await wishlistNew.push(...wishlist);
        next();
      });
    },
    (next) => {
      ReviewService.getReviewList(
        { product_id: { $in: arr } },
        ["product_id", "rating"],
        async (err, data) => {
          if (err) {
            next();
          }
          let rating = data;

          await ratingCount.push(...rating);
          next();
        }
      );
    },
    (next) => {
      Product.find(
        { _id: { $in: arr } , product_status: "approved"},
        ["_id", "name", "image", "product_type"],
        {}
      )
        .lean()
        .exec(async (err, data) => {
          if (err) {
            return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
          }
          data = await filterUser(data, req, wishlistNew, ratingCount);

          const results = data.slice(startIndex, endIndex);
          const url = `/wishlists?limit=${limit}`;

          return sendResponse(
            res,
            true,
            HttpCode.OK,
            {
              data: results,
              ...paginate(results.length, page, limit, results.length, url),
            },
            messages.CRUD.RETRIEVED("Wishlist")
          );
        });
    },
  ]);
};

async function filterUser(data, req, wishlist, ratingCount) {
  let finalData = data.map(async (res) => {
    if (res.image) {
      res.image = fullUrl(req) + "/product/" + res.image;
    } else {
      res.image = fullUrl(req) + "/product/";
    }

    // wishlist = await getWishlist(wishlist, res);
    const rating = await getReviewCount(ratingCount, res);

    res.wishlist = wishlist;
    res.ratings = rating;

    return res;
  });

  const newLof = await Promise.all(finalData);
  finalData = newLof;
  return finalData;
}

const getWishlist = (wishlist, item) => {
  return wishlist.filter((val) => {
    return val.product_id == item?._id;
  });
};

const getReviewCount = async (ratingCount, item) => {
  let count = 0;
  let count1 = 0;
  ratingCount.filter((val) => {
    if (val.product_id == item?._id) {
      count = count + Number(val.rating);
      count1 = count1 + 1;
    }
  });
  if (ratingCount.length != 0) {
    const resData = count / count1;
    return count1 != 0 ? (!resData ? "0.0" : resData.toFixed(1)) : "0.0";
  }
  return "0.0";
};

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
      WishlistService.getWishlist(
        { product_id: body.product_id, user_id: user_id },
        (err, data) => {
          if (err) {
            return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
          }

          if (data != null) {
            WishlistService.deleteWishlist(
              {
                product_id: body.product_id,
                user_id: user_id,
              },
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
                const resData = {
                  ...data?._doc,
                  isAdded: 2,
                };
                if (!data) {
                  return sendResponse(
                    res,
                    false,
                    HttpCode.NOT_FOUND,
                    {
                      data: resData,
                    },
                    "Data not found!"
                  );
                } else {
                  return sendResponse(
                    res,
                    true,
                    HttpCode.OK,
                    {
                      data: resData,
                    },
                    messages.CRUD.DELETED("Wishlist")
                  );
                }
              }
            );
          } else {
            WishlistService.createWishlist(body, (err, data) => {
              if (err) {
                return sendResponse(
                  res,
                  false,
                  HttpCode.SERVER_ERROR,
                  null,
                  err
                );
              }
              const resData = {
                ...data?._doc,
                isAdded: 1,
              };
              return sendResponse(
                res,
                true,
                HttpCode.OK,
                {
                  data: resData,
                },
                messages.CRUD.CREATED("Wishlist")
              );
            });
          }
        }
      );
    },
  ]);
};

const inwishlist = async (req, res) => {
  const id = req.params.id;

  WishlistService.countWishlist({ product_id: id }, (err, data) => {
    if (err) {
      return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
    }

    return sendResponse(
      res,
      true,
      HttpCode.OK,
      { data },
      messages.CRUD.RETRIEVED("Wishlist")
    );
  });
};

const inwishlistNew = async (req, res) => {
  const id = req.params.id;
  const user_id = req?.user?.data?.user_id;

  WishlistService.getWishlist(
    { product_id: id, user_id: user_id },
    (err, data) => {
      if (err) {
        return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
      }

      return sendResponse(
        res,
        true,
        HttpCode.OK,
        { data },
        messages.CRUD.RETRIEVED("Wishlist")
      );
    }
  );
};

const show = async (req, res) => {
  const id = req.params.id;

  WishlistService.getWishlist({ _id: id }, (err, data) => {
    if (err) {
      return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
    }

    return sendResponse(
      res,
      true,
      HttpCode.OK,
      { data },
      messages.CRUD.RETRIEVED("Wishlist")
    );
  });
};

const remove = async (req, res) => {
  const id = req.params.id;

  WishlistService.deleteWishlist(
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
          "You can't delete this wishlist."
        );
      } else {
        return sendResponse(
          res,
          true,
          HttpCode.OK,
          {
            data,
          },
          messages.CRUD.DELETED("Wishlist")
        );
      }
    }
  );
};

module.exports = {
  index: index,
  create: create,
  inwishlist: inwishlist,
  inwishlistNew: inwishlistNew,
  show: show,
  remove: remove,
};

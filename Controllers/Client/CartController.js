const { sendResponse } = require("../../Support/APIResponse");
const HttpCode = require("../../Support/HttpCode");
const { CartService } = require("../../Services");
const async = require("async");
const messages = require("../../lang/en");
const config = require("../../config/index");
const { createRequest, Cart } = require("../../Models/Cart");
const { WishlistService } = require("../../Services");
const { Product } = require("../../Models/Product");
const { fullUrl } = require("../../utils/getUrl");
const { paginate } = require("../../config/Paginate");
const { ProductPrice } = require("../../Models/ProductPrice");

const index = async (req, res) => {
  const user_id = req?.user?.data?.user_id;

  async.series([
    (next) => {
      Cart.find({ user_id: user_id }, {})
        .lean()
        .exec(async (err, data) => {
          if (err) {
            return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
          }
          data = await filterUser(data, req);

          return sendResponse(
            res,
            true,
            HttpCode.OK,
            {
              data,
            },
            messages.CRUD.RETRIEVED("Wishlist")
          );
        });
    },
  ]);
};

const filterUser = async (existData, req) => {
  existData = existData.map(async (data) => {
    let newData = await getProductData(data.id);
    let newProductPriceData = await getProductPriceData(data.purchaseFileType);
    if (newData != null) {
      if (data.image) {
        data.image = fullUrl(req) + "/product/" + newData.image;
      } else {
        data.image = fullUrl(req) + "/product/";
      }

      data.name = newData.name;
      data.unit = newData.unit;

      data.price =
        newProductPriceData != null ? newProductPriceData.price : data.price;
      data.base_amount =
        newProductPriceData != null
          ? newProductPriceData.price
          : data.base_amount;
    } else {
      await deleteProduct(data.id);
    }
    return data;
  });
  return Promise.all(existData);
};

const getProductData = async (id) => {
  const results = await Product.findOne(
    { _id: id, product_status: "approved" },
    (err, data) => {
      if (err) {
        return null;
      }

      return data;
    }
  );

  return results;
};

const getProductPriceData = async (type) => {
  const results = await ProductPrice.findOne(
    { name: type?.toLowerCase(), status: "active" },
    (err, data) => {
      if (err) {
        return null;
      }

      return data;
    }
  );

  return results;
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
      CartService.createCart(body, (err, data) => {
        if (err) {
          return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
        }
        const resData = {
          ...data?._doc,
        };
        return sendResponse(
          res,
          true,
          HttpCode.OK,
          {
            data: resData,
          },
          messages.CRUD.CREATED("Cart")
        );
      });
    },
  ]);
};

const destroy = (req, res) => {
  const id = req.params.id;
  async.series([
    (next) => {
      CartService.deleteCart({ id: id }, (err, data) => {
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
          messages.CRUD.CREATED("Cart")
        );
      });
    },
  ]);
};

const deleteProduct = (id) => {
  async.series([
    (next) => {
      CartService.deleteCart({ id: id }, (err, data) => {
        if (err) {
          return null;
          // return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
        }

        return null;
        // return sendResponse(
        //   res,
        //   true,
        //   HttpCode.OK,
        //   {
        //     data,
        //   },
        //   messages.CRUD.CREATED("Cart")
        // );
      });
    },
  ]);
};

module.exports = {
  index: index,
  create: create,
  destroy: destroy,
};

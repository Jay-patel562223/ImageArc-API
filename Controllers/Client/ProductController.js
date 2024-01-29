const { sendResponse } = require("../../Support/APIResponse");
const HttpCode = require("../../Support/HttpCode");
const {
  ProductService,
  ReviewService,
  ProductPriceService,
  WishlistService,
} = require("../../Services");
const async = require("async");
const messages = require("../../lang/en");
const config = require("../../config/index");
const { Product } = require("../../Models/Product");
const { Category } = require("../../Models/Category");
const { Wishlist } = require("../../Models/Wishlist");
const { CategoryService } = require("../../Services");
const { paginate } = require("../../config/Paginate");
const { fullUrl } = require("../../utils/getUrl");
const { ProductPrice } = require("../../Models/ProductPrice");
const { capitalizeFirstLetter } = require("../../Services/CommonService");
const { exec } = require("child_process");
const fs = require("fs");
// const gm = require('gm').subClass({ imageMagick: '7+' });
// const gm = require('gm').subClass({ imageMagick: '7+' });
const path = require("path");
// const Jimp = require("jimp");
// const sizeOf = require('image-size')

const index = async (req, res) => {
  let categories = req.query.categories;
  const query = req.query;
  let search = req.query.search;
  // search.str
  let searchStr = "";
  if (search != "" && search != undefined) {
    if (search.includes("name:")) {
      searchStr = search.split("name:")[1];
    } else if (search.includes("slug:")) {
      searchStr = search.split("slug:")[1];
    } else {
      searchStr = search;
    }
    // searchStr
  }

  // if (search != undefined && search.includes("categories.slug:")) {
  //   categories = search.split("slug:")[1];
  // }

  if (categories != undefined && categories != "") {
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

    // cquery = {
    //   $or: [
    //     {
    //       name: categories.toLowerCase(),
    //     },
    //     {
    //       name: categories.toUpperCase(),
    //     },
    //     {
    //       name: capitalizeFirstLetter(categories),
    //     },
    //   ],
    // };
    cquery = { name: categories };

    let cq = [];
    if (searchStr != undefined) {
      searchStr = searchStr.split(" ");
      searchStr.map((res) => {
        cq.push(
          {
            name: new RegExp(`.*${res.toLowerCase()}.*`),
          },
          {
            name: new RegExp(`.*${res.toUpperCase()}.*`),
          },
          {
            name: new RegExp(`.*${capitalizeFirstLetter(res)}.*`),
          }
        );
      });
    }

    async.series([
      (next) => {
        CategoryService.getCategory(cquery, async (err, datas) => {
          // if (err) {
          //   return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
          // }

          // let catSearch = [
          //   {
          //     name: new RegExp(`.*${searchStr.toLowerCase()}.*`),
          //   },
          //   {
          //     name: new RegExp(`.*${searchStr.toUpperCase()}.*`),
          //   },
          //   {
          //     name: new RegExp(`.*${capitalizeFirstLetter(searchStr)}.*`),
          //   },
          // ];
          let catSearch = cq;

          let catSearchElse = catSearch;

          let str = "";

          if (searchStr != undefined && searchStr != "") {
            const catArrVal = [datas?._id.toString()];
            if (search != undefined && datas != null) {
              // if (search != undefined && search.includes("categories.slug:")) {
              str = {
                $or: catSearch,
                // "categories.name": datas?.name,
                categories: { $all: catArrVal },
                product_status: "approved",
                status: "active",
              };
            } else {
              str = {
                $or: catSearchElse,
                product_status: "approved",
                status: "active",
              };
            }
          } else {
            const catArrVal = [datas?._id.toString()];
            if (datas != null) {
              str = {
                // "categories.name": datas?.name,
                categories: { $all: catArrVal },
                product_status: "approved",
                status: "active",
              };
            } else if (categories != "All") {
              str = {
                categories: { $all: catArrVal },
                // "categories.name": datas?.name,
                product_status: "approved",
                status: "active",
              };
            } else {
              str = {
                product_status: "approved",
                status: "active",
              };
            }
          }

          // await ProductService.getProduct(str, async (err, data) => {
          await ProductService.getProductList(
            str,
            {},
            {},
            ["_id", "name", "image", "product_type", "type", "unit"],
            async (err, data) => {
              if (err) {
                return sendResponse(
                  res,
                  false,
                  HttpCode.SERVER_ERROR,
                  null,
                  err
                );
              }

              if (data == null) {
                data = [];
                return sendResponse(
                  res,
                  true,
                  HttpCode.OK,
                  { data },
                  messages.CRUD.RETRIEVED("Product")
                );
              }
              data = await filterUser(data, req);

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
                messages.CRUD.RETRIEVED("Product")
              );
            }
          );
        });
      },
    ]);
  } else {
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

    let cq = [];
    if (searchStr != undefined) {
      searchStr = searchStr.split(" ");
      searchStr.map((res) => {
        cq.push(
          {
            name: new RegExp(`.*${res.toLowerCase()}.*`),
          },
          {
            name: new RegExp(`.*${res.toUpperCase()}.*`),
          },
          {
            name: new RegExp(`.*${capitalizeFirstLetter(res)}.*`),
          }
        );
      });
    }

    let pricesArr = [];
    async.waterfall([
      (next) => {
        let str = "";
        let catSearch = cq;
        if (searchStr != undefined && searchStr != "") {
          str = {
            $or: catSearch,
            // name: { $regex: ".*" + searchStr + ".*" },
            product_status: "approved",
            status: "active",
          };
        } else {
          str = {
            product_status: "approved",
            status: "active",
          };
        }

        Product.find(
          str,
          ["_id", "name", "image", "product_type", "type", "unit"],
          {}
        )
          .sort({ _id: -1 })
          .exec(async (err, data) => {
            data = await filterUser(data, req);
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
              messages.CRUD.RETRIEVED("Product")
            );
          });
      },
    ]);
  }
};

const indexForDevice = (req, res) => {
  let categories = req.query.categories;
  const query = req.query;
  let search = req.query.search;
  const user_id = req?.user?.data?.user_id;
  // search.str
  let searchStr = "";
  if (search != "" && search != undefined) {
    if (search.includes("name:")) {
      searchStr = search.split("name:")[1];
    } else if (search.includes("slug:")) {
      searchStr = search.split("slug:")[1];
    } else {
      searchStr = search;
    }
    // searchStr
  }

  if (search != undefined && search.includes("categories.slug:")) {
    categories = search.split("slug:")[1];
  }

  if (categories != undefined && categories != "") {
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

    let cq = [];
    if (searchStr != undefined) {
      searchStr = searchStr.split(" ");
      searchStr.map((res) => {
        cq.push(
          {
            name: new RegExp(`.*${res.toLowerCase()}.*`),
          },
          {
            name: new RegExp(`.*${res.toUpperCase()}.*`),
          },
          {
            name: new RegExp(`.*${capitalizeFirstLetter(res)}.*`),
          }
        );
      });
    }

    async.series([
      (next) => {
        CategoryService.getCategory(
          { name: categories },
          async (err, datas) => {
            if (err) {
              return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
            }

            const catArrVal = [datas?._id.toString()];
            let catSearch = cq;

            let catSearchElse = catSearch;
            let str = "";
            // if (searchStr != undefined && searchStr != "") {
            //   if (search != undefined && search.includes("categories.slug:")) {
            //     str = {
            //       // "categories.name": datas?.name,
            //       categories:{$all:catArrVal},
            //       product_status: "approved",
            //       status: "active",
            //     };
            //   } else {
            //     str = {
            //       // "categories.name": datas?.name,
            //       categories:{$all:catArrVal},
            //       product_status: "approved",
            //       status: "active",
            //       name: searchStr,
            //     };
            //   }
            // } else {
            //   str = {
            //     // "categories.name": datas?.name,
            //     categories:{$all:catArrVal},
            //     product_status: "approved",
            //     status: "active",
            //   };
            // }
            if (searchStr != undefined && searchStr != "") {
              const catArrVal = [datas?._id.toString()];
              if (search != undefined && datas != null) {
                // if (search != undefined && search.includes("categories.slug:")) {
                str = {
                  $or: catSearch,
                  // "categories.name": datas?.name,
                  categories: { $all: catArrVal },
                  product_status: "approved",
                  status: "active",
                };
              } else {
                str = {
                  $or: catSearchElse,
                  product_status: "approved",
                  status: "active",
                };
              }
            } else {
              const catArrVal = [datas?._id.toString()];
              if (datas != null) {
                str = {
                  // "categories.name": datas?.name,
                  categories: { $all: catArrVal },
                  product_status: "approved",
                  status: "active",
                };
              } else if (categories != "All") {
                str = {
                  categories: { $all: catArrVal },
                  // "categories.name": datas?.name,
                  product_status: "approved",
                  status: "active",
                };
              } else {
                str = {
                  product_status: "approved",
                  status: "active",
                };
              }
            }

            if (datas != null) {
              await ProductService.getProductList(
                str,
                {},
                {},
                ["_id", "image"],
                async (err, data) => {
                  if (err) {
                    return sendResponse(
                      res,
                      false,
                      HttpCode.SERVER_ERROR,
                      null,
                      err
                    );
                  }

                  if (data == null) {
                    data = [];
                    return sendResponse(
                      res,
                      true,
                      HttpCode.OK,
                      { data },
                      messages.CRUD.RETRIEVED("Product")
                    );
                  }
                  data = await filterUserNew(data, req, user_id);

                  const results = data.slice(startIndex, endIndex);
                  const url = `/products?limit=${limit}`;

                  return sendResponse(
                    res,
                    true,
                    HttpCode.OK,
                    {
                      data: results,
                      ...paginate(
                        data.length,
                        page,
                        limit,
                        results.length,
                        url
                      ),
                    },
                    messages.CRUD.RETRIEVED("Product")
                  );
                }
              );
            } else {
              return sendResponse(
                res,
                true,
                HttpCode.OK,
                {
                  data: [],
                },
                messages.CRUD.RETRIEVED("Product")
              );
              // return sendResponse(res, false, HttpCode.OK, null, "");
            }
          }
        );
      },
    ]);
  } else {
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

    let cq = [];
    if (searchStr != undefined) {
      searchStr = searchStr.split(" ");
      searchStr.map((res) => {
        cq.push(
          {
            name: new RegExp(`.*${res.toLowerCase()}.*`),
          },
          {
            name: new RegExp(`.*${res.toUpperCase()}.*`),
          },
          {
            name: new RegExp(`.*${capitalizeFirstLetter(res)}.*`),
          }
        );
      });
    }

    let pricesArr = [];
    async.waterfall([
      (next) => {
        let str = "";
        let catSearch = cq;
        if (searchStr != undefined && searchStr != "") {
          str = {
            $or: catSearch,
            // name: { $regex: ".*" + searchStr + ".*" },
            product_status: "approved",
            status: "active",
          };
        } else {
          str = {
            product_status: "approved",
            status: "active",
          };
        }

        Product.find(str, ["_id", "image"], {})
          .lean()
          .sort({ _id: -1 })
          .exec(async (err, data) => {
            data = await filterUserNew(data, req, user_id);
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
              messages.CRUD.RETRIEVED("Product")
            );
          });
      },
    ]);
  }
};

const getProductByCategory = (req, res) => {
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

  // if (!limit) limit = config.APP_CONSTANTS.PAGINATION_SIZE;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const id = req.params.id;
  Product.find(
    { categories: { $elemMatch: { $eq: id } }, status: "active" },
    // { "categories._id": id },
    ["_id", "image"],
    {}
  )
    .lean()
    .sort({ _id: -1 })
    .exec(async (err, data) => {
      data = await filterUserNew(data, req, user_id);
      const results = data.slice(startIndex, endIndex);
      const url = `/getProductByCategory/${id}?limit=${limit}`;
      // const url = `/getProjectByCategory/${id}?limit=${limit}`;

      return sendResponse(
        res,
        true,
        HttpCode.OK,
        {
          data: results,
          ...paginate(data.length, page, limit, results.length, url),
        },
        messages.CRUD.RETRIEVED("Product")
      );
    });
};

const getProductByCategoryWeb = (req, res) => {
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

  // if (!limit) limit = config.APP_CONSTANTS.PAGINATION_SIZE;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const id = req.params.id;
  Product.find(
    { categories: { $elemMatch: { $eq: id } }, status: "active" },
    // { "categories._id": id, status: "active" },
    ["_id", "image", "product_type", "type", "unit"],
    {}
  )
    // .skip(skip)
    // .limit(limit)
    .sort({ _id: -1 })
    .exec(async (err, data) => {
      data = await filterUser(data, req);
      const results = data.slice(startIndex, endIndex);
      const url = `/getProductByCategory/${id}?limit=${limit}`;
      // const url = `/getProjectByCategory/${id}?limit=${limit}`;

      // var result = newPriceArr.filter(function (v, i) {
      //   var results = data.filter(function (v1, i1) {
      //     return v1?.image
      //       ? v1?.image.includes("." + v.name)
      //         ? v.price
      //         : ""
      //       : "";
      //     // return v[0] === data.price;
      //   });
      // });

      return sendResponse(
        res,
        true,
        HttpCode.OK,
        {
          data: results,
          ...paginate(data.length, page, limit, results.length, url),
        },
        messages.CRUD.RETRIEVED("Product")
      );
    });
};

const getPrices = async (photo) => {
  let arr = [];
  if (photo == "jpg") {
    arr.push("jpg");
    arr.push("jpeg");
  } else if (photo == "jpeg") {
    arr.push("jpg");
    arr.push("jpeg");
  } else {
    arr.push(photo);
  }
  const results = await ProductPrice.findOne({
    name: { $in: arr },
  }).populate("dpi", "_id name");
  return results?.price ?? 0;
};

async function filterPhoto(data, req) {
  if (data != null || data != undefined) {
    finalData = data.map(async (res) => {
      if (res.image) {
        res.image = fullUrl(req) + "/product/" + res.image;
      } else {
        res.image = "";
      }
      return res;
    });
    const newLof = await Promise.all(finalData);
    finalData = newLof;
  } else {
    finalData = [];
  }
  return finalData;
}

async function filterUser(data, req) {
  let finalData;
  if (data != null || data != undefined) {
    finalData = data.map(async (res) => {
      if (res.image) {
        res.image = fullUrl(req) + "/product/" + res.image;
      } else {
        res.image = fullUrl(req) + "/product/";
      }

      var re = /(?:\.([^.]+))?$/;
      var ext = re.exec(res.image)[1];
      let prices = await getPrices(ext);

      res.price = prices;
      res.sale_price = prices;
      res.base_amount = prices;
      return res;
    });
    const newLof = await Promise.all(finalData);
    finalData = newLof;
  } else {
    finalData = [];
  }

  return finalData;
}

async function filterUserNew(data, req, user_id) {
  let finalData;
  const result = {};

  if (data != null || data != undefined) {
    let isLike = 2;
    finalData = data.map(async (res) => {
      if (res.image) {
        res.image = fullUrl(req) + "/product/" + res.image;
      } else {
        res.image = fullUrl(req) + "/product/";
      }

      if (user_id != undefined) {
        let dataNew = await getWishlist(res, user_id);

        if (dataNew != null) {
          res.isLike = 1;
        } else {
          res.isLike = 2;
        }

        return res;
      } else {
        res.isLike = 2;
        return res;
      }
    });
    const newLof = await Promise.all(finalData);
    finalData = newLof;
  } else {
    finalData = [];
  }

  return finalData;
}

const getWishlist = async (res, user_id) => {
  const results = await Wishlist.findOne(
    { product_id: res._id, user_id: user_id },
    (err, data) => {
      if (err) {
        return null;
      }

      return data;
    }
  );

  return results;
};

const show = async (req, res) => {
  const id = req.params.id;
  const user_id = req?.user?.data?.user_id;

  let arr = [];
  let catArr = [];
  async.series([
    // (next) => {
    //   ReviewService.countReview({ product_id: id }, (err, data) => {
    //     if (err) {
    //       return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
    //     }
    //     arr.push(data);
    //     next();
    //   });
    // },
    (next) => {
      ReviewService.getReviewList(
        { product_id: id },
        ["rating"],
        (err, data) => {
          // ReviewService.countReview({ product_id: id }, (err, data) => {
          if (err) {
            return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
          }
          const reviewData = filterRating(data);
          arr.push(reviewData);
          next();
        }
      );
    },
    (next) => {
      Category.find({}, [], {}).exec((err, data) => {
        catArr.push(data);

        next();
      });
    },
    (next) => {
      ProductService.getProduct(
        { _id: id, product_status: "approved" },
        {},
        {},
        [
          "tag",
          "_id",
          "name",
          "image",
          "description",
          // "categories._id",
          // "categories.name",
          // "categories.image",
          "unit",
          "access_type",
          "product_unique_id",
          "dpi",
          "resolution",
        ],
        async (err, data) => {
          if (err) {
            return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
          }

          if (data != undefined) {
            const similiarTags = data.name.split(" ");
            var regex = similiarTags.map(function (val) {
              return new RegExp("^" + val + ".*", "i");
            });

            const searchNewTags = {
              name: { $in: regex },
              _id: { $ne: data._id },
            };
            const similarProducts = await getSimilarProducts(
              req,
              searchNewTags,
              user_id
            );
            const updatedSimilarProducts = await filterPhoto(
              similarProducts,
              req
            );

            if (data.dpi == undefined && data.resolution == undefined) {
              runShellScript(
                `python3 image_dpi_detect.py public/original/jpg ${data.image}`,
                async function (response) {
                  let DPIdata = response.result;
                  console.log("DPIdata: ", DPIdata);

                  let DPIArr = [0, 0, 0];
                  if (DPIdata != null) {
                    DPIArr = JSON.parse(DPIdata);
                  }

                  var base_path = __basedir;
                  const filename = path.join(
                    base_path,
                    "/public/product/" + data.image
                  );

                  if (data.image) {
                    data.image = fullUrl(req) + "/product/" + data.image;
                  } else {
                    data.image = fullUrl(req) + "/product/";
                  }
                  data.ratings = arr[0];

                  let dataNew = await getWishlist(data, user_id);

                  if (dataNew != null) {
                    data.isLike = 1;
                  } else {
                    data.isLike = 2;
                  }

                  var re = /(?:\.([^.]+))?$/;
                  var ext = re.exec(data.image)[1];
                  const price = await getPrices(ext);
                  data.price = price;
                  data.tax = 0;
                  data.discount = 0;
                  data.total = price;

                  data.dpi = DPIArr[0];
                  data.resolution = DPIArr[1] + " x " + DPIArr[2];

                  // data.sale_price = price;
                  // data.base_amount = price;
                  data.similarProducts = updatedSimilarProducts;
                  ProductService.updateProduct(
                    {
                      _id: data?._id,
                    },
                    {
                      dpi: DPIArr[0],
                      resolution: DPIArr[1] + " x " + DPIArr[2],
                    },
                    (err, data) => {
                      data = {};
                    }
                  );
                  return sendResponse(
                    res,
                    true,
                    HttpCode.OK,
                    { data },
                    messages.CRUD.RETRIEVED("Product")
                  );
                }
              );
            } else {
              var base_path = __basedir;
              const filename = path.join(
                base_path,
                "/public/product/" + data.image
              );

              if (data.image) {
                data.image = fullUrl(req) + "/product/" + data.image;
              } else {
                data.image = fullUrl(req) + "/product/";
              }
              data.ratings = arr[0];

              let dataNew = await getWishlist(data, user_id);

              if (dataNew != null) {
                data.isLike = 1;
              } else {
                data.isLike = 2;
              }

              var re = /(?:\.([^.]+))?$/;
              var ext = re.exec(data.image)[1];
              const price = await getPrices(ext);
              data.price = price;
              data.sale_price = price;
              data.base_amount = price;

              data.similarProducts = updatedSimilarProducts;
              return sendResponse(
                res,
                true,
                HttpCode.OK,
                { data },
                messages.CRUD.RETRIEVED("Product")
              );
            }
          } else {
            return sendResponse(
              res,
              true,
              HttpCode.OK,
              { data },
              messages.CRUD.RETRIEVED("Product")
            );
          }

          // return sendResponse(
          //   res,
          //   true,
          //   HttpCode.OK,
          //   { data },
          //   messages.CRUD.RETRIEVED("Product")
          // );
        }
      );
    },
  ]);
};

const showWeb = async (req, res) => {
  const id = req.params.id;
  const user_id = req?.user?.data?.user_id;

  let arr = [];
  let catArr = [];
  async.series([
    (next) => {
      Product.find({ _id: { $exists: true, $in: [id] } }, [], {}).exec(
        (err, data) => {
          // next();
          if (err) {
            return sendResponse(
              res,
              true,
              HttpCode.OK,
              { data },
              messages.CRUD.RETRIEVED("Product")
            );
          }
          next();
        }
      );
    },
    (next) => {
      ReviewService.getReviewList(
        { product_id: id },
        ["rating"],
        (err, data) => {
          // ReviewService.countReview({ product_id: id }, (err, data) => {
          if (err) {
            return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
          }
          const reviewData = filterRating(data);
          arr.push(reviewData);
          next();
        }
      );
    },
    // (next) => {
    //   Category.find({}, [], {}).exec((err, data) => {
    //     catArr.push(data);

    //     next();
    //   });
    // },
    (next) => {
      ProductService.getProduct(
        { _id: id, product_status: "approved" },
        {},
        {},
        [
          "_id",
          "tag",
          // "categories._id",
          // "categories.name",
          // "categories.name",
          "name",
          "description",
          "image",
          "unit",
          // "categories",
          "access_type",
          "product_unique_id",
          "dpi",
          "resolution",
        ],
        async (err, data) => {
          if (err) {
            return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
          }

          if (data != undefined) {
            const similiarTags = data.name.split(" ");
            var regex = similiarTags.map(function (val) {
              return new RegExp("^" + val + ".*", "i");
            });

            const searchNewTags = {
              name: { $in: regex },
              _id: { $ne: data._id },
            };
            const similarProducts = await getSimilarProducts(
              req,
              searchNewTags,
              user_id
            );
            const updatedSimilarProducts = await filterPhoto(
              similarProducts,
              req
            );

            if (data.dpi == undefined && data.resolution == undefined) {
              console.log("1");
              runShellScript(
                `python3 image_dpi_detect.py public/original/jpg ${data.image}`,
                async function (response) {
                  let DPIdata = response.result;
                  let DPIArr = [0, 0, 0];
                  if (DPIdata != undefined) {
                    DPIArr = JSON.parse(DPIdata);
                  }
                  console.log("DPIdata: ", DPIdata);

                  var base_path = __basedir;
                  const filename = path.join(
                    base_path,
                    "/public/product/" + data.image
                  );

                  if (data.image) {
                    data.image = fullUrl(req) + "/product/" + data.image;
                  } else {
                    data.image = fullUrl(req) + "/product/";
                  }
                  data.ratings = arr[0];

                  var re = /(?:\.([^.]+))?$/;
                  var ext = re.exec(data.image)[1];
                  const price = await getPrices(ext);
                  data.price = price;
                  data.sale_price = price;
                  data.base_amount = price;

                  data.dpi = DPIArr[0];
                  data.resolution = DPIArr[1] + " x " + DPIArr[2];
                  // data.dpi = '0';
                  // data.resolution =  '0 x 0';

                  data.similarProducts = updatedSimilarProducts;

                  ProductService.updateProduct(
                    {
                      _id: data?._id,
                    },
                    {
                      dpi: DPIArr[0],
                      resolution: DPIArr[1] + " x " + DPIArr[2],
                    },
                    (err, data) => {
                      data = {};
                    }
                  );
                  return sendResponse(
                    res,
                    true,
                    HttpCode.OK,
                    { data },
                    messages.CRUD.RETRIEVED("Product")
                  );
                }
              );
            } else {
              console.log("2");

              var base_path = __basedir;
              const filename = path.join(
                base_path,
                "/public/product/" + data.image
              );

              if (data.image) {
                data.image = fullUrl(req) + "/product/" + data.image;
              } else {
                data.image = fullUrl(req) + "/product/";
              }
              data.ratings = arr[0];

              var re = /(?:\.([^.]+))?$/;
              var ext = re.exec(data.image)[1];
              const price = await getPrices(ext);
              data.price = price;
              data.sale_price = price;
              data.base_amount = price;

              data.similarProducts = updatedSimilarProducts;
              return sendResponse(
                res,
                true,
                HttpCode.OK,
                { data },
                messages.CRUD.RETRIEVED("Product")
              );
            }
          } else {
            return sendResponse(
              res,
              true,
              HttpCode.OK,
              { data },
              messages.CRUD.RETRIEVED("Product")
            );
          }
        }
      );
    },
  ]);
};

const getSimilarProducts = async (req, search, user_id) => {
  const results = await Product.find({
    ...search,
    $expr: { $lt: [0.5, { $rand: {} }] },
  })
    .lean()
    .limit(5)
    // .limit(-1)
    // .skip(5)
    .select("_id image");
  // const results1 = results.map((s) => s._id.toString());

  console.log("results: ", results.length);

  const results1 = results.map(async (data) => {
    let dataNew = await getWishlist(data, user_id);
    if (data.image) {
      data.image = fullUrl(req) + "/product/" + data.image;
    } else {
      data.image = fullUrl(req) + "/product/";
    }

    if (dataNew != null) {
      data.isLike = 1;
    } else {
      data.isLike = 2;
    }
    return data;
  });

  return results1;
};

const filterRating = (data) => {
  let rating = 0;
  data.map((res) => (rating = rating + Number(res.rating)));
  if (data.length != 0) {
    const resData = rating / data.length;
    return data.length != 0 ? resData.toFixed(1) : 0.0;
  }
  return "0.0";
};

const verify = async (req, res) => {
  return sendResponse(
    res,
    true,
    HttpCode.OK,
    {
      shipping_charge: 0,
      total_tax: 0,
      unavailable_products: [],
      wallet_amount: 0,
      wallet_currency: 0,
    },
    messages.CRUD.RETRIEVED("Product")
  );
};

const checkProductExist = (req, res) => {
  const body = req.body;

  let ids = [];
  if (body.id != undefined) {
    ids = body.id.split(",");
  }

  ProductService.getProductList(
    { _id: { $in: ids }, product_status: "approved", status: "active" },
    {},
    {},
    ["_id", "product_status"],
    async (err, data) => {
      if (err) {
        return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
      }

      const filterData = await data.map((res) => res._id.toString());

      const filterDataNew = await ids.map((res) => {
        return filterData.includes(res)
          ? { isAvailble: 1, _id: res }
          : { isAvailble: 0, _id: res };
      });

      return sendResponse(
        res,
        true,
        HttpCode.OK,
        { data: filterDataNew },
        messages.CRUD.RETRIEVED("Product")
      );
    }
  );
};

const getProductPrices = (req, res) => {
  let arr = [];
  let catArr = [];
  async.series([
    (next) => {
      ProductPriceService.getProductPriceList(
        { status: "active" },
        {},
        {},
        ["price", "_id", "name", "dpi"],
        async (err, data) => {
          if (err) {
            return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
          }

          return sendResponse(
            res,
            true,
            HttpCode.OK,
            { data },
            messages.CRUD.RETRIEVED("Product")
          );
        }
      );
    },
  ]);
};

const getDPI = async (imageName) => {
  // let responseData = '';
  await runShellScript(
    "python3 image_dpi_detect.py public/original/jpg 11653.tif",
    function (response) {
      // res.send(response.result);
      // responseData = response.result;
      // return  response.result
    }
  );
  // return responseData;
};

function runShellScript(script, callback) {
  exec(script, (error, stdOut, stderr) => {
    var result = { status: true };

    if (error) {
      result.status = false;
      result.error = error.message;
    }
    if (stderr) {
      result.status = false;
      result.stderr = stderr;
    }

    if (stdOut) {
      result.result = stdOut;
    }

    callback(result);
  });
}

module.exports = {
  index: index,
  indexForDevice: indexForDevice,
  show: show,
  showWeb: showWeb,
  verify: verify,
  getProductByCategory: getProductByCategory,
  getProductByCategoryWeb: getProductByCategoryWeb,
  checkProductExist: checkProductExist,
  getProductPrices: getProductPrices,
};

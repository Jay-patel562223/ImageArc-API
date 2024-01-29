const { sendResponse } = require("../../Support/APIResponse");
const HttpCode = require("../../Support/HttpCode");
const { ProductService, ProductPriceService, ReviewService } = require("../../Services");
const async = require("async");
const messages = require("../../lang/en");
const config = require("../../config/index");
const { createRequest, Product } = require("../../Models/Product");
const sharp = require("sharp");
const path = require("path");
const { fullUrl } = require("../../utils/getUrl");
const { paginate } = require("../../config/Paginate");
const {
  checkFileType,
  capitalizeFirstLetter,
  capitalizeNewFirstLetter,
} = require("../../Services/CommonService");
const { ProductPrice } = require("../../Models/ProductPrice");
const env = require("dotenv").config().parsed;
const fs = require("fs");
const moment = require("moment");
const { updateDPI } = require("../../Services/ProductService");

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
  val = val != undefined ? val.trim().toLowerCase() : val;
  let queryNew = {};
  if (val != undefined) {
    queryNew = {
      $or: [
        { name: new RegExp(`.*${val.toLowerCase()}.*`) },
        { name: new RegExp(`.*${val.toUpperCase()}.*`) },
        { name: new RegExp(`.*${capitalizeFirstLetter(val)}.*`) },
        { product_status: new RegExp(`.*${val.toLowerCase()}.*`) },
        { product_status: new RegExp(`.*${val.toUpperCase()}.*`) },
        { product_status: new RegExp(`.*${capitalizeFirstLetter(val)}.*`) },
        {
          categories: {
            $elemMatch: { name: new RegExp(`.*${val.toLowerCase()}.*`) },
          },
        },
        {
          categories: {
            $elemMatch: { name: new RegExp(`.*${val.toUpperCase()}.*`) },
          },
        },
        {
          categories: {
            $elemMatch: {
              name: new RegExp(`.*${capitalizeNewFirstLetter(val)}.*`),
            },
          },
        },
        // { [key]: new RegExp(`.*${val}.*`) },
        // { product_status: new RegExp(`.*${val}.*`) },
      ],
    };
  }
  const search =
    query.search != undefined && query.search != "" ? queryNew : {};

  Product.find(search, ["product_status", "status", "_id", "name", "image"], {
    /*skip, limit*/
  })
    .sort({ [column]: sort })
    // .skip(skip)
    // .limit(limit)
    // .sort({ _id: -1 })
    .exec((err, data) => {
      if (data != undefined) {
        data = filterUser(data, req);

        const results = data.slice(startIndex, endIndex);
        const url = `/products?limit=${limit}`;

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
          messages.CRUD.RETRIEVED("Product")
        );
      }
      return sendResponse(
        res,
        true,
        HttpCode.OK,
        {
          data: [],
        },
        messages.CRUD.RETRIEVED("Product")
      );
    });
};

// function capitalizeFirstLetter(str) {
//   const output = str.replace(/\b\w/g, (x) => x.toUpperCase());
//   // str = str.toLowerCase();
//   // return str[0].toUpperCase() + str.slice(1);
//   return output;
// }
const setData = (val) => {
  const config = {
    jpeg: { quality: 100 },
    jpg: { quality: 100 },
    png: { compressionLevel: 0 },
    tiff: { compressionLevel: 0 },
  };
  return "." + [val] + "(" + config[val] + ")";
};

function replaceAll(str, match, replacement) {
  // return str.replace("/.[^/.]+$/", () => replacement);

  return str.replace(new RegExp(match, "g"), () => replacement);
  // return str.replace(new RegExp(match), () => replacement);
}

const create = async (req, res) => {
  const body = req.body;
  const productPrices = await getProductPrices();
  const getProductCounts = await getProductCount();

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

      if (
        body.description == "undefined" ||
        body.description == "<p><br></p>"
      ) {
        return sendResponse(
          res,
          false,
          HttpCode.UNPROCESSABLE_ENTITY,
          null,
          "Description is required."
        );
      }
      if (typeof body.categories == "string") {
        const categories = JSON.parse(body.categories);
        if (categories.length == 0) {
          return sendResponse(
            res,
            false,
            HttpCode.UNPROCESSABLE_ENTITY,
            null,
            "Categories is required."
          );
        }
      }
      if (body.categories.length == 0) {
        return sendResponse(
          res,
          false,
          HttpCode.UNPROCESSABLE_ENTITY,
          null,
          "Categories is required."
        );
      }
      next();
    },
    (next) => {
      if (req.files.length != 0) {
        // if (req.files != undefined && req.files.length != 0) {
        if (typeof req.files[0] == "object") {
          const file = req.files[0];
          // let name = file.originalname.replaceAll(/\.[^/.]+$/, "");
          // let name = replaceAll(file.originalname, /.[^/.]+$/, "");

          // name = replaceAll(name, /[^a-zA-Z ]/g, "");

          // // name = name.replaceAll(/[^a-zA-Z ]/g, "");
          // name = name.trim();
          // console.log("file: ", name);

          const commonExtension = "jpg";

          let name = file.originalname.split(" ").join("");
          name = removeExtension(name);

          const addDate = moment().format("YYYYMMDDHmmss");
          name = addDate + "_" + name;

          console.log("name: ", name);

          if (checkFileType(file)) {
            // throw Error("Invalid file");
            return sendResponse(
              res,
              false,
              HttpCode.UNPROCESSABLE_ENTITY,
              null,
              // "Image file should be png, jpg or jpeg"
              messages.VALID_FILE
            );
          }

          // const newdata = Buffer.from(file.buffer, 'base64');

          var base_path = __basedir;
          const filename = path.join(
            base_path,
            "/public/product/" + name + "." + commonExtension
          );

          let folder = path.join(base_path, "/public/product/");
          if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder);

            console.log("Folder Created Successfully.");
          }

          const filenameBase = path.join(
            base_path,
            "/public/product/watermark.png"
          );

          const filenameBaseNew = path.join(base_path, "/public/original/");

          if (file.mimetype == "image/jpeg") {
            const url = filenameBaseNew + "png";
            storePhotoToFormat(file, url, name, "png");
            const url1 = filenameBaseNew + "jpg";
            storePhotoToFormat(file, url1, name, "jpg");
            body.access_type = "jpg,png";
          }
          if (file.mimetype == "image/png") {
            const url = filenameBaseNew + "png";
            storePhotoToFormat(file, url, name, "png");
            const url1 = filenameBaseNew + "jpg";
            storePhotoToFormat(file, url1, name, "jpg");
            body.access_type = "jpg,png";
          }
          if (file.mimetype == "image/tiff") {
            const url = filenameBaseNew + "png";
            storePhotoToFormat(file, url, name, "png");
            const url1 = filenameBaseNew + "jpg";
            storePhotoToFormat(file, url1, name, "jpg");
            const url2 = filenameBaseNew + "tif";
            storePhotoToFormat(file, url2, name, "tif");
            body.access_type = "jpg,png,tif";
          }
          // process.exit();
          // productPrices.map(async (resData) => {
          //   if (resData.name != "default") {
          //     const urlPath = filenameBaseNew + "" + resData.name;
          //     if (!fs.existsSync(urlPath)) {
          //       fs.mkdirSync(urlPath);
          //     }

          //     const url =
          //       filenameBaseNew + "" + resData.name + "/" + resData.dpi.name;

          //     if (!fs.existsSync(url)) {
          //       fs.mkdirSync(url);
          //     }

          //     await sharp(file.buffer)
          //       .withMetadata({ density: resData.dpi.name })
          //       .toFormat(resData.name)
          //       .toFile(url + "/" + name + "." + resData.name, function (err) {
          //         console.log("Error: ", err);
          //       });
          //   }
          // });

          sharp(filenameBase)
            .resize({
              fit: sharp.fit.fill, // Pass in the fit type.
              height: 449, // Let's make it a little smaller than the underlying image.
              width: 449,
            })
            .toBuffer({ resolveWithObject: true })
            .then(({ data, info }) => {
              sharp(file.buffer)
                .resize({
                  height: 450,
                  width: 450,
                })
                .toFormat(commonExtension)
                .composite([
                  {
                    input: data,
                  },
                ])
                .toFile(filename, function (err) {
                  console.log("Error: ", err);
                });
              console.log(info);
            })
            .catch((err) => {
              console.log("Error: ", err);
            });

          // body.image = file.originalname;
          // body.image = name + "." + commonExtension;
          let image = name + "." + commonExtension;
          body.image = image;

          let type = file.mimetype;
          type = type.replace("image/", "");
          body.unit = type.toUpperCase();
        }
      } else {
        delete body.image;
      }

      next();
    },
    (next) => {
      body.categories = JSON.parse(body.categories);

      body.product_type = "simple";
      body.minPrice = body.price;
      body.maxPrice = body.price;
      body.type = {
        settings: {
          isHome: true,
          layoutType: "classic",
          productCard: "neon",
        },
      };
      body.quantity = "1000";
      body.base_amount = body.price;
      body.sale_price = body.price;
      body.in_stock = 1;
      body.is_taxable = 0;
      body.product_unique_id = String(getProductCounts).padStart(9, "0");

      ProductService.createProduct(body, (err, data) => {
        if (err) {
          if(err?.code == 11000){
            return sendResponse(res, false, HttpCode.SERVER_ERROR, null, "Image name already exist!")
          }
          if(err?.errors?.image?.properties?.type == "required"){
            return sendResponse(res, false, HttpCode.SERVER_ERROR, null, "Image field is required!");
          }
          return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
        }
        setTimeout(() => {
          updateDPI(data._id);
        }, 4000);
        return sendResponse(
          res,
          true,
          HttpCode.OK,
          {
            data,
          },
          messages.CRUD.CREATED("Product")
        );
      });
    },
  ]);
};

// const getProductCount = async () => {
//   const count = await Product.aggregate([
//     { $group: { _id: null, total: { $sum: 1 } } },
//   ]);
//   if (count.length != 0) {
//     return count[0].total + 1;
//   } else {
//     return 1;
//   }
// };
const getProductCount = async () => {
  // const count = await Product.aggregate([
  //   { $group: { _id: null, total: { $sum: 1 } } },
  // ]);
  // console.log("count: ", count);
  // if (count.length != 0) {
  //   return count[0].total + 1;
  // } else {
  //   return 1;
  // }

  const count = await Product.findOne({}).limit(1).sort({ _id: -1 });

  if (count != null) {
    let product_unique_id = count.product_unique_id;
    product_unique_id = parseInt(product_unique_id);
    return product_unique_id + 1;
  } else {
    return 1;
  }
};

const getProductPrices = async () => {
  // await ProductPriceService.getProductPriceList(
  //   { status: "active" },
  //   (err, data) => {
  //     if (err) {
  //       return err;
  //     }
  //     return data;
  //   }
  // );
  const results = await ProductPrice.find({ status: "active" }).populate(
    "dpi",
    "_id name"
  );
  // const results1 = results.map((s) => s._id.toString());
  return results;
};

const show = async (req, res) => {
  const id = req.params.id;
  // .populate("categories", "_id name")

  ProductService.getProduct(
    { _id: id },
    [
      "_id",
      "tag",
      "product_status",
      "status",
      "categories",
      "name",
      "description",
      "image",
    ],
    (err, data) => {
      if (err) {
        return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
      }

      if (data != undefined) {
        if (data.image) {
          data.image = fullUrl(req) + "/product/" + data.image;
        } else {
          data.image = null;
        }
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
};

function filterUser(data, req) {
  const finalData = data.map((res) => {
    if (res.image) {
      res.image = fullUrl(req) + "/product/" + res.image;
    } else {
      res.image = fullUrl(req) + "/product/";
    }
    return res;
  });
  return finalData;
}

const update = async (req, res) => {
  const body = req.body;
  const id = req.params.id;
  body.categories = JSON.parse(body.categories);
  const productPrices = await getProductPrices();

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
      if (
        body.description == "undefined" ||
        body.description == "<p><br></p>"
      ) {
        return sendResponse(
          res,
          false,
          HttpCode.UNPROCESSABLE_ENTITY,
          null,
          "Description is required."
        );
      }
      if (typeof body.categories == "string") {
        const categories = JSON.parse(body.categories);
        if (categories.length == 0) {
          return sendResponse(
            res,
            false,
            HttpCode.UNPROCESSABLE_ENTITY,
            null,
            "Categories is required."
          );
        }
      }
      if (body.categories.length == 0) {
        return sendResponse(
          res,
          false,
          HttpCode.UNPROCESSABLE_ENTITY,
          null,
          "Categories is required."
        );
      }
      next();
    },
    (next) => {
      if (req.files.length != 0) {
        // if (req.files != undefined && req.files.length != 0) {
        if (typeof req.files[0] == "object") {
          const file = req.files[0];
          // // let name = file.originalname.replaceAll(/\.[^/.]+$/, "");
          // let name = replaceAll(file.originalname, /.[^/.]+$/, "");
          // // let name = replaceAll(file.originalname, "/.[^/.]+$/", "");

          // // name = name.replaceAll(/[^a-zA-Z ]/g, "");
          // name = replaceAll(name, /[^a-zA-Z ]/g, "");
          // // name = replaceAll(name, "/[^a-zA-Z ]/g", "");
          // name = name.trim();

          // const addDate = moment().format("YYYYMMDDHmmss");
          // name = addDate + "_" + name;
          const commonExtension = "jpg";

          let name = file.originalname.split(" ").join("");
          name = removeExtension(name);

          const addDate = moment().format("YYYYMMDDHmmss");
          name = addDate + "_" + name;
          console.log("name: ", name);

          if (checkFileType(file)) {
            // throw Error("Invalid file");
            return sendResponse(
              res,
              false,
              HttpCode.UNPROCESSABLE_ENTITY,
              null,
              // "Image file should be png, jpg or jpeg"
              messages.VALID_FILE
            );
          }

          var base_path = __basedir;
          const filename = path.join(
            base_path,
            "/public/product/" + name + "." + commonExtension
          );

          let folder = path.join(base_path, "/public/product/");
          if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder);

            console.log("Folder Created Successfully.");
          }

          const filenameBase = path.join(
            base_path,
            "/public/product/watermark.png"
          );

          const filenameBaseNew = path.join(base_path, "/public/original/");
          if (file.mimetype == "image/jpeg") {
            const url = filenameBaseNew + "png";
            storePhotoToFormat(file, url, name, "png");
            const url1 = filenameBaseNew + "jpg";
            storePhotoToFormat(file, url1, name, "jpg");
            body.access_type = "jpg,png";
          }
          if (file.mimetype == "image/png") {
            const url = filenameBaseNew + "png";
            storePhotoToFormat(file, url, name, "png");
            const url1 = filenameBaseNew + "jpg";
            storePhotoToFormat(file, url1, name, "jpg");
            body.access_type = "jpg,png";
          }
          if (file.mimetype == "image/tiff") {
            const url = filenameBaseNew + "png";
            storePhotoToFormat(file, url, name, "png");
            const url1 = filenameBaseNew + "jpg";
            storePhotoToFormat(file, url1, name, "jpg");
            const url2 = filenameBaseNew + "tif";
            storePhotoToFormat(file, url2, name, "tif");
            body.access_type = "jpg,png,tif";
          }
          // process.exit();
          // productPrices.map(async (resData) => {
          //   if (resData.name != "default") {
          //     const urlPath = filenameBaseNew + "" + resData.name;
          //     if (!fs.existsSync(urlPath)) {
          //       fs.mkdirSync(urlPath);
          //     }

          //     const url =
          //       filenameBaseNew + "" + resData.name + "/" + resData.dpi.name;

          //     if (!fs.existsSync(url)) {
          //       fs.mkdirSync(url);
          //     }

          //     await sharp(file.buffer)
          //       .withMetadata({ density: resData.dpi.name })
          //       .toFormat(resData.name)
          //       .toFile(url + "/" + name + "." + resData.name, function (err) {
          //         console.log("Error: ", err);
          //       });
          //   }
          // });

          sharp(filenameBase)
            .resize({
              fit: sharp.fit.fill, // Pass in the fit type.
              height: 449, // Let's make it a little smaller than the underlying image.
              width: 449,
            })
            .toBuffer({ resolveWithObject: true })
            .then(({ data, info }) => {
              sharp(file.buffer)
                .resize({
                  height: 450,
                  width: 450,
                })
                .toFormat(commonExtension)
                .composite([
                  {
                    input: data,
                  },
                ])
                .toFile(filename, function (err) {
                  console.log("Error: ", err);
                });
              console.log(info);
            })
            .catch((err) => {
              console.log("Error: ", err);
            });

          let image = name + "." + commonExtension;
          body.image = image;

          let type = file.mimetype;
          type = type.replace("image/", "");
          body.unit = type.toUpperCase();
        }
      } else {
        delete body.image;
      }

      next();
    },
    (next) => {
      ProductService.updateProduct(
        {
          _id: id,
        },
        body,
        async (err, data) => {
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
              "You can't edit this product."
            );
          } else {
            setTimeout(() => {
              updateDPI(id);
            }, 4000);
            ReviewService.deleteManyReview(
              {
                product_id: id
              },
              async (err,data) => {
                if (err) {
                  return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
                }
              }
            )
            
            return sendResponse(
              res,
              true,
              HttpCode.OK,
              {
                data,
              },
              messages.CRUD.UPDATED("Product")
            );
          }
        }
      );
    },
  ]);
};

function removeExtension(filename) {
  return filename.substring(0, filename.lastIndexOf(".")) || filename;
}

const storePhotoToFormat = async (file, url, name, toFormat) => {
  await sharp(file.buffer)
    .withMetadata()
    .toFormat(toFormat)
    .toFile(url + "/" + name + "." + toFormat, function (err, info) {
      console.log("info: ", info);
    });
};

// const checkFileType = (file) => {
//   const array_of_allowed_file_types = ["image/png", "image/jpeg", "image/jpg"];
//   return !array_of_allowed_file_types.includes(file.mimetype);
// };

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
      ProductService.deleteProduct(
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
              "You can't delete this product."
            );
          } else {
            return sendResponse(
              res,
              true,
              HttpCode.OK,
              {
                data,
              },
              messages.CRUD.DELETED("Product")
            );
          }
        }
      );
    },
  ]);
};

const changeStatus = (req, res) => {
  const body = req.body;
  const id = req.params.id;

  async.series([
    (next) => {
      ProductService.getProduct({ _id: id }, (err, data) => {
        if (err) {
          return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
        }

        let status = "";
        if (data?.product_status == "pending") {
          status = "approved";
        } else {
          status = "pending";
        }

        body.product_status = status;

        ProductService.updateProduct(
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
                "You can't edit this product."
              );
            } else {
              return sendResponse(
                res,
                true,
                HttpCode.OK,
                {
                  data,
                },
                messages.CRUD.UPDATED("Product")
              );
            }
          }
        );
      });
    },
  ]);
};

module.exports = {
  index: index,
  create: create,
  show: show,
  update: update,
  destroy: destroy,
  changeStatus: changeStatus,
};

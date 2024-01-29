const { sendResponse } = require("../../Support/APIResponse");
const HttpCode = require("../../Support/HttpCode");
const { CategoryService } = require("../../Services");
const async = require("async");
const messages = require("../../lang/en");
const config = require("../../config/index");
const { createRequest, Category } = require("../../Models/Category");
const sharp = require("sharp");
const path = require("path");
const { fullUrl } = require("../../utils/getUrl");
const { paginate } = require("../../config/Paginate");
const { capitalizeFirstLetter, checkFileType } = require("../../Services/CommonService");
const moment = require("moment");
const fs = require("fs");

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
        // { [key]: new RegExp(`.*${val}.*`) },
        // { status: new RegExp(`.*${val}.*`) },
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

  Category.find(search, ["_id", "name", "image", "status"], {
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
        // const url = `/products?limit=${limit}`;

        // data.image = fullUrl(req) + "/category/" + data.image;
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
          messages.CRUD.RETRIEVED("Categories")
        );
      }
      return sendResponse(
        res,
        true,
        HttpCode.OK,
        {
          data: [],
        },
        messages.CRUD.RETRIEVED("Categories")
      );
    });
};

function filterUser(data, req) {
  const finalData = data.map((res) => {
    if (res.image) {
      res.image = fullUrl(req) + "/category/" + res.image;
    } else {
      res.image = fullUrl(req) + "/category/";
    }
    return res;
  });
  return finalData;
}

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
      // if (body.description == "undefined") {
      //   return sendResponse(
      //     res,
      //     false,
      //     HttpCode.UNPROCESSABLE_ENTITY,
      //     null,
      //     "Description is required."
      //   );
      // }
      next();
    },
    (next) => {
      if (req.files.length != 0) {
        if (typeof req.files[0] == "object") {
          const file = req.files[0];

          var base_path = __basedir;
          // const filename = path.join(
          //   base_path,
          //   "/public/category/" + file.originalname
          // );
          let name = file.originalname.split(" ").join("");
          const addDate = moment().format("YYYYMMDDHmmss");
          name = addDate + "_" + name;
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
          const filename = path.join(
            base_path,
            "/public/category/" + name
            // "/public/product/" + name + "." + commonExtension
          );

          let folder = path.join(base_path, "/public/category/");
          if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder);

            console.log("Folder Created Successfully.");
          }

          // let name = replaceAll(file.originalname, /.[^/.]+$/, "_");
          // name = replaceAll(name, /[^a-zA-Z ]/g, "_");
          // name = name.trim();

          // const addDate = moment().format("YYYYMMDDHmmss");
          // name = addDate + "_" + name;
          // const commonExtension = "jpg";

          // const filename = path.join(
          //   base_path,
          //   "/public/product/" + name + "." + commonExtension
          // );

          sharp(file.buffer)
            .resize(640, 480)
            .jpeg({ quality: 80 })
            .toFile(filename);
          body.image = name;
        }
      } else {
        // body.image = "";
        return sendResponse(
          res,
          false,
          HttpCode.SERVER_ERROR,
          null,
          "Image field is required!"
        );
      }

      next();
    },
    (next) => {
      CategoryService.getCategory({ name: body.name }, (err, data) => {
        if (data) {
          return sendResponse(
            res,
            false,
            HttpCode.SERVER_ERROR,
            null,
            "Category already exist!"
          );
        }
        console.log(
          "body.description == undefined: ",
          body.description == undefined,
          body.description == "undefined"
        );
        if (body.description == "undefined") {
          delete req.body.description;
        }
        body.status = "active";
        CategoryService.createCategory(body, (err, data) => {
          if (err) {
            if(err?.code == 11000){
              return sendResponse(res, false, HttpCode.SERVER_ERROR, null, "Category already exist!");
            }
            return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
          }
          return sendResponse(
            res,
            true,
            HttpCode.OK,
            {
              data,
            },
            messages.CRUD.CREATED("Category")
          );
        });
      });
    },
  ]);
};

function replaceAll(str, match, replacement) {
  // return str.replace("/.[^/.]+$/", () => replacement);

  return str.replace(new RegExp(match, "g"), () => replacement);
  // return str.replace(new RegExp(match), () => replacement);
}

const show = async (req, res) => {
  const category_id = req.params.category_id;

  CategoryService.getCategory(
    { _id: category_id },
    ["_id", "name", "image", "description", "status"],
    (err, data) => {
      if (err) {
        return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
      }

      if (data != undefined) {
        if (data.image) {
          data.image = fullUrl(req) + "/category/" + data.image;
        } else {
          data.image = null;
        }
      }

      return sendResponse(
        res,
        true,
        HttpCode.OK,
        { data },
        messages.CRUD.RETRIEVED("Category")
      );
    }
  );
};

const update = (req, res) => {
  const body = req.body;
  const category_id = req.params.category_id;

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
      // if (body.description == "undefined") {
      //   return sendResponse(
      //     res,
      //     false,
      //     HttpCode.UNPROCESSABLE_ENTITY,
      //     null,
      //     "Description is required."
      //   );
      // }
      next();
    },
    (next) => {
      if (req.files.length != 0) {
        if (typeof req.files[0] == "object") {
          const file = req.files[0];
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
          // const filename = path.join(
          //   base_path,
          //   "/public/category/" + file.originalname
          // );

          let name = file.originalname.split(" ").join("");
          const addDate = moment().format("YYYYMMDDHmmss");
          name = addDate + "_" + name;

          const filename = path.join(
            base_path,
            "/public/category/" + name
            // "/public/product/" + name + "." + commonExtension
          );

          let folder = path.join(base_path, "/public/category/");
          if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder);

            console.log("Folder Created Successfully.");
          }

          console.log("filename: ", filename);

          sharp(file.buffer)
            .resize(640, 480)
            .jpeg({ quality: 80 })
            .toFile(filename);
          body.image = name;
        }
      } else {
        delete body.image;
        // return sendResponse(
        //   res,
        //   false,
        //   HttpCode.SERVER_ERROR,
        //   null,
        //   "Image field is required!"
        // );
      }

      next();
    },
    (next) => {
      if (body.description == "undefined") {
        delete req.body.description;
      }
      CategoryService.updateCategory(
        {
          _id: category_id,
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
              "You can't edit this category."
            );
          } else {
            return sendResponse(
              res,
              true,
              HttpCode.OK,
              {
                data,
              },
              messages.CRUD.UPDATED("Category")
            );
          }
        }
      );
    },
  ]);
};

const destroy = (req, res) => {
  const body = req.body;
  const category_id = req.params.category_id;

  if (!category_id) {
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
      CategoryService.deleteCategory(
        {
          _id: category_id,
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
              "You can't delete this category."
            );
          } else {
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

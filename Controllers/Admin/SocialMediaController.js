const { sendResponse } = require("../../Support/APIResponse");
const HttpCode = require("../../Support/HttpCode");
const { SocialMediaService } = require("../../Services");
const async = require("async");
const messages = require("../../lang/en");
const config = require("../../config/index");
const { paginate } = require("../../config/Paginate");
const { createSocialMediaRequest, updateSocialMediaRequest, SocialMedia } = require("../../Models/SocialMedia");
const { capitalizeFirstLetter, checkFileType } = require("../../Services/CommonService");
const sharp = require("sharp");
const path = require("path");
const moment = require("moment");
const fs = require("fs");
const { fullUrl } = require("../../utils/getUrl");


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
  val = val != undefined ? val.trim() : val;
  let queryNew = {};
  if (val != undefined) {
    queryNew = {
      $or: [
        { name: new RegExp(`.*${val.toLowerCase()}.*`) },
        { name: new RegExp(`.*${val.toUpperCase()}.*`) },
        { name: new RegExp(`.*${capitalizeFirstLetter(val)}.*`) },
        { status: new RegExp(`.*${val.toLowerCase()}.*`) },
        { status: new RegExp(`.*${val.toUpperCase()}.*`) },
        { status: new RegExp(`.*${capitalizeFirstLetter(val)}.*`) },
        // { status: new RegExp(`.*${val.toUpperCase()}.*`) },
      ],
    };
  }

  const search =
    query.search != undefined && query.search != "" ? queryNew : {};

  SocialMedia.find(search, ["_id", "image", "name", "url", "status", "createdAt", "updatedAt"], {})
    // .sort({ _id: -1 })
    .sort({ [column]: sort })
    .exec((err, data) => {
      if (data != undefined) {
        data = filterUser(data, req);

        const results = data.slice(startIndex, endIndex);

        const url = `/api/admin/social-media?limit=${limit}`;

        return sendResponse(
          res,
          true,
          HttpCode.OK,
          {
            data: results,
            ...paginate(data.length, page, limit, results.length, url),
          },
          messages.CRUD.RETRIEVED("Social Media")
        );
      }
      return sendResponse(
        res,
        true,
        HttpCode.OK,
        {
          data: [],
        },
        messages.CRUD.RETRIEVED("Social Media")
      );
    });
};

function filterUser(data, req) {
  const finalData = data.map((res) => {
    if (res.image) {
      res.image = fullUrl(req) + "/basic/" + res.image;
    } else {
      res.image = fullUrl(req) + "/basic/";
    }
    return res;
  });
  return finalData;
}

const create = (req, res) => {
  const body = req.body;
  async.series([
    (next) => {
      let { error } = createSocialMediaRequest(body);
      if (error) {
        return sendResponse(
          res,
          false,
          HttpCode.UNPROCESSABLE_ENTITY,
          null,
          error
        );
      }
      if (body.name == "") {
        return sendResponse(
          res,
          false,
          HttpCode.UNPROCESSABLE_ENTITY,
          null,
          "Name is required."
        );
      }
      if (body.url == "") {
        return sendResponse(
          res,
          false,
          HttpCode.UNPROCESSABLE_ENTITY,
          null,
          "URL is required."
        );
      }
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
            "/public/basic/" + name
            // "/public/product/" + name + "." + commonExtension
          );

          let folder = path.join(base_path, "/public/basic/");
          if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder);

            // console.log("Folder Created Successfully.");
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
            // .resize(64, 64)
            // .jpeg({ quality: 80 })
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
      const regex = new RegExp(["^", body.name, "$"].join(""), "i");
      SocialMediaService.getSocialMedia(
        { name: regex },
        (err, data) => {
          if (data != null) {
            return sendResponse(
              res,
              false,
              HttpCode.SERVER_ERROR,
              null,
              "Social Media already exist!"
            );
          }

          SocialMediaService.createSocialMedia(
            body,
            (err, data) => {
              if (err?.code == 11000) {
                return sendResponse(res, false, HttpCode.SERVER_ERROR, null, "Social Media already exist!")
              }
              if (err) {
                return sendResponse(
                  res,
                  false,
                  HttpCode.SERVER_ERROR,
                  null,
                  err
                );
              }
              return sendResponse(
                res,
                true,
                HttpCode.OK,
                {
                  data,
                },
                messages.CRUD.CREATED("Social Media")
              );
            }
          );
        }
      );
    },
  ]);
};

const show = async (req, res) => {
  const id = req.params.id;

  SocialMediaService.getSocialMedia(
    { _id: id },
    ["status", "_id", "image", "name", "url", "createdAt", "updatedAt"],
    (err, data) => {
      if (err) {
        return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
      }

      if (data != undefined) {
        if (data.image) {
          data.image = fullUrl(req) + "/basic/" + data.image;
        } else {
          data.image = null;
        }
      }

      return sendResponse(
        res,
        true,
        HttpCode.OK,
        {
          data,
        },
        messages.CRUD.RETRIEVED("Social Media")
      );
    }
  );
};

const update = (req, res) => {
  const body = req.body;
  const id = req.params.id;

  async.series([
    (next) => {
      let { error } = updateSocialMediaRequest(body);
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
            "/public/basic/" + name
            // "/public/product/" + name + "." + commonExtension
          );

          let folder = path.join(base_path, "/public/basic/");
          if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder);

            // console.log("Folder Created Successfully.");
          }

          sharp(file.buffer)
            // .resize(64, 64)
            // .jpeg({ quality: 80 })
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
      SocialMediaService.updateSocialMedia(
        {
          _id: id,
        },
        body,
        { new: true },
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
              "You can't edit this Social Media."
            );
          } else {
            return sendResponse(
              res,
              true,
              HttpCode.OK,
              {
                data,
              },
              messages.CRUD.UPDATED("Social Media")
            );
          }
        }
      );
    },
  ]);
};

const destroy = (req, res) => {
  const body = req.body;
  const id = req.params.id;

  // async.waterfall([
  //   (cb) => {
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
      SocialMediaService.deleteSocialMedia(
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
              "You can't delete this Social Media."
            );
          } else {
            return sendResponse(
              res,
              true,
              HttpCode.OK,
              {
                data,
              },
              messages.CRUD.DELETED("Social Media")
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
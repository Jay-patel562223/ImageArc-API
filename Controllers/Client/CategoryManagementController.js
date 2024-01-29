const { sendResponse } = require("../../Support/APIResponse");
const HttpCode = require("../../Support/HttpCode");
const messages = require("../../lang/en");
const config = require("../../config/index");
const { Category } = require("../../Models/Category");
const { fullUrl } = require("../../utils/getUrl");
const { capitalizeFirstLetter } = require("../../Services/CommonService");

const index = async (req, res) => {
  const query = req.query;
  let search = req.query.search;

  (skip = 0), (limit = config.APP_CONSTANTS.PAGINATION_SIZE);
  if (query.skip) {
    skip = parseInt(query.skip);
  }

  if (query.limit) {
    limit = parseInt(query.limit);
  }

  let where = { status: "active" };
  if (search == "type.slug:grocery") {
    search = "";
  }
  if (search != undefined && search != "") {
    where = {
      status: "active",
      $or: [
        { name: new RegExp(`.*${search.toLowerCase()}.*`) },
        { name: new RegExp(`.*${search.toUpperCase()}.*`) },
        { name: new RegExp(`.*${capitalizeFirstLetter(search)}.*`) },
      ],
    };
    // where = { status: "active", name: { $regex: ".*" + search + ".*" } };
  }
  // const where = {};
  Category.find(where, ["_id", "name", "image"], { skip, limit })
    .skip(skip)
    .limit(limit)
    .exec((err, data) => {
      if (data != null) {
        data = filterUser(data, req);
      }

      return sendResponse(
        res,
        true,
        HttpCode.OK,
        {
          data,
          limit,
          skip,
        },
        messages.CRUD.RETRIEVED("Categories")
      );
    });
};

const filterUser = (data, req) => {
  const finalData = data.map((res) => {
    if (res.image) {
      res.image = fullUrl(req) + "/category/" + res.image;
    } else {
      res.image = fullUrl(req) + "/category/";
    }
    return res;
  });
  return finalData;
};

module.exports = {
  index: index,
};

const { sendResponse } = require("../../Support/APIResponse");
const HttpCode = require("../../Support/HttpCode");
const async = require("async");
const messages = require("../../lang/en");
const config = require("../../config/index");
const { createRequest, ContactUs } = require("../../Models/ContactUs");
const { ContactUsService } = require("../../Services");
const { fullUrl } = require("../../utils/getUrl");
const { paginate } = require("../../config/Paginate");
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
  let val = searchNew[1];
  val = val != undefined ? val.trim().toLowerCase() : val;
  let queryNew = {};
  if (val != undefined) {
    queryNew = {
      $or: [
        { [key]: new RegExp(`.*${val}.*`) },
        { name: new RegExp(`.*${val.toLowerCase()}.*`) },
        { name: new RegExp(`.*${val.toUpperCase()}.*`) },
        { name: new RegExp(`.*${capitalizeFirstLetter(val)}.*`) },
        { email: new RegExp(`.*${val.toLowerCase()}.*`) },
        { email: new RegExp(`.*${val.toUpperCase()}.*`) },
        { email: new RegExp(`.*${capitalizeFirstLetter(val)}.*`) },
        { subject: new RegExp(`.*${val.toLowerCase()}.*`) },
        { subject: new RegExp(`.*${val.toUpperCase()}.*`) },
        { subject: new RegExp(`.*${capitalizeFirstLetter(val)}.*`) },
        { description: new RegExp(`.*${val.toLowerCase()}.*`) },
        { description: new RegExp(`.*${val.toUpperCase()}.*`) },
        { description: new RegExp(`.*${capitalizeFirstLetter(val)}.*`) },
      ]
    };
  }
  const search =
    query.search != undefined && query.search != ""
      ? queryNew
      : {};

  ContactUs.find(
    search,
    [],
    {
      /*skip, limit*/
    }
  ).sort({ [column]: sort })
    // .skip(skip)
    // .limit(limit)
    .sort({ _id: -1 })
    .exec((err, data) => {
      if (data != undefined) {
        const results = data.slice(startIndex, endIndex);
        const url = `/api/admin/ContactUs?limit=${limit}`;

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
          messages.CRUD.RETRIEVED("Inquiries")
        );
      }
      return sendResponse(
        res,
        true,
        HttpCode.OK,
        {
          data: [],
        },
        messages.CRUD.RETRIEVED("Inquiries")
      );
    });
}

const destroy = (req, res) => {
  const contactUs_id = req.params.contactUs_id;

  if (!contactUs_id) {
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
      ContactUsService.deleteContactUs(
        {
          _id: contactUs_id,
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
              "You can't delete this inquiry."
            );
          } else {
            return sendResponse(
              res,
              true,
              HttpCode.OK,
              {
                data,
              },
              messages.CRUD.DELETED("Inquiry")
            );
          }
        }
      );
    },
  ]);
};

module.exports = {
  index: index,
  destroy: destroy
};
const { sendResponse } = require("../../Support/APIResponse");
const HttpCode = require("../../Support/HttpCode");
const { CountriesService, StatesService } = require("../../Services");
const async = require("async");
const messages = require("../../lang/en");
const { createCountryRequest, Countries } = require("../../Models/Countries");
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
  let val = searchNew[1];
  val = val != undefined ? val.trim() : val;
  let queryNew = {};
  if (val != undefined) {
    queryNew = {
      $or: [
        { country: new RegExp(`.*${val.toLowerCase()}.*`) },
        { country: new RegExp(`.*${val.toUpperCase()}.*`) },
        { country: new RegExp(`.*${capitalizeFirstLetter(val)}.*`) },
        // { status: new RegExp(`.*${val.toLowerCase()}.*`) },
        { status: new RegExp(`.*${val.toLowerCase()}.*`) },
        { status: new RegExp(`.*${val.toUpperCase()}.*`) },
        { status: new RegExp(`.*${capitalizeFirstLetter(val)}.*`) },
        // { status: new RegExp(`.*${val.toUpperCase()}.*`) },
      ],
    };
  }

  const search =
    query.search != undefined && query.search != "" ? queryNew : {};

  Countries.find(search, ["status", "_id", "country"], {})
    // .sort({ _id: -1 })
    .sort({ [column]: sort })
    .exec((err, data) => {
      if (data != undefined) {
        const results = data.slice(startIndex, endIndex);

        const url = `/countries?limit=${limit}`;

        return sendResponse(
          res,
          true,
          HttpCode.OK,
          {
            data: results,
            ...paginate(data.length, page, limit, results.length, url),
          },
          messages.CRUD.RETRIEVED("Countries")
        );
      }
      return sendResponse(
        res,
        true,
        HttpCode.OK,
        {
          data: [],
        },
        messages.CRUD.RETRIEVED("Countries")
      );
    });
};

const create = (req, res) => {
  const body = req.body;
  async.series([
    (next) => {
      let { error } = createCountryRequest(body);
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
      CountriesService.createCountry(body, (err, data) => {
        if (err) {
          if(err.code == 11000){
            return sendResponse(res, false, HttpCode.SERVER_ERROR, null, "Country already exist!")
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
          messages.CRUD.CREATED("Countries")
        );
      });
    },
  ]);
};

const show = async (req, res) => {
  const id = req.params.id;

  CountriesService.getCountry(
    { _id: id },
    ["status", "_id", "country"],
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
        messages.CRUD.RETRIEVED("Countries")
      );
    }
  );
};

const update = (req, res) => {
  const body = req.body;
  const id = req.params.id;

  async.series([
    (next) => {
      let { error } = createCountryRequest(body);
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
      // CountriesService.getProductPrice({ _id: id }, (err, data) => {
      CountriesService.updateCountry(
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
              "You can't edit this countries."
            );
          } else {
            return sendResponse(
              res,
              true,
              HttpCode.OK,
              {
                data,
              },
              messages.CRUD.UPDATED("Countries")
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
      StatesService.getState({ country_id: id }, ["_id"], (err, data) => {
        if (err) {
          return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
        }
        if (data) {
          return sendResponse(
            res,
            false,
            HttpCode.UNPROCESSABLE_ENTITY,
            null,
            "You can't delete this country because it's used in states."
          );
        }
        next();
      });
    },
    (next) => {
      CountriesService.deleteCountry(
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
              "You can't delete this countries."
            );
          } else {
            return sendResponse(
              res,
              true,
              HttpCode.OK,
              {
                data,
              },
              messages.CRUD.DELETED("Countries")
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

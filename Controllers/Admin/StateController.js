const { sendResponse } = require("../../Support/APIResponse");
const HttpCode = require("../../Support/HttpCode");
const { StatesService } = require("../../Services");
const async = require("async");
const messages = require("../../lang/en");
const { createStatesRequest, States } = require("../../Models/States");
const { paginate } = require("../../config/Paginate");
const { fullUrl } = require("../../utils/getUrl");
const config = require("../../config/index");
const { Countries } = require("../../Models/Countries");
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
  let anotherQuery = {};

  if (val != undefined) {
    anotherQuery = {
      $or: [
        { country: new RegExp(`.*${val.toLowerCase()}.*`) },
        { country: new RegExp(`.*${val.toUpperCase()}.*`) },
        {
          country: new RegExp(`.*${capitalizeFirstLetter(val)}.*`),
        },
      ],
    };
    const searchNew1 =
      query.search != undefined && query.search != "" ? anotherQuery : {};

    const getAllCountries = await getAllCountry(searchNew1);

    queryNew = {
      $or: [
        { states: new RegExp(`.*${val.toLowerCase()}.*`) },
        { states: new RegExp(`.*${val.toUpperCase()}.*`) },
        { states: new RegExp(`.*${capitalizeFirstLetter(val)}.*`) },
        // { status: new RegExp(`.*${val.toLowerCase()}.*`) },
        { status: new RegExp(`.*${val.toLowerCase()}.*`) },
        { status: new RegExp(`.*${val.toUpperCase()}.*`) },
        { status: new RegExp(`.*${capitalizeFirstLetter(val)}.*`) },
        { country_id: { $in: getAllCountries } },
      ],
    };
  }

  const search =
    query.search != undefined && query.search != "" ? queryNew : {};

  async.series([
    (next) => {
      States.find(
        search,
        ["status", "_id", "country_id", "states", "country"],
        {}
      )
        .sort({ [column]: sort })
        .populate("country_id", "_id country")
        // .sort({ _id: -1 })
        .exec(async (err, data) => {
          if (data != undefined) {
            // data = await filterUser(data);
            data = await setData(data);
            const results = data.slice(startIndex, endIndex);

            const url = `/states?limit=${limit}`;

            return sendResponse(
              res,
              true,
              HttpCode.OK,
              {
                data: results,
                ...paginate(data.length, page, limit, results.length, url),
              },
              messages.CRUD.RETRIEVED("States")
            );
          }
          return sendResponse(
            res,
            true,
            HttpCode.OK,
            {
              data: [],
            },
            messages.CRUD.RETRIEVED("States")
          );
        });
    },
  ]);
};

const setData = async (data) => {
  data = data.map((item) => {
    item;
    return {
      ...item._doc,
      country: item.country_id != undefined ? item.country_id.country : "",
    };
  });
  return data;
};

async function filterUser(data, req) {
  let finalData;
  if (data != null || data != undefined) {
    finalData = data.map(async (res) => {
      let country = await getCountry(res?.country_id);

      res.country = country;
      return res;
    });
    const newLof = await Promise.all(finalData);
    finalData = newLof;
  } else {
    finalData = [];
  }

  return finalData;
}

const getCountry = async (country_id) => {
  const results = await Countries.findOne({
    _id: country_id,
  });
  // }).select("_id", "country");
  return results?.country;
};

const getAllCountry = async (query) => {
  const results = await Countries.find(query);
  // }).select("_id", "country");
  // const results1 = results.find((x) => x._id);
  const results1 = results.map((s) => s._id.toString());
  return results1;
};

const create = (req, res) => {
  const body = req.body;
  body.country_id = body.country_id._id;

  async.series([
    (next) => {
      let { error } = createStatesRequest(body);
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
      StatesService.getState({states: body.states}, (err, data)=>{
        if (data) {
          return sendResponse(
            res,
            false,
            HttpCode.SERVER_ERROR,
            null,
            "State already exist!"
          );
        }
      
        StatesService.createState(body, (err, data) => {
          if (err) {
            if(err.code == 11000){
              return sendResponse(res, false, HttpCode.SERVER_ERROR, null, "State already exist!")
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
            messages.CRUD.CREATED("States")
          );
        });
      })
    },
  ]);
};

const show = async (req, res) => {
  const id = req.params.id;

  StatesService.getState(
    { _id: id },
    ["status", "_id", "country_id", "states", "country"],
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
        messages.CRUD.RETRIEVED("States")
      );
    }
  );
};

const update = (req, res) => {
  const body = req.body;
  const id = req.params.id;
  body.country_id = body.country_id._id;

  async.series([
    (next) => {
      let { error } = createStatesRequest(body);
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
      // StatesService.getProductPrice({ _id: id }, (err, data) => {
      StatesService.updateState(
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
              messages.CRUD.UPDATED("States")
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
      StatesService.deleteState(
        {
          _id: id,
        },
        (err, data) => {
          if (err) {
            return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
          }
          // if (!data) {
          //   return sendResponse(
          //     res,
          //     false,
          //     HttpCode.NOT_FOUND,
          //     {
          //       data,
          //     },
          //     "You can't delete this countries."
          //   );
          // } else {
          return sendResponse(
            res,
            true,
            HttpCode.OK,
            {
              data,
            },
            messages.CRUD.DELETED("States")
          );
          // }
        }
      );
    },
  ]);
};

const stateCountry = (req, res) => {
  const body = req.body;
  const id = req.params.id;

  States.find({ country_id: id }, [], {})
    // .sort({ _id: -1 })
    .exec(async (err, data) => {
      // const results = data.slice(startIndex, endIndex);

      // const url = `/states?limit=${limit}`;
      // data = await filterUser(data);
      return sendResponse(
        res,
        true,
        HttpCode.OK,
        {
          data,
          // data: results,
          // ...paginate(data.length, page, limit, results.length, url),
        },
        messages.CRUD.RETRIEVED("States")
      );
    });
};

module.exports = {
  index: index,
  create: create,
  show: show,
  update: update,
  destroy: destroy,
  stateCountry: stateCountry,
};

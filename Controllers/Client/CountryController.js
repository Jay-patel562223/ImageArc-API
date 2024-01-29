const { sendResponse } = require("../../Support/APIResponse");
const HttpCode = require("../../Support/HttpCode");
const { CountriesService } = require("../../Services");
const async = require("async");
const messages = require("../../lang/en");
const { createCountryRequest, Countries } = require("../../Models/Countries");
const { paginate } = require("../../config/Paginate");
const { fullUrl } = require("../../utils/getUrl");
const config = require("../../config/index");
const { StatesService } = require("../../Services");
const { createStatesRequest, States } = require("../../Models/States");

const getCountry = async (req, res) => {
  // const query = req.query;

  // let where = {},
  //   skip = 0,
  //   page = 1,
  //   limit = config.APP_CONSTANTS.PAGINATION_SIZE;

  // if (query.skip) {
  //   skip = parseInt(query.skip);
  // }

  // if (query.limit) {
  //   limit = parseInt(query.limit);
  // }

  // if (query.page) {
  //   page = parseInt(query.page);
  // }

  // if (!page) {
  //   page = 1;
  // }

  // if (!limit) limit = config.APP_CONSTANTS.PAGINATION_SIZE;
  // const startIndex = (page - 1) * limit;
  // const endIndex = page * limit;

  async.series([
    (next) => {
      // let where = {};
      let where = { status: "active" };
      Countries.find(where, ["_id", "country"], {})
        // .sort({ _id: -1 })
        .exec((err, data) => {
          // const results = data.slice(startIndex, endIndex);

          // const url = `/countries?limit=${limit}`;

          return sendResponse(
            res,
            true,
            HttpCode.OK,
            {
              data,
              // data: results,
              // ...paginate(data.length, page, limit, results.length, url),
            },
            messages.CRUD.RETRIEVED("Countries")
          );
        });
    },
  ]);
};

const getState = async (req, res) => {
  // const query = req.query;

  // let where = {},
  //   skip = 0,
  //   page = 1,
  //   limit = config.APP_CONSTANTS.PAGINATION_SIZE;

  // if (query.skip) {
  //   skip = parseInt(query.skip);
  // }

  // if (query.limit) {
  //   limit = parseInt(query.limit);
  // }

  // if (query.page) {
  //   page = parseInt(query.page);
  // }

  // if (!page) {
  //   page = 1;
  // }

  // if (!limit) limit = config.APP_CONSTANTS.PAGINATION_SIZE;
  // const startIndex = (page - 1) * limit;
  // const endIndex = page * limit;
  async.series([
    (next) => {
      States.find({ status: "active" }, ["_id", "country_id", "states"], {})
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
    },
  ]);
};

// const checkCountry = async (res, user_id) => {
//   const results = await Wishlist.findOne(
//     { product_id: res._id, user_id: user_id },
//     (err, data) => {
//       if (err) {
//         return null;
//       }

//       return data;
//     }
//   );

//   return results;
// };

const getStateByCountry = (req, res) => {
  const body = req.body;
  const id = req.params.id;

  States.find(
    { country_id: id, status: "active" },
    ["_id", "country_id", "states"],
    {}
  )
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
  getCountry: getCountry,
  getState: getState,
  getStateByCountry: getStateByCountry,
};

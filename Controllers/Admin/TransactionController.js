const { sendResponse } = require("../../Support/APIResponse");
const HttpCode = require("../../Support/HttpCode");
const { ReviewService, TransactionService } = require("../../Services");
const async = require("async");
const messages = require("../../lang/en");
const config = require("../../config/index");
const { WishlistService } = require("../../Services");
const { Product } = require("../../Models/Product");
const { fullUrl } = require("../../utils/getUrl");
const { paginate } = require("../../config/Paginate");
const { func } = require("joi");
const { Transaction, createRequest } = require("../../Models/Transaction");
const { User } = require("../../Models/User");
const { capitalizeFirstLetter } = require("../../Services/CommonService");
const env = require("dotenv").config().parsed;

const stripe = require("stripe")(env.STRIPE_SECRET_KEY);

const index = async (req, res) => {
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

  if (!limit) limit = config.APP_CONSTANTS.PAGINATION_SIZE;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const column = query.orderBy;
  const sort = query.sortedBy == "asc" ? 1 : -1;
  // const searchNew = query.search.split(":");
  // const key = searchNew[0];
  let val = query.name;
  val = val != undefined ? val.trim() : val;
  let queryNew = {};
  if (val != undefined && val != "") {
    if (Number(val) == val) {
      queryNew = {
        $or: [
          { amount: val },
          { last4: new RegExp(`.*${val.toLowerCase()}.*`) },
          { last4: new RegExp(`.*${val.toUpperCase()}.*`) },
          { last4: new RegExp(`.*${capitalizeFirstLetter(val)}.*`) },
        ],
      };
    } else {
      const val1 = val.split("/");
      const date = val1[2] + "-" + val1[1] + "-" + val1[0];
      if (date.includes("undefined")) {
        anotherQuery = {
          $or: [
            { first_name: new RegExp(`.*${val.toLowerCase()}.*`) },
            { first_name: new RegExp(`.*${val.toUpperCase()}.*`) },
            {
              first_name: new RegExp(`.*${capitalizeFirstLetter(val)}.*`),
            },
            { last_name: new RegExp(`.*${val.toLowerCase()}.*`) },
            { last_name: new RegExp(`.*${val.toUpperCase()}.*`) },
            {
              last_name: new RegExp(`.*${capitalizeFirstLetter(val)}.*`),
            },
          ],
        };
        const searchNew1 = anotherQuery;
        const getAllUsers = await getAllUser(searchNew1);

        queryNew = {
          $or: [
            { unique_order_id: new RegExp(`.*${val.toLowerCase()}.*`) },
            { unique_order_id: new RegExp(`.*${val.toUpperCase()}.*`) },
            { unique_order_id: new RegExp(`.*${capitalizeFirstLetter(val)}.*`) },
            { payment_intent_id: val },
            { razorpay_id: val },
            { charge_id: new RegExp(`.*${val.toLowerCase()}.*`) },
            { charge_id: new RegExp(`.*${val.toUpperCase()}.*`) },
            { charge_id: new RegExp(`.*${capitalizeFirstLetter(val)}.*`) },
            { pay_type: new RegExp(`.*${val.toLowerCase()}.*`) },
            { pay_type: new RegExp(`.*${val.toUpperCase()}.*`) },
            { pay_type: new RegExp(`.*${capitalizeFirstLetter(val)}.*`) },
            { payment_gateway: new RegExp(`.*${val.toLowerCase()}.*`) },
            { payment_gateway: new RegExp(`.*${val.toUpperCase()}.*`) },
            {
              payment_gateway: new RegExp(`.*${capitalizeFirstLetter(val)}.*`),
            },

            { status: new RegExp(`.*${val.toLowerCase()}.*`) },
            { status: new RegExp(`.*${val.toUpperCase()}.*`) },
            { status: new RegExp(`.*${capitalizeFirstLetter(val)}.*`) },
            // { user_id: { $in: getAllUsers } },
            { user_id: { $in: getAllUsers } },
          ],
        };
      } else {
        queryNew = {
          created_at: {
            $gte: new Date(date + "T00:00:00.000Z"),
            $lt: new Date(date + "T23:59:59.000Z"),
          },
        };
      }
    }
  }
  const search = query.name != undefined && query.name != "" ? queryNew : {};

  let allData = [];
  async.series([
    (next) => {
      Transaction.find(search, [])
        .populate("user_id", "_id first_name last_name")
        .sort({ [column]: sort })
        // .sort({ _id: -1 })
        .exec((err, data) => {
          if (data != null) {
            // data = data;
            data = filterUser(data, req);
          } else {
            data = [];
          }

          const results = data.slice(startIndex, endIndex);
          const url = `/transactions?limit=${limit}`;

          return sendResponse(
            res,
            true,
            HttpCode.OK,
            {
              data: results,
              ...paginate(data.length, page, limit, results.length, url),
            },
            messages.CRUD.RETRIEVED("Transactions")
          );
        });
    },
  ]);
};

const getAllUser = async (query) => {
  const results = await User.find(query).select("_id");
  // }).select("_id", "country");
  // const results1 = results.find((x) => x._id);
  const results1 = results.map((s) => s._id.toString());
  return results1;
};

const filterUser = (data) => {
  data = data.map((item) => {
    return {
      ...item._doc,
      user:
        item.user_id != undefined
          ? item.user_id.first_name + " " + item.user_id.last_name
          : "",
    };
  });
  return data;
};

module.exports = {
  index: index,
};

const { sendResponse } = require("../../Support/APIResponse");
const HttpCode = require("../../Support/HttpCode");
const { ReviewService, UserSubscriptionService } = require("../../Services");
const async = require("async");
const messages = require("../../lang/en");
const config = require("../../config/index");
const { createRequest, Order } = require("../../Models/Order");
const { OrderService } = require("../../Services");
const env = require("dotenv").config().parsed;
const { fullUrl } = require("../../utils/getUrl");
const { UserSubscription } = require("../../Models/UserSubscription");
const { paginate } = require("../../config/Paginate");
const moment = require("moment");
const { User } = require("../../Models/User");
const { capitalizeFirstLetter } = require("../../Services/CommonService");

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
        $or: [{ total: val }],
      };
    } else {
      const val1 = val.split("/");
      // let date = val1;
      // if (val1.includes("/")) {
      let date = val1[2] + "-" + val1[1] + "-" + val1[0];
      // }
      console.log("datewfrewrew: ", date, date.includes("undefined"));
      if (date.includes("undefined")) {
        let newName = val.split(" ");
        let first_name = newName[0] != undefined ? newName[0] : "";
        let last_name = newName[1] != undefined ? newName[1] : "";
        console.log("first_name: ", first_name, last_name);

        let firstName = [];
        let lastName = [];
        if (first_name != "") {
          firstName = [
            { first_name: new RegExp(`.*${first_name.toLowerCase()}.*`) },
            { first_name: new RegExp(`.*${first_name.toUpperCase()}.*`) },
            {
              first_name: new RegExp(
                `.*${capitalizeFirstLetter(first_name)}.*`
              ),
            },
            { last_name: new RegExp(`.*${first_name.toLowerCase()}.*`) },
            { last_name: new RegExp(`.*${first_name.toUpperCase()}.*`) },
            {
              last_name: new RegExp(`.*${capitalizeFirstLetter(first_name)}.*`),
            },
          ];
        }
        if (last_name != "") {
          lastName = [
            { last_name: new RegExp(`.*${last_name.toLowerCase()}.*`) },
            { last_name: new RegExp(`.*${last_name.toUpperCase()}.*`) },
            {
              last_name: new RegExp(`.*${capitalizeFirstLetter(last_name)}.*`),
            },
          ];
        }

        anotherQuery = {
          $or: [...firstName, ...lastName],
        };
        const searchNew1 = anotherQuery;
        const getAllUsers = await getAllUser(searchNew1);
        console.log("getAllUsers: ", getAllUsers);
        queryNew = {
          $or: [
            { unique_id: new RegExp(`.*${val.toLowerCase()}.*`) },
            { unique_id: new RegExp(`.*${val.toUpperCase()}.*`) },
            { unique_id: new RegExp(`.*${capitalizeFirstLetter(val)}.*`) },
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
  console.log("search: ", search);

  let arr = [];
  let arrId = [];
  let allData = [];
  async.series([
    (next) => {
      Order.find(
        search,
        ["_id", "created_at", "amount", "total", "unique_id", "user_id"],
        {}
      )
        // .lean()
        // .populate("package_id", "_id package_type._id package_type.name")

        .populate("user_id", "_id first_name last_name")
        .sort({ [column]: sort })
        // .skip(skip)
        // .limit(limit)
        // .sort({ _id: -1 })
        .exec((err, data) => {
          if (data != null) {
            // data = data;
            data = filterUser(data, req);
          } else {
            data = [];
          }

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
            // {
            //   data,
            //   limit,
            //   skip,
            // },
            messages.CRUD.RETRIEVED("Product")
          );
        });
    },
  ]);
};

const getAllUser = async (query) => {
  console.log("query; ", query);
  const results = await User.find(query).select("_id");
  // }).select("_id", "country");
  // const results1 = results.find((x) => x._id);
  console.log("results: ", results);
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

const show = (req, res) => {
  const id = req.params.id;

  let arr = [];
  async.series([
    (next) => {
      OrderService.getOrder(
        { _id: id },
        [
          "_id",
          "user_id",
          "payment_gateway",
          "created_at",
          "amount",
          "total",
          "products.product_id",
          "products.subtotal",
          "products.unit_price",
          "products.image",
          "products.name",
          "products.unit",
          "unique_id",
        ],
        (err, data) => {
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

module.exports = {
  index: index,
  show: show,
};

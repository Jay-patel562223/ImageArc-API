const HttpCode = require("../../Support/HttpCode");
const { sendResponse } = require("../../Support/APIResponse");
const {
  changePasswordRequest,
  profileRequest,
  User,
} = require("../../Models/User");
const async = require("async");
const bcrypt = require("bcryptjs");
const {
  UserService,
  RoleService,
  TokenService,
  CountriesService,
  StatesService,
} = require("../../Services/index");
const messages = require("../../lang/en");
const config = require("../../config/index");
const jwt = require("jsonwebtoken");
const lodash = require("lodash");
const sendEmail = require("../../utils/sendEmail");
const { Countries } = require("../../Models/Countries");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const moment = require("moment");

const settings = (req, res, next) => {
  var config = require("../../src/db/pickbazar/settings.json");
  return sendResponse(
    res,
    true,
    HttpCode.OK,
    config,
    messages.CRUD.UPDATED("Profile")
  );
};

const analytics = (req, res, next) => {
  var config = require("../../src/db/pickbazar/analytics.json");
  return sendResponse(
    res,
    true,
    HttpCode.OK,
    config,
    messages.CRUD.UPDATED("Profile")
  );
};
const attributes = (req, res, next) => {
  var config = require("../../src/db/pickbazar/attributes.json");
  return sendResponse(
    res,
    true,
    HttpCode.OK,
    config,
    messages.CRUD.UPDATED("Profile")
  );
};
const authors = (req, res, next) => {
  var config = require("../../src/db/pickbazar/authors.json");
  return sendResponse(
    res,
    true,
    HttpCode.OK,
    config,
    messages.CRUD.UPDATED("Profile")
  );
};
const categories = (req, res, next) => {
  var config = require("../../src/db/pickbazar/categories.json");
  return sendResponse(
    res,
    true,
    HttpCode.OK,
    { data: config },
    messages.CRUD.UPDATED("Profile")
  );
};
const coupons = (req, res, next) => {
  var config = require("../../src/db/pickbazar/coupons.json");
  return sendResponse(
    res,
    true,
    HttpCode.OK,
    { data: config },
    messages.CRUD.UPDATED("Profile")
  );
};
const manufacturers = (req, res, next) => {
  var config = require("../../src/db/pickbazar/manufacturers.json");
  return sendResponse(
    res,
    true,
    HttpCode.OK,
    config,
    messages.CRUD.UPDATED("Profile")
  );
};
const orderexport = (req, res, next) => {
  var config = require("../../src/db/pickbazar/order-export.json");
  return sendResponse(
    res,
    true,
    HttpCode.OK,
    config,
    messages.CRUD.UPDATED("Profile")
  );
};
const orderfiles = (req, res, next) => {
  var config = require("../../src/db/pickbazar/order-files.json");
  return sendResponse(
    res,
    true,
    HttpCode.OK,
    config,
    messages.CRUD.UPDATED("Profile")
  );
};
const orderinvoice = (req, res, next) => {
  var config = require("../../src/db/pickbazar/order-invoice.json");
  return sendResponse(
    res,
    true,
    HttpCode.OK,
    config,
    messages.CRUD.UPDATED("Profile")
  );
};
const orderstatuses = (req, res, next) => {
  var config = require("../../src/db/pickbazar/order-statuses.json");
  return sendResponse(
    res,
    true,
    HttpCode.OK,
    config,
    messages.CRUD.UPDATED("Profile")
  );
};
const orders = (req, res, next) => {
  var config = require("../../src/db/pickbazar/orders.json");
  return sendResponse(
    res,
    true,
    HttpCode.OK,
    config,
    messages.CRUD.UPDATED("Profile")
  );
  n;
};
const products = (req, res, next) => {
  var config = require("../../src/db/pickbazar/products.json");
  return sendResponse(
    res,
    true,
    HttpCode.OK,
    { data: config },
    messages.CRUD.UPDATED("Profile")
  );
};
const questions = (req, res, next) => {
  var config = require("../../src/db/pickbazar/questions.json");
  return sendResponse(
    res,
    true,
    HttpCode.OK,
    config,
    messages.CRUD.UPDATED("Profile")
  );
};
const reports = (req, res, next) => {
  var config = require("../../src/db/pickbazar/reports.json");
  return sendResponse(
    res,
    true,
    HttpCode.OK,
    config,
    messages.CRUD.UPDATED("Profile")
  );
};
const reviews = (req, res, next) => {
  var config = require("../../src/db/pickbazar/reviews.json");
  return sendResponse(
    res,
    true,
    HttpCode.OK,
    config,
    messages.CRUD.UPDATED("Profile")
  );
};
const shippings = (req, res, next) => {
  var config = require("../../src/db/pickbazar/shippings.json");
  return sendResponse(
    res,
    true,
    HttpCode.OK,
    config,
    messages.CRUD.UPDATED("Profile")
  );
};
const shops = (req, res, next) => {
  var config = require("../../src/db/pickbazar/shops.json");
  return sendResponse(
    res,
    true,
    HttpCode.OK,
    { data: config },
    messages.CRUD.UPDATED("Profile")
  );
};
const tags = (req, res, next) => {
  var config = require("../../src/db/pickbazar/tags.json");
  return sendResponse(
    res,
    true,
    HttpCode.OK,
    config,
    messages.CRUD.UPDATED("Profile")
  );
};
const taxes = (req, res, next) => {
  var config = require("../../src/db/pickbazar/taxes.json");
  return sendResponse(
    res,
    true,
    HttpCode.OK,
    config,
    messages.CRUD.UPDATED("Profile")
  );
};
const types = (req, res, next) => {
  var config = require("../../src/db/pickbazar/types.json");
  //   return config;
  //   return sendResponse(config);
  return sendResponse(
    res,
    true,
    HttpCode.OK,
    { data: config },
    messages.CRUD.UPDATED("Profile")
  );
};
const users = (req, res, next) => {
  var config = require("../../src/db/pickbazar/users.json");
  return sendResponse(
    res,
    true,
    HttpCode.OK,
    config,
    messages.CRUD.UPDATED("Profile")
  );
};
const wishlists = (req, res, next) => {
  var config = require("../../src/db/pickbazar/wishlists.json");
  return sendResponse(
    res,
    true,
    HttpCode.OK,
    { data: config },
    messages.CRUD.UPDATED("Profile")
  );
};

const fileJson = require("../../public/country_state.json");

const storeLocation = async () => {
  // const fileJson = fs.readFileSync("../../public/country_state.json");
  // return fileJson;
  await fileJson.map(async (res) => {
    await CountriesService.getCountry(
      { country: res.country },
      async (err, data) => {
        if (err) {
          return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
        }

        if (data != null) {
          await res.states.map(async (resNew) => {
            const body = {
              country_id: data._id,
              states: resNew,
            };

            StatesService.createState(body, (err, data) => {
              if (err) {
                return sendResponse(
                  res,
                  false,
                  HttpCode.SERVER_ERROR,
                  null,
                  err
                );
              }
              // return sendResponse(
              //   res,
              //   true,
              //   HttpCode.OK,
              //   {
              //     data,
              //   },
              //   messages.CRUD.CREATED("States")
              // );
            });
          });
        }

        // return sendResponse(
        //   res,
        //   true,
        //   HttpCode.OK,
        //   {
        //     data,
        //   },
        //   messages.CRUD.RETRIEVED("Countries")
        // );
      }
    );
  });
  // Countries.find({}, [], {})
  //   .exec(async (err, data) => {
  //     await data.map((res) => {
  //     });
  //   });
};

const storeRoles = async () => {
  // db.roles.insertOne({
  //   name: "ADMIN",
  //   code: "ADMIN",
  // });

  // db.roles.insertOne({
  //   name: "USER",
  //   code: "USER",
  // });
  const arr = [
    {
      name: "ADMIN",
      code: "ADMIN",
    },
    {
      name: "USER",
      code: "USER",
    },
  ];
  arr.map((res) => {
    RoleService.createRole(res, (err, data) => {
      if (err) {
        return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
      }
    });
  });
};

const getRoles = async () => {
  RoleService.getRoles({ country: res.country }, async (err, data) => {
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
  });
};

var pdf = require("dynamic-html-pdf");

async function createPDF(req, res) {
  // Create a browser instance
  var base_path = __basedir;
  const filename = path.join(base_path, "/resources/invoice.html");
  const html = fs.readFileSync(filename, "utf-8");

  var options = {
    format: "A3",
    orientation: "landscape",
    // border: "10mm",
  };

  var data = [
    {
      name: "aaa",
      price: 24,
    },
    {
      name: "aaa",
      price: 24,
    },
  ];

  var document = {
    type: "file", // 'file' or 'buffer'
    template: html,
    context: {
      data: data,
    },
    path: base_path + "/public/pdf/result1.pdf", // it is not required if type is buffer
  };

  pdf
    .create(document, options)
    .then((res) => {
      console.log(res);
    })
    .catch((error) => {
      console.error(error);
    });
}

const test = async (req, res) => {
  // var tz = moment.tz;
  var timedifference = new Date().getTimezoneOffset();
  console.log("tz: ", timedifference);
  res.json(timedifference);
  // console.log('fsd');
  // const data = await runShellScript("python3 image_dpi_detect.py public/original/jpg 11653.tif", function(response) {
  //   console.log( response.result);
  //   res.send(response.result);
  // });
};

function runShellScript(script, callback) {
  exec(script, (error, stdOut, stderr) => {
    var result = { status: true };

    if (error) {
      result.status = false;
      result.error = error.message;
    }
    if (stderr) {
      result.status = false;
      result.stderr = stderr;
    }

    if (stdOut) {
      result.result = stdOut;
    }

    callback(result);
  });
}

module.exports = {
  settings: settings,
  analytics: analytics,
  attributes: attributes,
  authors: authors,
  categories: categories,
  coupons: coupons,
  manufacturers: manufacturers,
  orderexport: orderexport,
  orderfiles: orderfiles,
  orderinvoice: orderinvoice,
  orderstatuses: orderstatuses,
  orders: orders,
  products: products,
  questions: questions,
  reports: reports,
  reviews: reviews,
  shippings: shippings,
  shops: shops,
  tags: tags,
  taxes: taxes,
  types: types,
  users: users,
  wishlists: wishlists,
  storeLocation: storeLocation,
  storeRoles: storeRoles,
  getRoles: getRoles,
  createPDF: createPDF,
  test: test,
};

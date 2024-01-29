const { sendResponse } = require("../../Support/APIResponse");
const HttpCode = require("../../Support/HttpCode");
const {
  ReviewService,
  UserSubscriptionService,
  UserService,
  TransactionService,
} = require("../../Services");
const async = require("async");
const messages = require("../../lang/en");
const config = require("../../config/index");
const {
  createRequest,
  Order,
  createRequestNew,
} = require("../../Models/Order");
const { OrderService } = require("../../Services");
const env = require("dotenv").config().parsed;
const { fullUrl } = require("../../utils/getUrl");
const { UserSubscription } = require("../../Models/UserSubscription");
const fs = require("fs");
const path = require("path");
var pdf = require("dynamic-html-pdf");
const {
  sendEmailWithAttach,
  sendEmailWithAttachZip,
} = require("../../utils/sendEmail");
const { paginate } = require("../../config/Paginate");
const { User } = require("../../Models/User");
const { length } = require("joi/lib/types/array");
const moment = require("moment");
const AdmZip = require("adm-zip");
const { getTz } = require("../../Services/CommonService");
const geoip = require("geoip-lite");
const requestIp = require("request-ip");
const { Review } = require("../../Models/Review");
const getSymbolFromCurrency = require("currency-symbol-map");

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

  let arr = [];
  let arrId = [];
  let allData = [];
  async.series([
    (next) => {
      Order.find(
        {
          user_id: user_id,
        },
        ["_id", "amount", "total", "created_at", "unique_id"]
      )
        .sort({ created_at: -1 })
        .exec((err, data) => {
          if (data != null) {
            data = filterUserNew1(data, req);
          } else {
            data = [];
          }

          const results = data.slice(startIndex, endIndex);
          const url = `/orders?limit=${limit}`;

          console.log(
            "234567: ",
            allData.length,
            page,
            limit,
            results.length,
            url
          );

          return sendResponse(
            res,
            true,
            HttpCode.OK,
            {
              data: results,
              ...paginate(results.length, page, limit, results.length, url),
              // data: allData,
              // limit,
              // skip,
            },
            messages.CRUD.RETRIEVED("Product")
          );
        });
    },
  ]);
};

const indexWeb = async (req, res) => {
  const query = req.query;
  const user_id = req?.user?.data?.user_id;

  // let where = {},
  //   skip = 0,
  //   limit = config.APP_CONSTANTS.PAGINATION_SIZE;
  // if (query.skip) {
  //   skip = parseInt(query.skip);
  // }

  // if (query.limit) {
  //   limit = parseInt(query.limit);
  // }
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

  let arr = [];
  let arrId = [];
  let allData = [];

  async.series([
    (next) => {
      Order.find(
        {
          user_id: user_id,
        },
        [
          "products.product_id",
          "products.image",
          "products.name",
          "products.unit",
          "products.subtotal",
          "products.purchaseDPI",
          "products.purchaseFileType",
          "products.unit_price",
          "_id",
          "user_id",
          "amount",
          "total",
          "tracking_number",
          "created_at",
          "unique_id",
          "payment_gateway",
        ]
        // { skip, limit }
      )
        // .skip(skip)
        // .limit(limit)
        // .lean()
        .sort({ created_at: -1 })
        .exec(async (err, data) => {
          if (data != null) {
            data = await filterUser(data, req);
          } else {
            data = [];
          }

          let reviewData = await getReviewData(data);

          const results = reviewData.slice(startIndex, endIndex);
          const url = `/orders?limit=${limit}`;

          return sendResponse(
            res,
            true,
            HttpCode.OK,
            {
              data: results,
              ...paginate(reviewData.length, page, limit, results.length, url),
              // data: allData,
              // limit,
              // skip,
            },
            messages.CRUD.RETRIEVED("Product")
          );
        });
    },
  ]);
};

const getReviewData = async (arr) => {
  let i = 0;
  if (arr.length != 0) {
    const newData = await arr.map(async (val, key) => {
      let products = val.products;

      let newData1 = await getBaseReviews(val, products);

      let newData = {
        ...val,
        products: newData1,
      };

      return newData;
    });
    return Promise.all(newData);
  } else {
    return Promise.all(arr);
  }
};

const getBaseReviews = async (val, products) => {
  let newProductData = await Promise.all(
    products.map(async (newVal, newKey) => {
      let reviewData = await getReviews(val._id, newVal.product_id);
      let arr = [];
      let newProducts = {
        ...newVal,
        my_review: reviewData,
      };

      return newProducts;
    })
  );
  return newProductData;
};

const getReviews = async (val, product_id) => {
  const results = await Review.findOne(
    { order_id: val, product_id: product_id },
    ["_id", "comment", "order_id", "product_id", "rating", "user_id"],
    (err, data) => {
      if (err) {
        return null;
      }

      return data;
    }
  );

  return results;
};

function filterUserNew(arr, req, data) {
  arr = arr.map((item) => ({
    ...item,
    my_review: data,
  }));

  return arr;
}

async function filterUser(data, req) {
  data = await data.map((item) => {
    const check = typeof item?.products === "string";
    return {
      ...item?._doc,
      // products: item?.products.length != 0 ? JSON.parse(item?.products[0]) : "",
      tracking_number: item?._id,
      created_at_new: item.created_at,
      created_at: moment(item.created_at).format("DD/MM/YYYY h:mma"),
      // created_at: "1",
      // total_amount: item?.total,
      // amount: item?.total,
      // paid_total: item?.total,
      // shipping_charge: 0,
      sales_tax: 0,
      discount: 0,
      // wallet_total: {
      //   wallet_point: {
      //     amount: 0,
      //   },
      // },
    };
  });

  return data;
}

function filterUserNew1(data, req) {
  data = data.map((item) => {
    const dataNew = {
      ...item?._doc,
      tracking_number: item?.unique_id,
      created_at: moment(item.created_at).format("DD/MM/YYYY h:mma"),
    };
    delete dataNew?.unique_id;
    return dataNew;
  });

  return data;
}

// Create Order for web
const createWeb = (req, res) => {
  const body = req.body;

  async.series([
    (next) => {
      let { error } = createRequestNew(body);
      if (error) {
        return sendResponse(
          res,
          false,
          HttpCode.UNPROCESSABLE_ENTITY,
          null,
          error
        );
      }
      // if (body.products.includes("")) {
      //   return sendResponse(
      //     res,
      //     false,
      //     HttpCode.UNPROCESSABLE_ENTITY,
      //     null,
      //     "Products field is required!"
      //   );
      // }
      next();
    },
    (next) => {
      OrderService.createOrder(body, (err, data) => {
        if (err) {
          return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
        }

        if (data?._id != undefined) {
          GenerateInvoice(data?._id);
          const text = "Invoice";
          // const path = `/public/pdf/${data?._id}.pdf`;
          const path = __basedir + `/public/pdf/${data?._id}.pdf`;
          if (req?.user?.data?.email != undefined) {
            sendEmailWithAttach(req?.user?.data?.email, "Invoice", text, path);
          }
        }

        if (body.payment_gateway == "SUBSCRIPTION") {
          const totalProducts = body.products.length;
          const {tif, png, jpg} = req.body
          let PNG = Number(png)
          let JPG = Number(jpg)
          let TIF = Number(tif)
          const unit =
            body.products != "" || body.products != undefined
              ? body.products.length != 0
                ? body.products[0].unit
                : ""
              : "";
          const user_id = req?.user?.data?.user_id;

          let pId = body.pId.split(","); //user subcription Id

          let inc = 0;
          const resData = pId.map(async (userSub) => {
            inc = inc + 1;
            await UserSubscription.findOne(
              // { user_id: user_id, _id: { $in: pId } },
              // { user_id: user_id, _id: body.pId },
              { user_id: user_id, _id: userSub },
              // { user_id: user_id, file_type: unit.toLowerCase() },
              [],
              {}
            )
              .populate("package_id")
              .populate("file_type")
              .sort({ _id: -1 })
              .exec(async (err, dataNew) => {
                const qnty = dataNew?.qnty ?? 0;
                let used_qnty = dataNew?.used_qnty ?? 0;
                let available_qnty = dataNew?.available_qnty ?? 0;

                let totalQnty = Number(available_qnty) - Number(dataNew.file_type.name == 'jpg' && JPG > 0 ? JPG : dataNew.file_type.name == 'png' && PNG > 0 ? PNG : dataNew.file_type.name == 'tif' && TIF > 0 ? TIF : 0);
                // let totalQnty = Number(available_qnty) - Number(totalProducts);
                // const totalQnty = Number(qnty) - Number(totalProducts);
                let totalUsed = Number(used_qnty) + Number(dataNew.file_type.name == 'jpg' && JPG > 0 ? JPG : dataNew.file_type.name == 'png' && PNG > 0 ? PNG : dataNew.file_type.name == 'tif' && TIF > 0 ? TIF : 0);
                // let totalUsed = Number(used_qnty) + Number(totalProducts);
                if(totalQnty < 0){
                  if(dataNew.file_type.name == 'jpg' && JPG > 0){
                    JPG = Number(JPG) - Number(available_qnty)
                  }else if(dataNew.file_type.name == 'png' && PNG > 0){
                    PNG = Number(PNG) - Number(available_qnty)
                  }else if(dataNew.file_type.name == 'tif' && TIF > 0){
                    TIF = Number(TIF) - Number(available_qnty)
                  }
                }else{
                  if(dataNew.file_type.name == 'jpg' && JPG > 0){
                    JPG = Number(JPG) - Number(available_qnty - totalQnty)
                  }else if(dataNew.file_type.name == 'png' && PNG > 0){
                    PNG = Number(PNG) - Number(available_qnty - totalQnty)
                  }else if(dataNew.file_type.name == 'tif' && TIF > 0){
                    TIF = Number(TIF) - Number(available_qnty - totalQnty)
                  }
                }

                let totalAvailble = Number(totalQnty > 0 ? totalQnty : 0);

                let changedataNew = {};
                if (totalAvailble <= 0) {
                  changedataNew = {
                    used_qnty: totalUsed > qnty? qnty : totalUsed,
                    available_qnty: totalAvailble,
                    status: "inactive",
                  };
                } else {
                  changedataNew = {
                    used_qnty: totalUsed > qnty? qnty : totalUsed,
                    available_qnty: totalAvailble,
                  };
                }

                await UserSubscription.updateOne(
                  { _id: userSub },
                  changedataNew
                );
              });
            return userSub;
          });
          return sendResponse(
            res,
            true,
            HttpCode.OK,
            { data },
            messages.CRUD.CREATED("Order")
          );
        } else {
          // next();
          return sendResponse(
            res,
            true,
            HttpCode.OK,
            { data },
            messages.CRUD.CREATED("Order")
          );
        }
      });
    },
    (next) => {
      return sendResponse(
        res,
        true,
        HttpCode.OK,
        {},
        messages.CRUD.CREATED("Order")
      );
    },
  ]);
};

const create = (req, res) => {
  const body = req.body;

  async.series([
    (next) => {
      let { error } = createRequestNew(body);
      if (error) {
        return sendResponse(
          res,
          false,
          HttpCode.UNPROCESSABLE_ENTITY,
          null,
          error
        );
      }
      // if (body.products.includes("")) {
      //   return sendResponse(
      //     res,
      //     false,
      //     HttpCode.UNPROCESSABLE_ENTITY,
      //     null,
      //     "Products field is required!"
      //   );
      // }
      next();
    },
    (next) => {
      OrderService.createOrder(body, (err, data) => {
        if (err) {
          return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
        }

        if (data?._id != undefined) {
          GenerateInvoice(data?._id);
          const text = "Invoice";
          // const path = `/public/pdf/${data?._id}.pdf`;
          const path = __basedir + `/public/pdf/${data?._id}.pdf`;
          if (req?.user?.data?.email != undefined) {
            sendEmailWithAttach(req?.user?.data?.email, "Invoice", text, path);
          }
        }

        if (body.payment_gateway == "SUBSCRIPTION") {
          const totalProducts = body.products.length;
          const unit =
            body.products != "" || body.products != undefined
              ? body.products.length != 0
                ? body.products[0].unit
                : ""
              : "";
          const user_id = req?.user?.data?.user_id;

          let pId = body.pId.split(","); //user subcription Id

          let inc = 0;
          const resData = pId.map(async (userSub) => {
            inc = inc + 1;
            await UserSubscription.findOne(
              // { user_id: user_id, _id: { $in: pId } },
              // { user_id: user_id, _id: body.pId },
              { user_id: user_id, _id: userSub },
              // { user_id: user_id, file_type: unit.toLowerCase() },
              [],
              {}
            )
              .populate("package_id")
              .populate("file_type")
              .sort({ _id: -1 })
              .exec(async (err, dataNew) => {
                const qnty = dataNew?.qnty ?? 0;
                let used_qnty = dataNew?.used_qnty ?? 0;
                let available_qnty = dataNew?.available_qnty ?? 0;

                let totalQnty = Number(available_qnty) - Number(1);
                // let totalQnty = Number(available_qnty) - Number(totalProducts);
                // const totalQnty = Number(qnty) - Number(totalProducts);
                let totalUsed = Number(used_qnty) + Number(1);
                // let totalUsed = Number(used_qnty) + Number(totalProducts);

                let totalAvailble = Number(totalQnty > 0 ? totalQnty : 0);

                let changedataNew = {};
                if (totalAvailble <= 0) {
                  changedataNew = {
                    used_qnty: totalUsed,
                    available_qnty: totalAvailble,
                    status: "inactive",
                  };
                } else {
                  changedataNew = {
                    used_qnty: totalUsed,
                    available_qnty: totalAvailble,
                  };
                }

                await UserSubscription.updateOne(
                  { _id: userSub },
                  changedataNew
                );
              });
            return userSub;
          });
          return sendResponse(
            res,
            true,
            HttpCode.OK,
            { data },
            messages.CRUD.CREATED("Order")
          );
        } else {
          // next();
          return sendResponse(
            res,
            true,
            HttpCode.OK,
            { data },
            messages.CRUD.CREATED("Order")
          );
        }
      });
    },
    (next) => {
      return sendResponse(
        res,
        true,
        HttpCode.OK,
        {},
        messages.CRUD.CREATED("Order")
      );
    },
  ]);
};

const show = async (req, res) => {
  const id = req.params.id;

  let arr = [];
  async.series([
    (next) => {
      ReviewService.getReview(
        { order_id: id },
        {},
        {},
        ["_id", "comment", "order_id", "product_id", "rating", "user_id"],
        (err, data) => {
          if (err) {
            return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
          }
          arr.push(data);
        }
      );
      next();
    },
    (next) => {
      OrderService.getOrder(
        { _id: id },
        {},
        {},
        [
          "products.product_id",
          // "products.order_quantity",
          // "products.unit_price",
          "products.name",
          "products.subtotal",
          "products.image",
          "products.unit",
          "products.purchaseDPI",
          "products.purchaseFileType",
          "products.unit_price",
          "_id",
          "user_id",
          "amount",
          "total",
          "payment_gateway",
          "created_at",
          "unique_id",
        ],
        (err, data) => {
          if (err) {
            return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
          }
          // var offset = moment().utcOffset();
          // let currentTimeZone = new Intl.DateTimeFormat().resolvedOptions()
          //   .timeZone;
          // console.log("currentTimeZone: ", currentTimeZone);

          // var ip =
          //   req.headers["X-Client-IP"] || req.socket.remoteAddress || null;
          // // var ip =
          // //   req.headers["x-forwarded-for"] || req.socket.remoteAddress || null;
          // // let ip = req.connection.remoteAddress;
          // // const clientIp = requestIp.getClientIp(req);
          // console.log("ip: ", req.headers["X-Client-IP"]);
          // var geo = geoip.lookup("103.106.21.5");
          // // var geo = geoip.lookup("103.106.21.5");
          // console.log("geo: ", geo);

          // 103.106.21.14
          // getTz();

          data = {
            ...data?._doc,
            tracking_number: data?._id,
            created_at_new:
              data?.created_at != undefined ? data?.created_at : "",
            created_at:
              data?.created_at != undefined
                ? moment(data?.created_at)
                    // .utc(data?.created_at)
                    // .tz(currentTimeZone)
                    // .tz("Asia/Kolkata")
                    .format("DD/MM/YYYY h:mma")
                : // moment(data?.created_at).local().format("DD/MM/YYYY h:mma")
                  "",

            subtotal: data?.subtotal,
            // total_amount: data?.total,
            // amount: data?.total,
            // paid_total: data?.total,
            // shipping_charge: 0,
            sales_tax: 0,
            discount: 0,
            // wallet_total: {
            //   wallet_point: {
            //     amount: 0,
            //   },
            // },
            my_review: arr[0],
          };

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

const checkoutPay = (req, res) => {
  const id = req.params.id;
  const body = req.body;
  const email = req?.user?.data?.email;
  const _id = req?.user?.data?.user_id;
  var config = require("../../src/db/pickbazar/settings.json");
  let token = body.token;

  let arr = [];
  async.series([
    async (next) => {
      try {
        // const customer = await stripe.customers.retrieve("cus_4QFOF3xrvBT2nU");

        // if(customer != n)
        // const token = await stripe.tokens.create({
        //   card: {
        //     number: "4000002760003184",
        //     // number: "4242424242424242",
        //     exp_month: 5,
        //     exp_year: 2024,
        //     cvc: "314",
        //   },
        // });

        const customer = await stripe.customers.create({
          source: token.id,
          email: email,
        });

        const paymentIntent = await stripe.paymentIntents.create({
          amount: body.price * 100,
          currency: config.options.currency.toLowerCase(),
          customer: customer.id,
          payment_method: token.card.id,
          receipt_email: email,
          confirm: true,
        });

        // // console.log("token: ", token);
        // const confirmPaymentIntent = await stripe.paymentIntents.confirm(
        //   paymentIntent.id,
        //   { payment_method: token.card.id }
        // );
        // // const captureHoldIntent = await stripe.paymentIntents.capture(
        // //   paymentIntent.id
        // // );
        // console.log("confirmPaymentIntent: ", confirmPaymentIntent);

        createTransaction({
          user_id: _id,
          amount: body.price,
          payment_intent_id: paymentIntent.id,
          customer_id: paymentIntent.customer,
          charge_id: paymentIntent.latest_charge,
          payment_method: paymentIntent.payment_method,
          status: paymentIntent.status,
          last4: token.card.last4,
          brand: token.card.brand,
          pay_type: body.type,
          unique_order_id: body.unique_id,
          payment_gateway: body.payment_gateway,
        });
        if (paymentIntent.status == "requires_action") {
          return sendResponse(
            res,
            false,
            422,
            {
              link: paymentIntent.client_secret,
              url: paymentIntent.next_action.use_stripe_sdk.stripe_js,
            },
            "Requires action"
          );
        }

        return sendResponse(
          res,
          true,
          HttpCode.OK,
          { data: paymentIntent },
          messages.CRUD.RETRIEVED("Product")
        );
        // } else {
        //   return sendResponse(
        //     res,
        //     false,
        //     HttpCode.SERVER_ERROR,
        //     null,
        //     "Something went wrong!"
        //   );
        // }
      } catch (error) {
        if (error.raw != undefined) {
          if (error.raw.payment_intent != undefined) {
            if (error.raw.payment_intent.status == "requires_payment_method") {
              const paymentIntent = error.raw.payment_intent;
              createTransaction({
                user_id: _id,
                amount: body.price,
                payment_intent_id: paymentIntent.id,
                customer_id: paymentIntent.customer,
                charge_id: paymentIntent.latest_charge,
                payment_method: paymentIntent.payment_method,
                status: "failed",
                last4: token.card.last4,
                brand: token.card.brand,
                failed_error: error.raw.message,
                pay_type: body.type,
                unique_order_id: body.unique_id,
                payment_gateway: body.payment_gateway,
              });
            }
          }
        }

        return sendResponse(res, false, HttpCode.SERVER_ERROR, null, error);
      }
    },
  ]);
};

const createTransaction = async (body) => {
  await TransactionService.createTransaction(body, (err, data) => {
    if (err) {
      return err;
      // return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
    }
    return data;
  });
};

const GenerateInvoice = (id) => {
  // const GenerateInvoice = (req, res) => {
  // Create a browser instance
  // const id = req.params.id;

  let product = [];
  let order = [];
  async.series([
    (next) => {
      OrderService.getOrder({ _id: id }, (err, data) => {
        if (err) {
          console.log("err: ", err);
          // return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
        }

        if (data != undefined) {
          product.push(...data.products);
        }
        const date = new Date(data.created_at).toLocaleDateString();

        order.push({
          _id: data._id,
          total: Number(data.total).toFixed(1),
          amount: Number(data.amount).toFixed(1),
          created_at: date,
          payment_gateway: data.payment_gateway,
          unique_id: data.unique_id,
        });
        next();
      });
    },
    (next) => {
      var base_path = __basedir;

      const filename = path.join(base_path, "/resources/invoice.html");
      const html = fs.readFileSync(filename, "utf-8");

      var options = {
        format: "A3",
        orientation: "portrait",
        childProcessOptions: {
          env: {
            OPENSSL_CONF: "/dev/null",
          },
        },
        // border: "10mm",
      };

      let getCurrency = getSettings();

      product = product.map((res) => {
        return {
          ...res,
          currency: getCurrency.currency,
          unit_price: Number(res.unit_price).toFixed(1),
          // image: fullUrl(req) + "/product/" + res.image,
        };
      });

      // let image = "/logo.png";
      // let image = fullUrl(req) + "/logo.png";
      let image = env.APP_URL_IP + "/logo.png";
      let totalPriceNew =
        product != undefined
          ? product.length > 1
            ? product.reduce((pre, item) => pre?.unit_price + item?.unit_price)
            : product[0]?.unit_price ?? 0
          : 0;

      var document = {
        type: "file", // 'file' or 'buffer'
        template: html,
        context: {
          data: product,
          totalPriceNew: Number(totalPriceNew).toFixed(1),
          getCurrency: getCurrency,
          order: order[0],
          image: image,
          tax: Number(0).toFixed(1),
        },
        path: base_path + `/public/pdf/${id}.pdf`, // it is not required if type is buffer
      };

      pdf
        .create(document, options)
        .then((response) => {
          // res.setHeader("Content-Type", "application/docx");
          // res.setHeader("Accept-Encoding", "base64");
          // res.setHeader("Access-Control-Allow-Origin", "*");
          // res.download(response.filename);
          // res.download(base_path + `/public/pdf/${id}.pdf`);
          // return sendResponse(
          //   res,
          //   true,
          //   HttpCode.OK,
          //   null,
          //   "PDF Generate successfully."
          // );
          return response;
        })
        .catch((error) => {
          console.error(error);
          // return sendResponse(res, false, HttpCode.SERVER_ERROR, null, error);
        });
    },
  ]);
};

const GenerateInvoiceForSubscriptions = (id) => {
  // const GenerateInvoice = (req, res) => {
  // Create a browser instance
  // const id = req.params.id;

  let product = [];
  let order = [];
  async.series([
    (next) => {
      UserSubscription.findOne(
        { _id: id },
        [
          "_id",
          "user_id",
          "file_type",
          "qnty",
          "price",
          "created_at",
          "unique_id",
          "payment_method",
          "status",
          "available_qnty",
          "used_qnty",
        ],
        {}
      )
        .populate("file_type", "_id name")
        .populate({
          path: "package_id",
          select: "_id file_type qnty price ",
          populate: {
            path: "package_type",
            model: "PackageType",
            select: "_id name",
          },
        })
        .sort({ _id: -1 })
        .lean()
        .exec((err, data) => {
          if (err) {
            return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
          }

          const date = new Date(data.created_at).toLocaleDateString();

          order.push({
            package_type: data.package_id.package_type.name.toUpperCase(),
            qnty: data.qnty,
            price: Number(data.price).toFixed(1),
            file_type: data.file_type.name.toUpperCase(),
            unique_id: data.unique_id,
            payment_method: data.payment_method,
            created_at: date,
            tax:
              data.tax != undefined
                ? Number(data.tax).toFixed(1)
                : Number(0).toFixed(1),
            total:
              data.total != undefined
                ? Number(data.total).toFixed(1)
                : Number(data.price).toFixed(1),
          });

          // if (data != null) {
          //   data.tax = 0;
          //   data.total = data.price;
          //   data.created_at_new = data.created_at;
          //   data.created_at = moment(data.created_at).format(
          //     "DD/MM/YYYY h:mma"
          //   );
          // }

          // console.log("data: ", data);
          // process.exit();
          next();
        });
    },
    (next) => {
      var base_path = __basedir;

      const filename = path.join(
        base_path,
        "/resources/subscription_invoice.html"
      );
      const html = fs.readFileSync(filename, "utf-8");
      // console.log("html: ", html);
      // process.exit();

      var options = {
        format: "A3",
        orientation: "portrait",
        childProcessOptions: {
          env: {
            OPENSSL_CONF: "/dev/null",
          },
        },
        // border: "10mm",
      };

      let getCurrency = getSettings();

      order = order.map((res) => {
        return {
          ...res,
          currency: getCurrency.currency,
        };
      });
      // let totalPriceNew =
      //   product != undefined
      //     ? product.length > 1
      //       ? product.reduce((pre, item) => pre.unit_price + item.unit_price)
      //       : product[0].unit_price
      //     : 0;

      // console.log("order: ", order);
      // process.exit();
      let image = env.APP_URL + "/logo.png";

      var document = {
        type: "file", // 'file' or 'buffer'
        template: html,
        context: {
          data: order[0],
          image: image,
          // totalPriceNew: totalPriceNew,
          // getCurrency: getCurrency,
          // order: order[0],
        },
        path: base_path + `/public/pdf/${id}.pdf`, // it is not required if type is buffer
      };
      // console.log("document: ", document);
      // process.exit();

      pdf
        .create(document, options)
        .then((response) => {
          // res.setHeader("Content-Type", "application/docx");
          // res.setHeader("Accept-Encoding", "base64");
          // res.setHeader("Access-Control-Allow-Origin", "*");
          // res.download(response.filename);
          // res.download(base_path + `/public/pdf/${id}.pdf`);
          // return sendResponse(
          //   res,
          //   true,
          //   HttpCode.OK,
          //   null,
          //   "PDF Generate successfully."
          // );
          return response;
        })
        .catch((error) => {
          console.error(error);
          // return sendResponse(res, false, HttpCode.SERVER_ERROR, null, error);
        });
    },
  ]);
};

const getSettings = (req, res) => {
  var config = require("../../src/db/pickbazar/settings.json");
  const symbol = getSymbolFromCurrency(config.options.currency);
  const data = {
    currency: symbol,
    code: config.options.currency,
  };
  return data;
};

const GenerateInvoiceDownload = (req, res) => {
  const id = req.params.id;
  const url = __basedir + `/public/pdf/${id}.pdf`;
  if (!fs.existsSync(url)) {
    async.series([
      (next)=>{
        GenerateInvoice(id);
        setTimeout(() => {
          next()
        },4000);
      },
      (next)=>{
        return res.download(url);
      }
    ])
    // return sendResponse(res, false, HttpCode.NOT_FOUND, null, "File not found");
  }else{
    return res.download(url);
  }
};

const GenerateInvoiceSubscriptionDownload = (req, res) => {
  const id = req.params.id;
  const url = __basedir + `/public/pdf/${id}.pdf`;
  if (!fs.existsSync(url)) {
    async.series([
      (next)=>{
        GenerateInvoiceForSubscriptions(id);
        setTimeout(() => {
          next()
        },4000);
      },
      (next)=>{
        return res.download(url);
      }
    ])
    // return sendResponse(res, false, HttpCode.NOT_FOUND, null, "File not found");
  }else{
    return res.download(url);
  }
};

const convertZip = async (zipData) => {
  const body = zipData;
  const products = body.products[0];

  let arr = [];
  products.map(async (res) => {
    const file = res?.image?.split("/")[3];
    await arr.push(file);
  });

  if (arr.length == body.products.length) {
    // const arr = [
    //   "public/original/800x1200/jenn-buxton-VbehmJNj5Tc-unsplash.jpg",
    //   "public/original/1500X2250/jenn-buxton-VbehmJNj5Tc-unsplash.jpg",
    //   "public/original/3600X5400/jenn-buxton-VbehmJNj5Tc-unsplash.jpg",
    //   "public/original/5400X8100/jenn-buxton-VbehmJNj5Tc-unsplash.jpg",
    // ];

    var zip = new AdmZip();
    var fs = require("fs-extra");

    let count = 0;
    arr.map(async (res) => {
      count = count + 1;
      const file = res.split("/");

      zip.addFile(file[2] + "/" + file[3], fs.readFileSync(res), "", 0644);
    });

    if (count == arr.length) {
      zip.writeZip("./files.zip");
      // const text = `Dear ${req?.user?.data?.email},<br> In this email your purchased image attached. Thank you for purchasing images from image arc.`;
      // const path = __basedir + `/files.zip`;
      // sendEmailWithAttachZip(
      //   req?.user?.data?.email,
      //   "Images",
      //   text,
      //   path,
      //   "images.zip"
      // );
      // return sendResponse(res, true, HttpCode.OK, {}, "");
      // return true;
      // return res.download(__basedir + `/files.zip`);
      return sendResponse(res, true, HttpCode.OK, {}, "3");
    }
    return sendResponse(res, true, HttpCode.OK, {}, "2");
  }
  return sendResponse(res, true, HttpCode.OK, {}, "1");
};

const download = (req, res) => {
  try {
    const body = req.body;
    const name = body.name;
    const purchaseFileType = body.purchaseFileType;
    if (name == undefined || name == "") {
      return sendResponse(
        res,
        false,
        HttpCode.SERVER_ERROR,
        null,
        "The name field is required"
      );
    }
    if (purchaseFileType == undefined || purchaseFileType == "") {
      return sendResponse(
        res,
        false,
        HttpCode.SERVER_ERROR,
        null,
        "The purchased file type field is required"
      );
    }
    // return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
    // const name = req.params.name;

    // const body = req.body;
    let filename = name.replace(/\.[^/.]+$/, "");
    let filenamedownload = filename + "." + body.purchaseFileType;

    const url =
      __basedir +
      `/public/original/${body.purchaseFileType}/${filenamedownload}`;
    // `/public/original/${body.purchaseFileType}/${body.purchaseDPI}/${filenamedownload}`;

    if (!fs.existsSync(url)) {
      return sendResponse(
        res,
        false,
        HttpCode.NOT_FOUND,
        null,
        "File not found"
      );
    }

    let link = `${env.APP_URL}/original/${body.purchaseFileType}/${filenamedownload}`;

    return sendResponse(
      res,
      true,
      HttpCode.OK,
      { data: link, name: filenamedownload },
      ""
    );
    // return url;
    // return res.download(url);
  } catch (error) {
    return sendResponse(res, false, HttpCode.SERVER_ERROR, null, error);
  }

  // return res.download(__basedir + `/public/original/1500X2250/${name}`);
};

module.exports = {
  index: index,
  indexWeb: indexWeb,
  create: create,
  createWeb: createWeb, 
  show: show,
  checkoutPay: checkoutPay,
  GenerateInvoice: GenerateInvoice,
  GenerateInvoiceDownload: GenerateInvoiceDownload,
  GenerateInvoiceSubscriptionDownload: GenerateInvoiceSubscriptionDownload,
  download: download,
  convertZip: convertZip,
};

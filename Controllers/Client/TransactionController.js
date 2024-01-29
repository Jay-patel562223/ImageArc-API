const { sendResponse } = require("../../Support/APIResponse");
const HttpCode = require("../../Support/HttpCode");
const {
  ReviewService,
  TransactionService,
  UserService,
} = require("../../Services");
const async = require("async");
const messages = require("../../lang/en");
const config = require("../../config/index");
const { WishlistService } = require("../../Services");
const { Product } = require("../../Models/Product");
const { fullUrl } = require("../../utils/getUrl");
const { paginate } = require("../../config/Paginate");
const { func } = require("joi");
const {
  Transaction,
  createRequest,
  razorpayOrderRequest,
} = require("../../Models/Transaction");
const env = require("dotenv").config().parsed;

const stripe = require("stripe")(env.STRIPE_SECRET_KEY);

const index = (req, res) => {
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

  let allData = [];
  async.series([
    (next) => {
      Transaction.find({ user_id: user_id }, [])
        .sort({ _id: -1 })
        .exec((err, data) => {
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

const create = (req, res) => {
  const body = req.body;

  async.series([
    (next) => {
      let { error } = createRequest(body);
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
      const data = {
        user_id: _id,
        amount: body.price,
        payment_intent_id: paymentIntent.id,
        customer_id: paymentIntent.customer,
        charge_id: paymentIntent.latest_charge,
        payment_method: paymentIntent.payment_method,
        status: paymentIntent.status,
        last4: body.token.card.last4,
        brand: body.token.card.brand,
        pay_type: body.type,
      };

      TransactionService.createTransaction(data, (err, data) => {
        if (err) {
          return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
        }
        return sendResponse(
          res,
          true,
          HttpCode.OK,
          {
            data: data,
          },
          messages.CRUD.CREATED("Transaction")
        );
      });
    },
  ]);
};

const createRazorPayTransactions = async (req, res) => {
  try {
    const Razorpay = require("razorpay");
    var instance = new Razorpay({
      key_id: env.RAZORPAYKEY,
      key_secret: env.RAZORPAYSECRET,
    });
    const user_id = req?.user?.data?.user_id;
    const razorpay_payment_id = req.body.razorpay_payment_id;
  
    const payment_details = await instance.payments.fetch(razorpay_payment_id)
    
    const amount = (payment_details?.amount)/100;
    const payment_intent_id = payment_details?.id;
    const charge_id = payment_details?.charge_id ? payment_details?.charge_id : null;
    const payment_method = payment_details?.method;
    const payment_gateway = payment_details?.notes?.payment_gateway;
    const pay_type = payment_details?.notes?.type;
    const brand = payment_details?.card?.network;
    const last4 = payment_details?.card?.last4;
    const status = payment_details?.status;
    const failed_error = payment_details?.error_description;
    const razorpay_id = payment_details?.id;
    const razorpay_card_id = payment_details?.card?.id;
    const razorpay_method = payment_details?.method;
    const razorpay_bank = payment_details?.bank;
    const unique_order_id = payment_details?.notes?.unique_id;

    const allData = {
      user_id: user_id,
      razorpay_id: razorpay_payment_id,
      amount: amount,
      unique_order_id: unique_order_id,
      payment_intent_id: payment_intent_id,
      charge_id: charge_id,
      payment_method: payment_method,
      payment_gateway: payment_gateway,
      pay_type: pay_type,
      brand: brand,
      last4: last4,
      status: status,
      failed_error: failed_error,
      razorpay_id: razorpay_id,
      razorpay_card_id: razorpay_card_id,
      razorpay_method: razorpay_method,
      razorpay_bank: razorpay_bank
    };

    // const allData = {
    //   user_id: "",
    //   amount: entity.amount,
    //   last4: entity.card.last4,
    //   brand: entity.card.network,
    //   payment_gateway: "RAZORPAY",
    //   razorpay_id: entity.id,
    //   razorpay_card_id: entity.card.id,
    //   razorpay_method: entity.method,
    //   razorpay_bank: entity.bank,
    //   failed_error: entity.error_description,
    // };

    // UserService.getUser({ _id: user_id }, (err, data) => {
    //   if (err) {
    //     return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
    //   }

    TransactionService.createTransaction(allData, (err, data) => {
      if (err) {
        return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
      }
      return sendResponse(
        res,
        true,
        HttpCode.OK,
        {
          data: data,
        },
        messages.CRUD.CREATED("Transaction")
      );
    });
    // });
  } catch (error) {
    if(error.statusCode == 400 && error.error.description == 'The id provided does not exist'){
      return sendResponse(res, false, HttpCode.BAD_REQUEST, null, "Please, Enter a valid razorpay payment ID.")
    }
    return sendResponse(res, false, HttpCode.SERVER_ERROR, null, error.error.description);
  }
};

const createRazorPayOrder = (req, res) => {
  const body = req.body;
  async.series([
    (next) => {
      let { error } = razorpayOrderRequest(body);
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
      try {
        const Razorpay = require("razorpay");
        var instance = new Razorpay({
          key_id: env.RAZORPAYKEY,
          key_secret: env.RAZORPAYSECRET,
        });

        var config = require("../../src/db/pickbazar/settings.json");
        // const symbol = getSymbolFromCurrency(config.options.currency);

        var options = {
          amount: body.amount * 100, // amount in the smallest currency unit
          currency: config.options.currency,
          receipt: "order_rcptid_11",
        };
        instance.orders.create(options, function (err, order) {
          return sendResponse(
            res,
            true,
            HttpCode.OK,
            {
              data: order,
            },
            messages.CRUD.CREATED("Transaction")
          );
        });
      } catch (error) {
        console.log("error: ", error);

        return sendResponse(res, false, HttpCode.SERVER_ERROR, null, error);
      }
    },
  ]);
};

const createStripePI = async (req, res) => {
  const body = req.body;
  async.series([
    (next) => {
      let { error } = razorpayOrderRequest(body);
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
    async (next) => {
      try {
        const email = req?.user?.data?.email;
        var config = require("../../src/db/pickbazar/settings.json");

        const customer = await stripe.customers.create();
        const ephemeralKey = await stripe.ephemeralKeys.create(
          { customer: customer.id },
          { apiVersion: "2022-11-15" }
        );

        const paymentIntent = await stripe.paymentIntents.create({
          amount: body.amount * 100,
          currency: config.options.currency.toLowerCase(),
          customer: customer.id,
          // automatic_payment_methods: {
          //   enabled: true,
          // },
          payment_method_types: ["card"],
        });

        return sendResponse(
          res,
          true,
          HttpCode.OK,
          {
            data: {
              client_secret: paymentIntent.client_secret,
              ephemeralKey: ephemeralKey.secret,
              customer: customer.id,
              publishableKey: env.STRIPE_PUBLIC_KEY,
            },
          },
          messages.CRUD.CREATED("Transaction")
        );
        // res.json({
        //   paymentIntent: paymentIntent.client_secret,
        //   ephemeralKey: ephemeralKey.secret,
        //   customer: customer.id,
        //   publishableKey:
        //     "pk_test_51MM86BSAsdRxndzeU1edq9ZhHMXi9asoeOw5NhCdEYPifUyiLxCNUHtK3oTnX3EjgohwFiUUjPk6d6xWU6Opf7c100fQqy1kzR",
        // });
      } catch (error) {
        console.log("error: ", error);

        return sendResponse(res, false, HttpCode.SERVER_ERROR, null, error);
      }
    },
  ]);
};

module.exports = {
  index: index,
  create: create,
  createRazorPayTransactions: createRazorPayTransactions,
  createRazorPayOrder: createRazorPayOrder,
  createStripePI: createStripePI,
};

const { sendResponse } = require("../../Support/APIResponse");
const HttpCode = require("../../Support/HttpCode");
const {
  ReviewService,
  TransactionService,
  UserService,
  UserSubscriptionService,
  OrderService,
} = require("../../Services");
const async = require("async");
const messages = require("../../lang/en");
const config = require("../../config/index");
const { createRequest, Wishlist } = require("../../Models/Wishlist");
const { WishlistService } = require("../../Services");
const { Product } = require("../../Models/Product");
const { fullUrl } = require("../../utils/getUrl");
const { paginate } = require("../../config/Paginate");
const { func } = require("joi");
const { UserSubscription } = require("../../Models/UserSubscription");
const env = require("dotenv").config().parsed;
const { sendEmailWithAttach } = require("../../utils/sendEmail");
const OrderController = require("./OrderController");

const stripe = require("stripe")(env.STRIPE_SECRET_KEY);

const webhookSuccess = async (req, res) => {
  const query = req.query;

  const data = req.body.data.object;

  const status =
    data.status == "requires_payment_method" ? "failed" : data.status;

  let allData = "";
  if (data.latest_charge != null || data.latest_charge != undefined) {
    allData = { status: status, charge_id: data.latest_charge };
  } else {
    allData = { status: status };
  }

  TransactionService.updateTransaction(
    {
      payment_intent_id: data.id,
    },
    allData,
    (err, data) => {
      if (err) {
        return err;
      }

      return data;
    }
  );
};

const webhookFailed = async (req, res) => {
  const query = req.query;

  const data = req.body.data.object;

  const status =
    data.status == "requires_payment_method" ? "failed" : data.status;

  TransactionService.updateTransaction(
    {
      payment_intent_id: data.id,
    },
    { status: status , failed_error: data?.last_payment_error?.message},
    (err, data) => {
      if (err) {
        return err;
      }

      return data;
    }
  );
};

const webhookSuccessRazorPay = async (req, res) => {
  const entity = req.body.payload.payment.entity;
  await checkTransaction(entity);
};

const webhookFailedRazorPay = async (req, res) => {
  const entity = req.body.payload.payment.entity;
  await checkTransaction(entity);
};

const checkTransaction = async (entity) => {
  console.log("entity: ", entity);

  await TransactionService.getTransaction(
    {
      razorpay_id: entity.id,
      unique_order_id: entity?.notes?.unique_id,
      // unique_order_id: entity?.notes?.unique_id,
    },
    async (err, data) => {
      if (err) {
        return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
      }

      if (!data && entity.notes?.user_id) {
        // console.log("entitycreate: ");
        // await createTransaction(entity);
        const allData = {
          user_id: entity.notes?.user_id,
          // user_id: entity.notes.user_id,
          // order_id: entity.notes.order_id,
          // order_id: data._id,
          amount: entity.amount / 100,
          razorpay_id: entity.id,
          payment_intent_id: entity.id,
          charge_id: entity?.fee,
          last4: entity.card != undefined ? entity.card.last4 : "",
          brand: entity.card != undefined ? entity.card.network : "",
          payment_gateway: "RAZORPAY",
          razorpay_card_id: entity.card != undefined ? entity.card.id : "",
          brand: entity.card != undefined ? entity.card.network : "",
          razorpay_method: entity.method ?? "",
          payment_method: entity.method ?? "",
          razorpay_bank: entity.bank ?? "",
          failed_error:
            entity.error_description != null ? entity.error_description : "",
          status: entity.status == "authorized" ? "succeeded" : entity.status,
          unique_order_id: entity?.notes?.unique_id,
          pay_type: entity?.notes?.type
          // unique_order_id: entity?.notes?.unique_id,
        };

        await TransactionService.createTransaction(allData, (err, data) => {
          if (err) {
            // console.log("err: ", err);
            return err;
          }
          // console.log("datainner: ");

          return data;
        });
      } else {
        // console.log("entityupdate: ");
        await updateTransaction(entity.id, entity);
      }
    }
  );
};

const createTransaction = async (entity) => {
  if (
    entity.notes.type != undefined &&
    entity.notes.type == "PRODUCT PURCHASE"
  ) {
    // console.log("entity: ");
    // console.log("entity111: ", JSON.parse(entity.notes.products)[0]);
    let productData = "";
    if (
      entity?.notes?.products != undefined &&
      isJsonString(entity.notes.products)
    ) {
      console.log("productData232432: ", entity.notes.products);

      productData = JSON.parse(entity.notes.products);
      if (typeof productData == "string") {
        productData = productData.replaceAll("[", "");
        productData = productData.replaceAll("]", "");
        productData = productData = JSON.parse(productData);
      }
      // productData = typeof productData == "string"
      //   ?
      //   : ;
      // typeof productData == "string"
      //   ? productData.replaceAll("]", "")
      //   : productData;
      // productData = productData.replaceAll("]", "");
    }

    console.log("productData: ", productData);

    const body = {
      user_id: entity.notes.user_id,
      amount: entity.notes.amount,
      price: entity.notes.price,
      paid_total: entity.notes.paid_total,
      total: entity.notes.total,
      payment_gateway: "RAZORPAY",
      // payment_gateway: entity.notes.payment_gateway,
      type: entity.notes.type,
      customer_contact: entity.notes.customer_contact,
      products: productData,
      unique_id: entity?.notes?.unique_id,
    };
    if (entity?.notes?.email != undefined) {
      await OrderService.createOrder(body, async (err, data) => {
        if (err) {
          return err;
        }

        if (data?._id != undefined) {
          OrderController.GenerateInvoice(data?._id);
          const text = "Invoice";
          const path = __basedir + `/public/pdf/${data?._id}.pdf`;
          if (entity?.notes?.email != undefined) {
            sendEmailWithAttach(entity?.notes?.email, "Invoice", text, path);
          }
        }

        const allData = {
          user_id: entity.notes.user_id,
          // order_id: entity.notes.order_id,
          order_id: data._id,
          amount: entity.amount / 100,
          razorpay_id: entity.id,
          last4: entity.card != undefined ? entity.card.last4 : "",
          brand: entity.card != undefined ? entity.card.network : "",
          payment_gateway: "RAZORPAY",
          razorpay_card_id: entity.card != undefined ? entity.card.id : "",
          razorpay_method: entity.method ?? "",
          razorpay_bank: entity.bank ?? "",
          failed_error:
            entity.error_description != null ? entity.error_description : "",
          status: entity.status == "authorized" ? "succeeded" : entity.status,
          unique_order_id: entity?.notes?.unique_id,
        };

        await TransactionService.createTransaction(allData, (err, data) => {
          if (err) {
            return err;
          }
          console.log("datainner: ");

          return data;
        });

        return data;
      });
    }
  }

  let extraData = isJsonString(entity.notes.extraData)
    ? JSON.parse(entity.notes.extraData)
    : "";
  console.log("extraData: ", extraData);
  console.log("extraData123: ", extraData.qnty);
  extraData.status = "active";
  extraData.available_qnty = extraData?.qnty;
  // extraData.available_qnty = data._id;

  if (
    extraData.type != undefined &&
    extraData.type == "SUBSCRIPTION PURCHASE"
  ) {
    if (extraData != "") {
      await UserSubscription.findOne(
        { unique_id: extraData?.unique_id },
        [],
        {}
      ).exec(async (err, data) => {
        if (err) {
          return err;
        }

        if (!data) {
          await UserSubscriptionService.createUserSubscription(
            extraData,
            async (err, data) => {
              if (err) {
                return err;
              }
              const allData = {
                user_id: data.user_id,
                // order_id: entity.notes.order_id,
                order_id: data._id,
                amount: entity.amount / 100,
                razorpay_id: entity.id,
                last4: entity.card != undefined ? entity.card.last4 : "",
                brand: entity.card != undefined ? entity.card.network : "",
                payment_gateway: "RAZORPAY",
                razorpay_card_id:
                  entity.card != undefined ? entity.card.id : "",
                razorpay_method: entity.method ?? "",
                razorpay_bank: entity.bank ?? "",
                failed_error:
                  entity.error_description != null
                    ? entity.error_description
                    : "",
                status:
                  entity.status == "authorized" ? "succeeded" : entity.status,
                unique_order_id: extraData?.unique_id,
              };

              await TransactionService.createTransaction(
                allData,
                (err, data) => {
                  if (err) {
                    return err;
                  }
                  console.log("datainner: ");

                  return data;
                }
              );
            }
          );
        } else {
          await UserSubscriptionService.updateUserSubscription(
            {
              unique_id: extraData?.unique_id,
            },
            extraData,
            (err, data) => {
              if (err) {
                return err;
              }
              return data;
            }
          );
        }
      });
    }
  }
};

function isJsonString(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

const updateTransaction = async (id, entity) => {
  const allData = {
    last4: entity.card != undefined ? entity.card.last4 : "",
    brand: entity.card != undefined ? entity.card.network : "",
    payment_gateway: "RAZORPAY",
    razorpay_card_id: entity.card != undefined ? entity.card.id : "",
    razorpay_method: entity.method ?? "",
    razorpay_bank: entity.bank ?? "",
    failed_error:
      entity.error_description != null ? entity.error_description : "",
    status: entity.status == "authorized" ? "succeeded" : entity.status,
    pay_type: entity?.notes?.type
  };

  await TransactionService.updateTransaction(
    {
      razorpay_id: id,
      unique_order_id: entity?.notes?.unique_id,
    },
    allData,
    (err, data) => {
      if (err) {
        return err;
      }

      return data;
    }
  );
};

const deleteSubscription = (order_id) => {
  TransactionService.deleteTransaction(
    {
      _id: order_id,
    },
    (err, data) => {
      if (err) {
        return err;
      }

      return data;
    }
  );
};

module.exports = {
  webhookSuccess: webhookSuccess,
  webhookFailed: webhookFailed,
  webhookSuccessRazorPay: webhookSuccessRazorPay,
  webhookFailedRazorPay: webhookFailedRazorPay,
};

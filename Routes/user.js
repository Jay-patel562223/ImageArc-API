const express = require("express");
const router = express.Router();
const controller = require("../Controllers/Client");
const { authentication, guestOrAuthenticate } = require("../Middleware");
const multer = require("multer");
const upload = multer();

// auth controller
router.post("/register", upload.any(), controller.AuthController.register);
router.post("/login", upload.any(), controller.AuthController.login);
router.post(
  "/logout",
  authentication,
  upload.any(),
  controller.AuthController.logout
);

router.post(
  "/forgetPassword",
  upload.any(),
  controller.AuthController.forgetPassword
);
router.post(
  "/verifyPassword",
  upload.any(),
  controller.AuthController.verifyPassword
);
router.post(
  "/resetPassword",
  upload.any(),
  controller.AuthController.resetPassword
);
router.get(
  "/getUserDetail",
  // "/loginUser",
  authentication,
  controller.AuthController.getLogginUserData
);

router.post(
  "/changeNotificationStatus",
  authentication,
  upload.any(),
  controller.AuthController.changeNotificationStatus
);

router.post(
  "/emailExistorNot",
  upload.any(),
  controller.AuthController.emailExistorNot
);
router.post(
  "/sendEmailOTP",
  upload.any(),
  controller.AuthController.forgetPassword
);
router.post(
  "/matchEmailOTP",
  upload.any(),
  controller.AuthController.matchEmailOTP
);
router.post(
  "/deleteAccount",
  upload.any(),
  authentication,
  controller.AuthController.deleteAccount
);
router.get("/getSettings", controller.AuthController.getSettings);

// profile controller
router.post(
  "/changePassword",
  authentication,
  upload.any(),
  controller.ProfileController.changePassword
);
router.put(
  "/editProfile/:id",
  authentication,
  upload.any(),
  controller.ProfileController.editProfile
);

// Product Controller
router.get(
  "/products",
  guestOrAuthenticate,
  controller.ProductController.indexForDevice
);
router.get(
  "/products/:id",
  guestOrAuthenticate,
  controller.ProductController.show
);
router.get("/products-web", controller.ProductController.index);
router.get("/products-web/:id", controller.ProductController.showWeb);
router.post(
  "/checkProductExist",
  authentication,
  controller.ProductController.checkProductExist
);

// CategoryManagementController
router.get("/category", controller.CategoryManagementController.index);
router.get(
  "/getProductByCategoryWeb/:id",
  controller.ProductController.getProductByCategoryWeb
);
router.get(
  "/getProductByCategory/:id",
  guestOrAuthenticate,
  controller.ProductController.getProductByCategory
);

router.get(
  "/getProductPrices",
  guestOrAuthenticate,
  controller.ProductController.getProductPrices
);

// router.get("/products-web/:id", controller.ProductController.show);
router.post(
  "/orders/checkout/verify",
  authentication,
  controller.ProductController.verify
);

// Order Controller
router.get("/orders", authentication, controller.OrderController.index);
router.post(
  "/orders",
  authentication,
  upload.any(),
  controller.OrderController.create
);
router.get("/orders/:id", authentication, controller.OrderController.show);

router.get("/ordersWeb", authentication, controller.OrderController.indexWeb);
router.post(
  "/ordersWeb",
  authentication,
  upload.any(),
  controller.OrderController.createWeb
);
router.get("/ordersWeb/:id", authentication, controller.OrderController.show);
router.get(
  "/GenerateInvoice/:id",
  controller.OrderController.GenerateInvoiceDownload
);
router.post(
  "/checkoutPay",
  authentication,
  upload.any(),
  controller.OrderController.checkoutPay
);

// Wishlist Controller
router.post(
  "/wishlists/toggle",
  authentication,
  upload.any(),
  controller.WishlistController.create
);
router.delete(
  "/wishlists/:id",
  authentication,
  controller.WishlistController.remove
);
router.get(
  "/wishlists/in_wishlist/:id",
  authentication,
  controller.WishlistController.inwishlist
);
router.get(
  "/wishlists/inwishlistNew/:id",
  authentication,
  controller.WishlistController.inwishlistNew
);

router.get(
  "/my-wishlists",
  authentication,
  controller.WishlistController.index
);

// Review Controller
router.post(
  "/reviews",
  authentication,
  upload.any(),
  controller.ReviewController.create
);
router.post(
  "/getReviewById",
  authentication,
  upload.any(),
  controller.ReviewController.getReviewById
);
router.put(
  "/reviews/:id",
  authentication,
  upload.any(),
  controller.ReviewController.update
);

router.get("/storeLocation", controller.TestController.storeLocation);
router.get("/storeRoles", controller.TestController.storeRoles);
router.get("/getRoles", controller.TestController.getRoles);
router.get("/createPDF", controller.TestController.createPDF);
router.get("/test", controller.TestController.test);

// Country Controller
router.get("/countries", controller.CountryController.getCountry);
router.get("/states", controller.CountryController.getState);
router.get(
  "/state_country/:id",
  controller.CountryController.getStateByCountry
);

// Subscription Package Controller
router.get(
  "/subscription_package",
  guestOrAuthenticate,
  controller.SubscriptionPackageController.index
);
router.get(
  "/subscription_package/:id",
  controller.SubscriptionPackageController.getSubPackageData
);
router.get(
  "/base_package",
  guestOrAuthenticate,
  controller.SubscriptionPackageController.package
);

// User Subscription Controller
router.get(
  "/user_subscription",
  authentication,
  controller.UserSubscriptionController.userSubscription
);
router.get(
  "/user_subscription_loggedin/:slug",
  authentication,
  controller.UserSubscriptionController.getLoggedInUserSubscription
);
router.post(
  "/getSubscriptionCount",
  authentication,
  upload.any(),
  controller.UserSubscriptionController.getLoggedInUserSubscriptionNew
);

router.get(
  "/user_subscription/:id",
  controller.UserSubscriptionController.getUserSubscription
);

router.get(
  "/user_all_subscription",
  authentication,
  controller.UserSubscriptionController.getUserAllSubscription
);

router.post(
  "/createUserSubscription",
  upload.any(),
  controller.UserSubscriptionController.create
);
router.get(
  "/deleteUserSubscription/:id",
  upload.any(),
  controller.UserSubscriptionController.deleteUserSubscription
);

// router.get(
//   "/GenerateInvoiceNew/:id",
//   controller.OrderController.GenerateInvoice
// );

router.post(
  "/GenerateInvoice/:id",
  controller.OrderController.GenerateInvoiceDownload
);

router.post(
  "/GenerateInvoiceForSubscription/:id",
  controller.OrderController.GenerateInvoiceSubscriptionDownload
);

router.post("/download", upload.any(), controller.OrderController.download);

router.post(
  "/convertZip",
  authentication,
  upload.any(),
  controller.OrderController.convertZip
);

// Transaction Controller

router.get(
  "/transactions",
  authentication,
  controller.TransactionController.index
);

router.post(
  "/createRazorPayOrder",
  authentication,
  upload.any(),
  controller.TransactionController.createRazorPayOrder
);
router.post(
  "/createStripePI",
  authentication,
  upload.any(),
  controller.TransactionController.createStripePI
);

// router.post(
//   "/createRazorPayTransactions",
//   authentication,
//   controller.TransactionController.createRazorPayTransactions
// );

// webhook controller
router.post(
  "/webhookSuccess",
  express.raw({ type: "application/json" }),
  controller.WebhookController.webhookSuccess
);

router.post(
  "/webhookFailed",
  express.raw({ type: "application/json" }),
  controller.WebhookController.webhookFailed
);

router.post(
  "/webhookSuccessRazorPay",
  express.raw({ type: "application/json" }),
  controller.WebhookController.webhookSuccessRazorPay
);

router.post(
  "/webhookFailedRazorPay",
  express.raw({ type: "application/json" }),
  controller.WebhookController.webhookFailedRazorPay
);

router.get("/page/:slug", controller.StaticPageManagement.show);
// router.get("/page", controller.StaticPageManagement.getAllPageLink);
// router.get("/getLink", controller.StaticPageManagement.getLink);

// CartController
router.get("/cart", authentication, controller.CartController.index);
router.post(
  "/cart",
  authentication,
  upload.any(),
  controller.CartController.create
);
router.delete(
  "/cart/:id",
  authentication,
  upload.any(),
  controller.CartController.destroy
);

router.post(
  "/contact-us",
  // authentication,
  // upload.any(),
  controller.ContactUsController.create
);

router.get(
  "/social-media",
  controller.SocialMediaController.index
)

router.get(
  "/social-media/:id",
  controller.SocialMediaController.show
)

module.exports = router;

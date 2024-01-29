const express = require("express");
const router = express.Router();
const controller = require("../Controllers/Admin");
const clientController = require("../Controllers/Client");

const { authentication } = require("../Middleware");
const passport = require("passport");
const multer = require("multer");
const upload = multer();

// Auth Controller
router.post("/register", upload.any(), controller.AuthController.register);
router.post("/login", upload.any(), controller.AuthController.login);
// router.post("/logout", authentication, controller.AuthController.logout);

router.post("/block-user", upload.any(), controller.AuthController.blockUser);
router.post(
  "/unblock-user",
  upload.any(),
  controller.AuthController.unblockUser
);

router.get(
  "/getUserDetail",
  // "/loginUser",
  authentication,
  controller.AuthController.getLogginUserData
);

router.get(
  "/analytics",
  // "/loginUser",
  authentication,
  controller.AuthController.analytics
);

// profile controller
router.post(
  "/changePassword",
  authentication,
  upload.any(),
  clientController.ProfileController.changePassword
);

// User Management Controller
router.get("/users", authentication, controller.UserManagementController.index);
router.post(
  "/users",
  authentication,
  upload.any(),
  controller.UserManagementController.create
);
router.get(
  "/users/:user_id",
  authentication,
  controller.UserManagementController.show
);
router.put(
  "/users/:user_id",
  authentication,
  upload.any(),
  controller.UserManagementController.update
);
router.delete(
  "/users/:user_id",
  authentication,
  controller.UserManagementController.destroy
);

// Category Management Controller
router.get(
  "/category",
  authentication,
  controller.CategoryManagementController.index
);
router.post(
  "/category",
  authentication,
  upload.any(),
  controller.CategoryManagementController.create
);
router.get(
  "/category/:category_id",
  authentication,
  controller.CategoryManagementController.show
);
router.put(
  "/category/:category_id",
  authentication,
  upload.any(),
  controller.CategoryManagementController.update
);
router.delete(
  "/category/:category_id",
  authentication,
  controller.CategoryManagementController.destroy
);

// Static Page Management
router.get("/page", authentication, controller.StaticPageManagement.index);
router.post(
  "/page",
  authentication,
  upload.any(),
  controller.StaticPageManagement.create
);
router.get("/page/:slug", authentication, controller.StaticPageManagement.show);
router.put(
  "/page/:slug",
  authentication,
  upload.any(),
  controller.StaticPageManagement.update
);
router.delete(
  "/page/:page_id",
  authentication,
  controller.StaticPageManagement.destroy
);

// Product Controller
router.get("/product", authentication, controller.ProductController.index);
router.post(
  "/product",
  authentication,
  upload.any(),
  controller.ProductController.create
);
router.post(
  "/product/:id",
  authentication,
  controller.ProductController.changeStatus
);
router.get("/product/:id", authentication, controller.ProductController.show);
router.put(
  "/product/:id",
  authentication,
  upload.any(),
  controller.ProductController.update
);
router.delete(
  "/product/:id",
  authentication,
  controller.ProductController.destroy
);

// Product Price Controller
router.get(
  "/product-prices",
  authentication,
  controller.ProductPriceController.index
);
router.get(
  "/getAllProductPrice",
  authentication,
  controller.ProductPriceController.getAllProductPrice
);

router.post(
  "/product-prices",
  authentication,
  upload.any(),
  controller.ProductPriceController.create
);
router.get(
  "/product-prices/:id",
  authentication,
  controller.ProductPriceController.show
);
router.put(
  "/product-prices/:id",
  authentication,
  upload.any(),
  controller.ProductPriceController.update
);
router.delete(
  "/product-prices/:id",
  authentication,
  controller.ProductPriceController.destroy
);

// Product Price Controller
router.get(
  "/product-dpi",
  authentication,
  controller.ProductDpiController.index
);
router.get(
  "/getAllProductDpi",
  authentication,
  controller.ProductDpiController.getAllProductDpi
);

router.post(
  "/product-dpi",
  authentication,
  upload.any(),
  controller.ProductDpiController.create
);
router.get(
  "/product-dpi/:id",
  authentication,
  controller.ProductDpiController.show
);
router.put(
  "/product-dpi/:id",
  authentication,
  upload.any(),
  controller.ProductDpiController.update
);
router.delete(
  "/product-dpi/:id",
  authentication,
  controller.ProductDpiController.destroy
);

// Order Controller
router.get("/orders", controller.OrderController.index);
router.get("/orders/:id", controller.OrderController.show);
router.post(
  "/GenerateInvoice/:id",
  clientController.OrderController.GenerateInvoiceDownload
);
router.post(
  "/GenerateInvoiceForSubscription/:id",
  clientController.OrderController.GenerateInvoiceSubscriptionDownload
);

// Settings Controller
router.get("/settings", controller.SettingsController.index);
router.post("/settings", upload.any(), controller.SettingsController.update);

router.get(
  "/countries",
  //  authentication,
  controller.CountryController.index
);
router.post(
  "/countries",
  authentication,
  upload.any(),
  controller.CountryController.create
);
router.get("/countries/:id", authentication, controller.CountryController.show);
router.put(
  "/countries/:id",
  authentication,
  upload.any(),
  controller.CountryController.update
);
router.delete(
  "/countries/:id",
  authentication,
  controller.CountryController.destroy
);

router.get("/states", authentication, controller.StateController.index);
router.post(
  "/states",
  authentication,
  upload.any(),
  controller.StateController.create
);
router.get("/states/:id", authentication, controller.StateController.show);
router.put(
  "/states/:id",
  authentication,
  upload.any(),
  controller.StateController.update
);
router.delete(
  "/states/:id",
  authentication,
  controller.StateController.destroy
);

router.get(
  "/state_country/:id",
  // authentication,
  controller.StateController.stateCountry
);

// Package Type Controller
router.get(
  "/package_type",
  authentication,
  controller.PackageTypeController.index
);
router.post(
  "/package_type",
  authentication,
  upload.any(),
  controller.PackageTypeController.create
);
router.get(
  "/package_type/:package_type_id",
  authentication,
  controller.PackageTypeController.show
);
router.put(
  "/package_type/:package_type_id",
  authentication,
  upload.any(),
  controller.PackageTypeController.update
);
router.delete(
  "/package_type/:package_type_id",
  authentication,
  controller.PackageTypeController.destroy
);

// Subscription Package Controller
router.get(
  "/subscription_package",
  authentication,
  controller.SubscriptionPackageController.index
);
router.post(
  "/subscription_package",
  authentication,
  upload.any(),
  controller.SubscriptionPackageController.create
);
router.get(
  "/subscription_package/:id",
  authentication,
  controller.SubscriptionPackageController.show
);
router.put(
  "/subscription_package/:id",
  authentication,
  upload.any(),
  controller.SubscriptionPackageController.update
);
router.delete(
  "/subscription_package/:id",
  authentication,
  controller.SubscriptionPackageController.destroy
);

// Transaction Controller
router.get(
  "/transactions",
  authentication,
  controller.TransactionController.index
);

// Contact- Us Inquires
router.get(
  "/contactUs",
  authentication,
  controller.ContactUsController.index
)

router.delete(
  "/contactUs/:contactUs_id",
  authentication,
  controller.ContactUsController.destroy
);

// Social Media Controller
router.post(
  "/social-media",
  authentication,
  upload.any(),
  controller.SocialMediaController.create
);
router.get(
  "/social-media",
  authentication,
  controller.SocialMediaController.index
);
router.get(
  "/social-media/:id",
  authentication,
  controller.SocialMediaController.show
);
router.put(
  "/social-media/:id",
  authentication,
  upload.any(),
  controller.SocialMediaController.update
);
router.delete(
  "/social-media/:id",
  authentication,
  controller.SocialMediaController.destroy
);

module.exports = router;

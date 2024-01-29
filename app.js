const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const env = require("dotenv").config().parsed;
const port = 3000;
const passport = require("passport");
const { adminRoute, userRoute, settingsRoute, mainRoute } = require("./Routes");
const cors = require("cors");
const mkdirp = require("mkdirp");
const path = require("path");
const swaggerUi = require("swagger-ui-express");

// const swaggerDocument = require("./swaggerDocument");
const swaggerDocument = require("./swagger.json");
const swaggerDocumentAdmin = require("./swagger-admin.json");

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
// app.use(
//   "/api-docs-admin",
//   swaggerUi.serve,
//   swaggerUi.setup(swaggerDocumentAdmin)
// );

const controller = require("./Controllers/Client/TestController");

global.__basedir = __dirname;

mkdirp.sync(path.join(__dirname, "/public/category"));
mkdirp.sync(path.join(__dirname, "/public/product"));
mkdirp.sync(path.join(__dirname, "/public/review"));
mkdirp.sync(path.join(__dirname, "/public/user"));
mkdirp.sync(path.join(__dirname, "/public/original"));
mkdirp.sync(path.join(__dirname, "/public/original/jpg"));
mkdirp.sync(path.join(__dirname, "/public/original/png"));
mkdirp.sync(path.join(__dirname, "/public/original/tif"));

// mkdirp.sync(path.join(__dirname, "/public/original/800x1200"));
// mkdirp.sync(path.join(__dirname, "/public/original/1500X2250"));
// mkdirp.sync(path.join(__dirname, "/public/original/3600X5400"));
// mkdirp.sync(path.join(__dirname, "/public/original/5400X8100"));
mkdirp.sync(path.join(__dirname, "/public/assets"));

const dConnection =
  env.DB_CONNECTION +
  "://" +
  env.DB_HOST +
  ":" +
  env.DB_PORT +
  "/" +
  env.DB_DATABASE;
console.log("dConnection: ", dConnection);
const options = {
  useCreateIndex: true,
  useUnifiedTopology: true,
  useNewUrlParser: true,
  useFindAndModify: false,
};
mongoose
  .connect(dConnection, options)
  .then(() => {
    console.log("DB Connected!");
  })
  .catch((err) => {
    throw new Error("Database credentials are invalid.");
  });

const corsOptions = {
  origin: [
    "http://localhost:3002",
    "http://localhost:3003",
    "http://52.69.195.65",
    "http://52.69.195.65:3002",
    "http://52.69.195.65:3003",
    "http://192.168.0.121:3003",
    "http://192.168.0.121:3002",
    // "https://8f29-103-106-21-5.in.ngrok.io",
    "https://31da-103-106-21-4.ngrok-free.app",
    // "https://img.freepik.com",
    "http://181.215.78.241:3003",
    "http://181.215.78.241:3002",
    "http://imagesarc.com",
    "https://imagesarc.com",
    "https://admin.imagesarc.com",
    "http://admin.imagesarc.com"
  ],
  credentials: true, //access-control-allow-credentials:true
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));

// app.use(function (req, res, next) {
//     res.header("Access-Control-Allow-Origin", "*");
//     res.header("Access-Control-Allow-Methods", 'OPTIONS,GET,PUT,POST,DELETE');
//     res.header("Access-Control-Allow-Headers", "*");
//     next();
// });

app.use(express.static("public"));
app.use("/category", express.static("category"));
app.use("/basic", express.static("basic"));
app.use("/product", express.static("product"));
app.use("/review", express.static("review"));
app.use("/user", express.static("user"));
app.use("/original", express.static("original"));
app.use("/original/800x1200", express.static("original/800x1200"));
app.use("/original/1500X2250", express.static("original/1500X2250"));
app.use("/original/3600X5400", express.static("original/3600X5400"));
app.use("/original/5400X8100", express.static("original/5400X8100"));
// app.use("/logo.png", express.static("logo.png"));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use("/api/admin", adminRoute);
app.use("/api/user", userRoute);

//
app.use("/api/settings", controller.settings);
app.use("/api/analytics", controller.analytics);
app.use("/api/attributes", controller.attributes);
app.use("/api/authors", controller.authors);
app.use("/api/categories", controller.categories);
app.use("/api/coupons", controller.coupons);
app.use("/api/manufacturers", controller.manufacturers);
app.use("/api/order-export", controller.orderexport);
app.use("/api/order-files", controller.orderfiles);
app.use("/api/order-invoice", controller.orderinvoice);
app.use("/api/order-statuses", controller.orderstatuses);
app.use("/api/order-status", controller.orderstatuses);
// app.use('/api/orders', controller.orders);
app.use("/api/popular-products", controller.products);
app.use("/api/products", controller.products);
app.use("/api/questions", controller.questions);
app.use("/api/reports", controller.reports);
app.use("/api/reviews", controller.reviews);
app.use("/api/shippings", controller.shippings);
app.use("/api/shops", controller.shops);
app.use("/api/tags", controller.tags);
app.use("/api/taxes", controller.taxes);
app.use("/api/types", controller.types);
app.use("/api/users", controller.users);
app.use("/api/wishlists", controller.wishlists);
// app.use('/api/withdraws', controller.wishlists);
// app.use('/api/me', controller.wishlists);

// app.use('/api/post', postRoute);
// app.use('/api/user', userRoute);
// app.use('/api/category', categoryRoute);

app.use(passport.initialize());
app.use(passport.session());

require("./config/passport")(passport);

// app.listen(port, () => {
//   console.log("server started on", port);
// });

app
  .listen(port, function () {
    console.log(`server started on: ${port}`);
  })
  .on("error", function (err) {
    console.log("err: ", err);
    // process.once("SIGUSR2", function () {
    //   process.kill(process.pid, "SIGUSR2");
    // });
    // process.on("SIGINT", function () {
    //   // this is only called on ctrl+c, not restart
    //   process.kill(process.pid, "SIGINT");
    // });
  });

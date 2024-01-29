const { Product } = require("../Models/Product");
const messages = require("../lang/en");
const lodash = require("lodash");
const { exec } = require("child_process");

//Get Users from DB
const getProduct = (criteria, projection, options, fields = [], callback) => {
  Product.findOne(criteria, projection, options, callback)
    // .populate("categories", "_id name")
    .populate({
      path: "categories",
      match: { status: "active" },
      select: "id name",
    })
    .lean()
    .select(fields);
};

const getProductList = (
  criteria,
  projection,
  options,
  fields = [],
  callback
) => {
  Product.find(criteria, projection, options, callback)
    .lean()
    .sort({ _id: -1 })
    .select(fields);
};

//Insert Product in DB
const createProduct = (objToSave, callback) => {
  new Product(objToSave).save(callback);
};

//Update Product in DB
const updateProduct = (criteria, dataToSet, options, callback) => {
  Product.findOneAndUpdate(criteria, dataToSet, options, callback);
};

//Delete Product in DB
const deleteProduct = (criteria, callback) => {
  Product.findOneAndRemove(criteria, callback);
};

const countProduct = (criteria, callback) => {
  Product.countDocuments(criteria, callback);
};

const updateDPI = (id) => {
  getProduct({ _id: id }, ["_id", "image"], async (err, data) => {
    if (err) {
      return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
    }
    console.log("data.image: ", data.image);
    runShellScript(
      `python3 image_dpi_detect.py public/original/jpg ${data.image}`,
      async function (response) {
        let DPIdata = response.result;
        console.log("DPIdata: ", DPIdata);
        let DPIArr = [0, 0, 0];
        if (DPIdata != undefined) {
          DPIArr = JSON.parse(DPIdata);
        }

        updateProduct(
          {
            _id: id,
          },
          {
            dpi: DPIArr[0],
            resolution: DPIArr[1] + " x " + DPIArr[2],
          },
          (err, data) => {
            data = {};
          }
        );
      }
    );
  });
};

const runShellScript = (script, callback) => {
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
};

module.exports = {
  getProduct,
  getProductList,
  updateProduct,
  deleteProduct,
  createProduct,
  countProduct,
  updateDPI,
};

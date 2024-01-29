const joi = require("joi");
const mongoose = require("mongoose");

const schema = mongoose.Schema({
  user_id: {
    type: String,
    required: true,
  },
  // product_id: {
  //   type: String,
  //   required: true,
  // }
  base_amount:{
     type: Number,
  },
  id:{
     type: String,
  },
  image:{
     type: String,
  },
  name:{
     type: String,
  },
  price:{
     type: Number,
  },
  purchaseDPI:{
     type: Number,
  },
  purchaseFileType:{
     type: String,
  },
  unit:{
     type: String,
  }
});

const createRequest = (body) => {
  const schema = joi.object().keys({
    user_id: joi.string().required().label("User id field"),
    // product_id: joi.string().required().label("Product id field"),
  });
  return joi.validate(body, schema, { allowUnknown: true });
};

module.exports = {
  Cart: mongoose.model("Cart", schema),
  createRequest: createRequest,
};

const joi = require("joi");
const mongoose = require("mongoose");

const schema = mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  url: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    // required: true,
  },
  status: {
    type: String,
    default: "active",
  },
},{
  timestamps: true
});

const createSocialMediaRequest = (body) => {
  const schema = joi.object().keys({
    name: joi.string().required().label("Name field"),
    url: joi.string().required().label("URL field"),
  });
  return joi.validate(body, schema, { allowUnknown: true });
};
const updateSocialMediaRequest = (body) => {
    const schema = joi.object().keys({
        name: joi.string().required().label("Name field"),
        url: joi.string().required().label("URL field"),
    });
    return joi.validate(body, schema, { allowUnknown: true });
  };

module.exports = {
  SocialMedia: mongoose.model("Social-Media", schema),
  createSocialMediaRequest: createSocialMediaRequest,
  updateSocialMediaRequest: updateSocialMediaRequest
};

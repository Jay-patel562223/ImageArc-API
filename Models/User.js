const joi = require("joi");
const mongoose = require("mongoose");

const schema = mongoose.Schema({
  first_name: {
    type: String,
    required: true,
  },
  last_name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: false,
    unique: true,
  },
  password: {
    type: String,
    required: false,
    // select: false,
  },
  mobile_no: {
    type: String,
    required: false,
    // unique: true,
  },
  country: {
    type: Object,
    // type: String,
    required: false,
    ref: "Countries",
  },
  state: {
    type: Object,
    // type: String,
    required: false,
    ref: "States",
  },
  image: {
    type: String,
    required: false,
  },
  status: {
    type: String,
    default: "active",
  },
  device_token: {
    type: String,
    required: false,
  },
  role_ids: {
    type: Array,
    required: true,
    ref: "Role",
  },
  notification_status: {
    type: Boolean,
    required: false,
  },
  created_at: {
    type: Date,
    required: true,
    default: Date.now,
    select: false,
  },
  updated_at: {
    type: Date,
    required: true,
    default: Date.now,
    select: false,
  },
  deleted_at: {
    type: Date,
    required: true,
    default: Date.now,
    select: false,
  },
});

const createRequest = (body) => {
  const schema = joi.object().keys({
    first_name: joi.string().required().label("First name field"),
    last_name: joi.string().required().label("Last name field"),
    email: joi.string().required().label("Email field"),
    password: joi.string().required().label("Password field"),
    mobile_no: joi.string().required().label("Mobile no field"),
    // country: joi.string().required().label("Country field"),
    // state: joi.string().required().label("State field"),
  });
  return joi.validate(body, schema, { allowUnknown: true });
};

const updateRequest = (body) => {
  const schema = joi.object().keys({
    first_name: joi.string().required().label("First name field"),
    last_name: joi.string().required().label("Last name field"),
    email: joi.string().required().label("Email field"),
    // password: joi.string().required().label("Password field"),
    mobile_no: joi.string().required().label("Mobile no field"),
    country: joi.string().required().label("Country field"),
    state: joi.string().required().label("State field"),
  });
  return joi.validate(body, schema, { allowUnknown: true });
};

const loginRequest = (body) => {
  const schema = joi.object().keys({
    email: joi.string().required().label("Email field"),
    password: joi.string().required().label("Password field"),
  });
  return joi.validate(body, schema, { allowUnknown: true });
};

const forgetRequest = (body) => {
  const schema = joi.object().keys({
    email: joi.string().required().label("Email field"),
  });
  return joi.validate(body, schema, { allowUnknown: true });
};

const verifyRequest = (body) => {
  const schema = joi.object().keys({
    email: joi.string().required().label("Email field"),
    token: joi.string().required().label("Token field"),
  });
  return joi.validate(body, schema, { allowUnknown: true });
};

const resetRequest = (body) => {
  const schema = joi.object().keys({
    email: joi.string().required().label("Email field"),
    password: joi.string().required().label("Password field"),
    otp: joi.number().required().label("OTP field"),
  });
  return joi.validate(body, schema, { allowUnknown: true });
};

const matchEmailOTPRequest = (body) => {
  const schema = joi.object().keys({
    email: joi.string().required().label("Email field"),
    otp: joi.number().required().label("Otp field"),
  });
  return joi.validate(body, schema, { allowUnknown: true });
};

const changePasswordRequest = (body) => {
  const schema = joi.object().keys({
    user_id: joi.string().required().label("User id field"),
    old_password: joi.string().required().label("Old password field"),
    new_password: joi.string().required().label("New password field"),
  });
  return joi.validate(body, schema, { allowUnknown: true });
};

const profileRequest = (body) => {
  const schema = joi.object().keys({
    first_name: joi.string().required().label("First name field"),
    last_name: joi.string().required().label("Last name field"),
    email: joi.string().required().label("Email field"),
    // password: joi.string().required().label("Password field"),
    mobile_no: joi.string().required().label("Mobile no field"),
    // country: joi.string().required().label("Country field"),
    // state: joi.string().required().label("State field"),
  });
  return joi.validate(body, schema, { allowUnknown: true });
};

const preferencesRequest = (body) => {
  const schema = joi.object().keys({
    device_token: joi.string().required().label("device_token field"),
    os_type: joi
      .string()
      .required()
      .valid("android", "ios")
      .label("os_type field"),
    place: joi.string().required().label("device_token field"),
    notification_on: joi.boolean().required().label("notification_on field"),
    is_active: joi.boolean().required().label("is_active field"),
    geo_lat: joi.optional().label("geo_long field"),
    geo_long: joi.optional().required().label("geo_long field"),
  });
  return joi.validate(body, schema, { allowUnknown: true });
};

const notifyRequest = (body) => {
  const schema = joi.object().keys({
    notification_status: joi
      .boolean()
      .required()
      .label("Notification status field"),
  });
  return joi.validate(body, schema, { allowUnknown: true });
};

schema.methods.toJSON = function () {
  var obj = this.toObject(); //or var obj = this;
  delete obj.password;
  return obj;
};

module.exports = {
  User: mongoose.model("User", schema),
  createRequest,
  updateRequest,
  loginRequest,
  forgetRequest,
  verifyRequest,
  resetRequest,
  changePasswordRequest,
  profileRequest,
  preferencesRequest,
  matchEmailOTPRequest,
  notifyRequest,
};

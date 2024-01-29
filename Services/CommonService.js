const { Wishlist } = require("../Models/Wishlist");
const messages = require("../lang/en");
const lodash = require("lodash");
const sharp = require("sharp");
const path = require("path");

const checkFileType = (file) => {
  const array_of_allowed_file_types = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/tiff",
    "image/tif",
  ];
  return !array_of_allowed_file_types.includes(file.mimetype);
};

const uploadPhoto = (id, file) => {
  let name = id + ".jpeg";
  var base_path = __basedir;
  const filename = path.join(base_path, "/public/user/" + name);

  sharp(file.buffer)
    .resize(250, 180)
    .toFormat("jpeg")
    // .jpeg({ quality: 80 })
    .toFile(filename);
  return name;
};

function capitalizeFirstLetter(str) {
  if (str != undefined) {
    const output = str.replace(/\b\w/g, (x) => x.toUpperCase());
    return output;
  }
  return "";
}

function capitalizeNewFirstLetter(str) {
  if (str != undefined) {
    const output = str
      .toLowerCase()
      .replace(/(^| )(\w)/g, (s) => s.toUpperCase());
    // const output = str.replace(/\b\w/g, (x) => x.toUpperCase());
    return output;
  }
  return "";
}

const getTz = () => {};

module.exports = {
  checkFileType,
  uploadPhoto,
  capitalizeFirstLetter,
  capitalizeNewFirstLetter,
  getTz,
};

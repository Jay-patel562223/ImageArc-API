const HttpCode = require("../../Support/HttpCode");
const { sendResponse } = require("../../Support/APIResponse");
const { changePasswordRequest, profileRequest } = require("../../Models/User");
const async = require("async");
const bcrypt = require("bcryptjs");
const { UserService } = require("../../Services/index");
const messages = require("../../lang/en");
const lodash = require("lodash");
const sharp = require("sharp");
const path = require("path");
const { fullUrl } = require("../../utils/getUrl");
const { checkFileType, uploadPhoto } = require("../../Services/CommonService");

const changePassword = (req, res, next) => {
  const body = req.body;
  const user_id = req?.user?.data?.user_id;
  body.user_id = user_id;
  body.new_password = body.newPassword;
  body.old_password = body.oldPassword;

  let user = {};
  async.series([
    (next) => {
      let { error } = changePasswordRequest(body);
      if (error) {
        return sendResponse(
          res,
          false,
          HttpCode.UNPROCESSABLE_ENTITY,
          null,
          error
        );
      }

      const where = {
        $or: [{ _id: body.user_id }],
      };

      UserService.getUser(where, {}, {}, [], (err, data) => {
        if (!data) {
          return sendResponse(
            res,
            false,
            HttpCode.UNPROCESSABLE_ENTITY,
            null,
            messages.AUTH.WRONG_USER
          );
        }
        user = data;
        bcrypt.compare(
          body.old_password,
          user.password,
          function (err, result) {
            if (!result) {
              return sendResponse(
                res,
                false,
                HttpCode.UNPROCESSABLE_ENTITY,
                null,
                messages.AUTH.PASSWORD_WRONG
              );
            }
            if (user.status != "active") {
              return sendResponse(
                res,
                false,
                HttpCode.UNPROCESSABLE_ENTITY,
                { status: "Inactive" },
                messages.AUTH.ACCOUNT_DEACTIVATED
              );
            }
            next();
          }
        );
      });
    },
    (next) => {
      if (!lodash.isEmpty(body.new_password)) {
        body.new_password = bcrypt.hashSync(body.new_password, 10);
      }
      UserService.updateUser(
        { _id: body.user_id },
        { password: body.new_password },
        (err, data) => {
          if (err) {
            return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
          }
          return sendResponse(
            res,
            true,
            HttpCode.OK,
            {
              user_id: data._id,
            },
            messages.CRUD.UPDATED("Password")
          );
        }
      );
    },
  ]);
};

const editProfile = (req, res, next) => {
  const body = req.body;
  const id = req.params.id;
  delete body.password;

  async.series([
    (next) => {
      let { error } = profileRequest(body);
      if (error) {
        return sendResponse(
          res,
          false,
          HttpCode.UNPROCESSABLE_ENTITY,
          null,
          error
        );
      }
      if (body.country == "undefined") {
        return sendResponse(
          res,
          false,
          HttpCode.UNPROCESSABLE_ENTITY,
          null,
          "Country field is required!"
        );
      }
      if (body.state == "undefined") {
        return sendResponse(
          res,
          false,
          HttpCode.UNPROCESSABLE_ENTITY,
          null,
          "State field is required!"
        );
      }

      if (req.files != undefined && req.files.length != 0) {
        if (typeof req.files[0] == "object") {
          const file = req.files[0];
          if (checkFileType(file)) {
            return sendResponse(
              res,
              false,
              HttpCode.UNPROCESSABLE_ENTITY,
              null,
              // "Image file should be png, jpg or jpeg"
              messages.VALID_FILE
            );
          }

          var base_path = __basedir;
          // const filename = path.join(
          //   base_path,
          //   "/public/user/" + file.originalname
          // );

          // let name = file.originalname.replace(/\.[^/.]+$/, "");
          // name = addDate + "_" + name;
          const name = uploadPhoto(id, file);

          body.image = name;
          // body.image = file.originalname;
        }
      } else {
        delete body.image;
      }

      next();
    },
    (next) => {
      body.country = JSON.parse(body.country)._id;
      // body.country = JSON.parse(body.country);
      body.state = JSON.parse(body.state)._id;
      // body.state = JSON.parse(body.state);
      delete body.email;

      UserService.updateUser({ _id: id }, body, async (err, data) => {
        if (err) {
          return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
        }
        // const user = req?.user?.data;

        await UserService.getUser({ _id: id }, {}, {}, [], (err, datas) => {
          if (!datas) {
            return sendResponse(
              res,
              false,
              HttpCode.UNPROCESSABLE_ENTITY,
              null,
              messages.AUTH.WRONG_USER
            );
          }
          user = datas;

          return sendResponse(
            res,
            true,
            HttpCode.OK,
            { data: user },
            // {
            //   user_id: data?._id,
            // },
            messages.CRUD.UPDATED("Profile")
          );
        });
      });
    },
  ]);
};

module.exports = {
  changePassword: changePassword,
  editProfile: editProfile,
};

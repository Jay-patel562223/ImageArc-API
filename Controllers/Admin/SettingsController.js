const { sendResponse } = require("../../Support/APIResponse");
const HttpCode = require("../../Support/HttpCode");
const { SettingService } = require("../../Services");
const async = require("async");
const messages = require("../../lang/en");
const { Setting } = require("../../Models/Setting");

const index = async (req, res) => {
  Setting.find({}, [], {}).exec((err, data) => {
    data = data[0];
    return sendResponse(
      res,
      true,
      HttpCode.OK,
      {
        data,
      },
      messages.CRUD.RETRIEVED("Page")
    );
  });
};

const show = async (req, res) => {
  const slug = req.params.slug;

  SettingService.getSetting({ slug: slug }, (err, data) => {
    if (err) {
      return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
    }
    return sendResponse(
      res,
      true,
      HttpCode.OK,
      {
        data,
      },
      messages.CRUD.RETRIEVED("Page")
    );
  });
};

const update = (req, res) => {
  const body = req.body;
  const slug = req.params.slug;

  async.series([
    // (next) => {
    //   //   let { error } = createRequest(body);
    //   //   if (error) {
    //   //     return sendResponse(
    //   //       res,
    //   //       false,
    //   //       HttpCode.UNPROCESSABLE_ENTITY,
    //   //       null,
    //   //       error
    //   //     );
    //   //   }
    //   next();
    // },
    (next) => {
      // if (req.files.length != 0) {
      //   if (typeof req.files[0] == "object") {
      //     const file = req.files[0];

      //     var base_path = __basedir;
      //     const filename = path.join(
      //       base_path,
      //       "/public/category/" + file.originalname
      //     );

      //     sharp(file.buffer)
      //       .resize(640, 480)
      //       .jpeg({ quality: 80 })
      //       .toFile(filename);
      //     body.image = file.originalname;
      //   }
      // }

      next();
    },
    (next) => {
      if (body.id) {
        SettingService.updateSetting(
          {
            _id: slug,
          },
          body,
          (err, data) => {
            data = {};
            if (err) {
              return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
            }
            if (!data) {
              return sendResponse(
                res,
                false,
                HttpCode.NOT_FOUND,
                {
                  data,
                },
                "You can't edit this page."
              );
            } else {
              return sendResponse(
                res,
                true,
                HttpCode.OK,
                {
                  data,
                },
                messages.CRUD.UPDATED("Page")
              );
            }
          }
        );
      } else {
        SettingService.createSetting(body, (err, data) => {
          if (err) {
            return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
          }
          return sendResponse(
            res,
            true,
            HttpCode.OK,
            {
              data,
            },
            messages.CRUD.CREATED("User")
          );
        });
      }
    },
  ]);
};

module.exports = {
  index: index,
  show: show,
  update: update,
};

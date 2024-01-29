const { sendResponse } = require("../../Support/APIResponse");
const HttpCode = require("../../Support/HttpCode");
const { PageService } = require("../../Services");
const async = require("async");
const messages = require("../../lang/en");

const show = async (req, res) => {
  const slug = req.params.slug;

  PageService.getPage(
    { slug: slug, status: "active" },
    ["body_content", "status", "_id", "title", "slug"],
    (err, data) => {
      if (err) {
        return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
      }
      if(data == null){
        return sendResponse(
          res,
          true,
          HttpCode.OK,
          {
            data: "",
          },
          messages.CRUD.RETRIEVED("Page")
        );
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
    }
  );
};

// const getAllPageLink = (req, res) => {
//   // const slug = req.params.slug;
//   // PageService.getPageList(
//   //   ["body_content", "status", "_id", "title", "slug"],
//   //   (err, data) => {
//   //     if (err) {
//   //       return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
//   //     }
//   //     return sendResponse(
//   //       res,
//   //       true,
//   //       HttpCode.OK,
//   //       {
//   //         data,
//   //       },
//   //       messages.CRUD.RETRIEVED("Page")
//   //     );
//   //   }
//   // );
// };

module.exports = {
  show: show,
};

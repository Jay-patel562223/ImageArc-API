const { sendResponse } = require("../../Support/APIResponse");
const HttpCode = require("../../Support/HttpCode");
const { ReviewService } = require("../../Services");
const async = require("async");
const messages = require("../../lang/en");
const config = require("../../config/index");
const { createRequest, ContactUs } = require("../../Models/ContactUs");
const { ContactUsService } = require("../../Services");
const { Product } = require("../../Models/Product");
const { fullUrl } = require("../../utils/getUrl");
const { paginate } = require("../../config/Paginate");
const { sendEmailHtml } = require("../../utils/sendEmail");

const create = (req, res) => {
  const body = req.body;
  async.series([
    (next) => {
      let { error } = createRequest(body);
      if (error) {
        return sendResponse(
          res,
          false,
          HttpCode.UNPROCESSABLE_ENTITY,
          null,
          error
        );
      }
      next();
    },
    (next) => {
      ContactUsService.createContactUs(body, (err, data) => {
        if (err) {
          return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
        }

        let text =
          "Hello " +
          body.name +
          "!,<br> Thank you for the inquiry on ImageArc, We will get in touch with you very soon.<br><br>Thanks<br>ImageArc";
        sendEmailHtml(body.email, "Thank you for the inquiry - ImageArc", text);

        return sendResponse(
          res,
          true,
          HttpCode.OK,
          {
            data,
          },
          messages.THANKYOU
        );
      });
    },
  ]);
};

module.exports = {
  create: create,
};

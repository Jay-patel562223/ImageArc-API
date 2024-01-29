const { sendResponse } = require("../../Support/APIResponse");
const HttpCode = require("../../Support/HttpCode");
const { PageService } = require("../../Services");
const async = require("async");
const messages = require("../../lang/en");
const { createRequest, Page } = require("../../Models/Page");
const { paginate } = require("../../config/Paginate");
const { fullUrl } = require("../../utils/getUrl");
const config = require("../../config/index");
const { capitalizeFirstLetter } = require("../../Services/CommonService");

const index = async (req, res) => {
  const query = req.query;
  let where = {},
    skip = 0,
    page = 1,
    limit = config.APP_CONSTANTS.PAGINATION_SIZE;

  if (query.skip) {
    skip = parseInt(query.skip);
  }

  if (query.limit) {
    limit = parseInt(query.limit);
  }

  if (query.page) {
    page = parseInt(query.page);
  }

  if (!page) {
    page = 1;
  }

  if (!limit) limit = config.APP_CONSTANTS.PAGINATION_SIZE;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const column = query.orderBy;
  const sort = query.sortedBy == "asc" ? 1 : -1;
  const searchNew =
    query.search != undefined && query.search != ""
      ? query.search.split(":")
      : "";
  const key = searchNew[0];
  let val = searchNew[1];
  val = val != undefined ? val.trim().toLowerCase() : val;
  let queryNew = {};
  if (val != undefined) {
    queryNew = {
      $or: [
        // { [key]: new RegExp(`.*${val}.*`) },
        // { title: new RegExp(`.*${val}.*`) },
        // { status: new RegExp(`.*${val}.*`) },
        { title: new RegExp(`.*${val.toLowerCase()}.*`) },
        { title: new RegExp(`.*${val.toUpperCase()}.*`) },
        { title: new RegExp(`.*${capitalizeFirstLetter(val)}.*`) },
        { status: new RegExp(`.*${val.toLowerCase()}.*`) },
        { status: new RegExp(`.*${val.toUpperCase()}.*`) },
        { status: new RegExp(`.*${capitalizeFirstLetter(val)}.*`) },
      ],
    };
  }
  const search =
    query.search != undefined && query.search != "" ? queryNew : {};

  Page.find(search, ["status", "_id", "title", "slug"], {})
    .sort({ [column]: sort })
    // .sort({ _id: -1 })
    .exec((err, data) => {
      if (data != undefined) {
        const results = data.slice(startIndex, endIndex);
        const url = `/products?limit=${limit}`;

        return sendResponse(
          res,
          true,
          HttpCode.OK,
          {
            data: results,
            ...paginate(data.length, page, limit, results.length, url),
            // data,
          },
          messages.CRUD.RETRIEVED("Page")
        );
      }
      return sendResponse(
        res,
        true,
        HttpCode.OK,
        {
          data: [],
        },
        messages.CRUD.RETRIEVED("Page")
      );
    });
};

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
      PageService.getPage({ slug: body.slug }, (err, data) => {
        if (data) {
          return sendResponse(
            res,
            false,
            HttpCode.UNPROCESSABLE_ENTITY,
            null,
            "Page already exist"
          );
        }
        PageService.createPage(body, (err, data) => {
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
            messages.CRUD.CREATED("Page")
          );
        });
      });
    },
  ]);
};

const show = async (req, res) => {
  const slug = req.params.slug;

  PageService.getPage(
    { slug: slug },
    ["body_content", "status", "_id", "title", "slug"],
    (err, data) => {
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
    }
  );
};

const update = (req, res) => {
  const body = req.body;
  const slug = req.params.slug;

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
      PageService.getPage({ _id: slug }, (err, data) => {
        PageService.updatePage(
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
      });
    },
  ]);
};

const destroy = (req, res) => {
  const body = req.body;
  const slug = req.params.page_id;

  if (!slug) {
    return sendResponse(
      res,
      false,
      HttpCode.SERVER_ERROR,
      null,
      "Request is not valid."
    );
  }
  async.waterfall([
    (cb) => {
      PageService.deletePage(
        {
          _id: slug,
        },
        (err, data) => {
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
              "You can't delete this page."
            );
          } else {
            return sendResponse(
              res,
              true,
              HttpCode.OK,
              {
                data,
              },
              messages.CRUD.DELETED("Page")
            );
          }
        }
      );
    },
  ]);
};

module.exports = {
  index: index,
  create: create,
  show: show,
  update: update,
  destroy: destroy,
};

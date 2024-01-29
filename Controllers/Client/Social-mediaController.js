const { sendResponse } = require("../../Support/APIResponse");
const HttpCode = require("../../Support/HttpCode");
const { SocialMediaService } = require("../../Services");
const async = require("async");
const messages = require("../../lang/en");
const { fullUrl } = require("../../utils/getUrl");

const index = (req, res) => {
    async.series([
        (next) => {
            let where = { status: "active" }
            SocialMediaService.getSocialMediaList(where, ["_id", "name", "url", "image", "status"],
                (err, data) => {
                    if (err) {
                        return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err)
                    }

                    if (data != null) {
                        data = filterUser(data, req);
                    }

                    return sendResponse(
                        res,
                        true,
                        HttpCode.OK,
                        {
                            data,
                        },
                        messages.CRUD.RETRIEVED("Social Media")
                    )
                }
            )
        }
    ])
}

const filterUser = (data, req) => {
    const finalData = data.map((res) => {
        if (res.image) {
            res.image = fullUrl(req) + "/basic/" + res.image;
        } else {
            res.image = fullUrl(req) + "/basic/";
        }
        return res;
    });
    return finalData;
};

const show = async (req, res) => {
    const id = req.params.id;

    SocialMediaService.getSocialMedia(
        { _id: id },
        ["status", "image", "_id", "name", "url"],
        (err, data) => {
            if (err) {
                return sendResponse(res, false, HttpCode.SERVER_ERROR, null, err);
            }
            if (data != undefined) {
                if (data.image) {
                    data.image = fullUrl(req) + "/basic/" + data.image;
                } else {
                    data.image = null;
                }
            }
            return sendResponse(
                res,
                true,
                HttpCode.OK,
                {
                    data,
                },
                messages.CRUD.RETRIEVED("Social Media")
            );
        }
    );
};

module.exports = {
    index: index,
    show: show
}
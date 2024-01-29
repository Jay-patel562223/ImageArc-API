const {sendResponse} = require('../Support/APIResponse');
const HttpCode = require('../Support/HttpCode');
const {RoleService} = require('../Services/index');
const lodashObject = require('lodash');
const async = require('async');

function hasRole(...roles) {
    return (req, res, next) => {
        let roleIds = req.user.role_ids;
        let permission = false;
        RoleService.getRoles({code: {$in: roles}}, (err, data) => {
            lodashObject.forEach(data, function (value, key) {
                if (roleIds.includes(value._id)) {
                    permission = true;
                }
            });
            if (permission) {
                return next();
            }
            return sendResponse(res, HttpCode.UNPROCESSABLE_ENTITY, null, 'Unauthorized permission');
        });
    };
}

module.exports = hasRole;
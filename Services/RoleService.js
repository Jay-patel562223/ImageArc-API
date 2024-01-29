const { Role } = require("../Models/Role");

//Get Roles from DB
function getRoles(criteria, projection, options, callback) {
  Role.find(criteria, projection, options, callback);
}

//Insert Product in DB
const createRole = (objToSave, callback) => {
  new Role(objToSave).save(callback);
};

module.exports = {
  getRoles: getRoles,
  createRole: createRole,
};

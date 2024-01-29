const express = require("express");
const router = express.Router();
const controller = require("../Controllers/Client");
const { authentication } = require("../Middleware");

router.get("/", controller.TestController.settings);
// controller.TestController.foreach((res)=>{
//     console.log('controller.TestController: ',res);

// })

module.exports = router;

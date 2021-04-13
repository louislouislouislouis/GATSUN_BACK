const express = require("express");
const router = express.Router();

const checkauth = require("../Middleware/check-auth");
const helloassocontroller = require("../Controllers/HelloAssoControllers");
router.use(checkauth);
router.get("", helloassocontroller.getpayment);

module.exports = router;

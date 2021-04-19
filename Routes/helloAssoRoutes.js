const express = require("express");
const router = express.Router();

const checkauth = require("../Middleware/Check-auth");
const helloassocontroller = require("../Controllers/HelloAssoControllers");
router.post("/notif", helloassocontroller.notif);
router.use(checkauth);
router.get("", helloassocontroller.getpayment);

module.exports = router;

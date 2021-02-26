const express = require("express");
const router = express.Router();

const checkauth = require("../Middleware/check-auth");
const liveControllers = require("../Controllers/LiveControllers");

router.use(checkauth);

router.get("/", liveControllers.entry);

module.exports = router;

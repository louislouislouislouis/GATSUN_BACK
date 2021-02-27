const express = require("express");
const router = express.Router();

const liveControllers = require("../Controllers/LiveControllers");

router.get("/:uid/", liveControllers.entry);
router.get("/:convId/newmsg", liveControllers.newmsg);

module.exports = router;

const express = require("express");
const router = express.Router();

const occupControllers = require("../Controllers/OccupControllers");

router.get("", occupControllers.getall);

module.exports = router;

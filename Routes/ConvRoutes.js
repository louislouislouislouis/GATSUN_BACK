const express = require("express");
const router = express.Router();

const checkauth = require("../Middleware/check-auth");
const ConvControllers = require("../Controllers/ConvControllers");

router.use(checkauth);
router.post("/exist", ConvControllers.isExistingConv);
router.get("/fbuser/:uid", ConvControllers.getConvsByUserId);

router.post("/:convId/msg", ConvControllers.postmsg);

router.get("/:convId", ConvControllers.getConvById);

module.exports = router;

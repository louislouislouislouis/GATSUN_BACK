const express = require("express");
const router = express.Router();
const { check } = require("express-validator");

const UserControllers = require("../Controllers/UserControllers");

router.get("/alluser", UserControllers.getAllUsers);

router.post("/log", UserControllers.login);

router.post(
  "/sgnp/",
  [
    check("name").not().isEmpty(),
    check("email").normalizeEmail().isEmail(),
    check("password").isLength({ min: 6 }),
  ],
  UserControllers.signup
);

router.get("/:pid", UserControllers.getUserbyId);

module.exports = router;

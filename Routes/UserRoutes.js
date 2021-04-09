const express = require("express");
const router = express.Router();

const checkauth = require("../Middleware/check-auth");
const { check } = require("express-validator");

const UserControllers = require("../Controllers/UserControllers");

router.get("/alluser", UserControllers.getAllUsers);

router.post("/log", UserControllers.login);

router.post(
  "/sgnp/",
  [
    check("name").not().isEmpty(),
    check("firstName").not().isEmpty(),
    check("email").normalizeEmail().isEmail(),
    check("password").isLength({ min: 6 }),
    check("bio").isLength({ max: 50 }),
    check("status").isIn(["public", "private"]),
  ],
  UserControllers.signup
);

router.get("/:pid", UserControllers.getUserbyId);
router.get("/:pid/image", UserControllers.getImgUserId);

router.use(checkauth);
router.get("/alluser/right", UserControllers.getrAllUsers);
router.patch("/:pid", UserControllers.updateUser);

module.exports = router;

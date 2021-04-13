const express = require("express");
const router = express.Router();

const checkauth = require("../Middleware/check-auth");
const { check } = require("express-validator");

const DemandesControllers = require("../Controllers/DemandesControllers");
router.use(checkauth);
router.get("", DemandesControllers.getdemandbyuserId);
router.patch("", DemandesControllers.acceptordenydemand);
router.get("/all", DemandesControllers.getdemandalldemandmaster);
router.post(
  "/new",
  [
    check("askingDate")
      .isAfter(new Date(new Date().setHours(0, 0, 0, 0)).toDateString())
      .isBefore(
        new Date(new Date().setDate(new Date().getDate() + 1)).toDateString()
      )
      .withMessage("Asked Date impossible"),
    check("askedDatebeg").custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.askingDate)) {
        throw new Error("End date of lab must be valid and after demand date");
      }
      return true;
    }),
    check("askedDateend").custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.askedDatebeg)) {
        throw new Error("End date of lab must be valid and after start date");
      }
      return true;
    }),
    check("paymentmethod").isIn(["cb", "cash"]),
    check("message").not().isEmpty(),
  ],
  DemandesControllers.newdemand
);

module.exports = router;

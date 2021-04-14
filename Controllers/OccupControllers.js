const Occupation = require("../model/occupation-model");

const getall = async (req, res, next) => {
  let occup;
  try {
    occup = await Occupation.find({});
  } catch (err) {
    const error = new HttpError(
      "Fetching occup failed, plaease try again later",
      500
    );
    return next(error);
  }
  res
    .status(200)
    .json({ occup: occup.map((u) => u.toObject({ getters: true })) });
};
exports.getall = getall;

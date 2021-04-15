const User = require("../model/user-model");
const HttpError = require("../model/http-err");

const checkrole = async (roleautorisé, userId) => {
  let user;
  try {
    user = await User.findById(userId);
  } catch (err) {
    const error = new HttpError("Error with our DB at user", 500);
    throw error;
  }
  if (!roleautorisé.includes(user.role)) {
    console.log("e");
    const error = new HttpError("You dont have the right do to ", 403);
    throw error;
  } else return user;
};

exports.checkrole = checkrole;

const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");

const HttpError = require("../model/http-err");
const bcrypt = require("bcryptjs");

const User = require("../model/user-model");

const signup = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log(errors);
    return next(new HttpError("Error input", 422));
  }

  const { name, firstName, Username, email, password, image } = req.body;
  console.log(req.body);
  let existinguser;
  try {
    existinguser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError("Ooops An error Occured", 500);
    return next(error);
  }

  if (existinguser) {
    const error = new HttpError(
      "Il existe un utilisateur avec cette email",
      422
    );
    return next(error);
  }

  let hashedpassword;

  try {
    hashedpassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError("Couldf not create user please try again", 500);
    return next(error);
  }

  //creation du nouvel user
  const newUser = new User({
    name: name,
    firstname: firstName,
    bio: "NewUser!!",
    posts: [],
    likes: [],
    password: hashedpassword,
    convs: [],
    demandes: [],
    email: email,
    role: "usr",
    image: image,
  });

  try {
    await newUser.save();
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "siuffp up failed, please try again later",
      500
    );
    return next(error);
  }

  try {
    token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      process.env.JWT_KEY,
      {
        expiresIn: "1h",
      }
    );
  } catch (err) {
    const error = new HttpError("login up failed, please try again later", 500);
    return next(error);
  }

  res.status(201).json({
    userId: newUser.id,
    email: newUser.email,
    token: token,
  });
};

const getAllUsers = async (req, res, next) => {
  let Users;
  try {
    Users = await User.find(
      {},
      "-password -likes -posts -convs -demandes -email -role"
    );
  } catch (err) {
    const error = new HttpError(
      "Fetching user failed, plaease try again later",
      500
    );
    return next(error);
  }
  res
    .status(200)
    .json({ users: Users.map((u) => u.toObject({ getters: true })) });
};

const getUserbyId = async (req, res, next) => {
  const userId = req.params.pid;
  let user;
  try {
    user = await User.findOne({ _id: userId }, "-password -role -_id");
  } catch (err) {
    const error = new HttpError("Error with our DB", 500);
    return next(error);
  }
  if (!user) {
    const error = new HttpError("Error, user Doesnt exist", 401);
    return next(error);
  }
  res.status(201).json({
    name: user.name,
    bio: user.bio,
    email: user.email,
    firstname: user.firstname,
    image: user.image,
    likes: user.likes,
  });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;
  let existinguser;
  try {
    existinguser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      "Logging dfailed, plaease try again later",
      500
    );
    return next(error);
  }
  if (!existinguser) {
    const error = new HttpError("Invalid email, could not find user", 401);
    return next(error);
  }
  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existinguser.password);
  } catch {
    const error = new HttpError(
      "Logging dfailed, plaease try again later",
      500
    );
    return next(error);
  }
  if (!isValidPassword) {
    const error = new HttpError("Invalid credential", 403);
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: existinguser.id, email: existinguser.email },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );
  } catch (err) {
    console.log(err);
    const error = new HttpError("log up failed, please try again later", 500);
    return next(error);
  }

  res.status(201).json({
    userId: existinguser.id,
    email: existinguser.email,
    token: token,
  });
};

const updateUser = async (req, res, next) => {
  const userId = req.params.pid;
  const { name, firstname, username, bio, likes } = req.body;

  if (userId !== req.userData.userId) {
    const error = new HttpError("You don't have such a right??", 401);
    return next(error);
  }

  //const myuser = DUMMY_USER.find((user) => user.id == userId);
  let myuser;
  try {
    myuser = await User.findById(userId);
  } catch (err) {
    const error = new HttpError("something wrong", 500);
    return next(error);
  }
  if (myuser) {
    if (name) {
      myuser.name = name;
    } else if (firstname) {
      myuser.firstname = firstname;
    } else if (username) {
      myuser.username = username;
    } else if (bio) {
      myuser.bio = bio;
    } else if (likes) {
      myuser.likes = likes;
    } else if (!name && !firstname && !username && !bio && !likes) {
      const error = new HttpError("Content not valid", 400);
      return next(error);
    }
  } else {
    const error = new HttpError("UserId doesn not exist", 404);
    return next(error);
  }
  try {
    await myuser.save();
  } catch (err) {
    const error = new HttpError("Something wrong", 500);
    return next(error);
  }
  res.status(201).json({
    name: myuser.name,
    bio: myuser.bio,
    email: myuser.email,
    firstname: myuser.firstname,
    image: myuser.image,
    likes: myuser.likes,
  });
  console.log("Fin de getUserbyId");
};

exports.getAllUsers = getAllUsers;
exports.getUserbyId = getUserbyId;
exports.login = login;
exports.signup = signup;
exports.updateUser = updateUser;

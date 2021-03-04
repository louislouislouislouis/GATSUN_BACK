const HttpError = require("../model/http-err");
const { v4: uuidv4 } = require("uuid");
const Conv = require("../model/conv-model");
const User = require("../model/user-model");
const Mongoose = require("mongoose");

const postmsg = async (req, res, next) => {
  console.log("Un message vient d'être posté");

  const convId = req.params.convId;
  const userId = req.userData.userId;

  let conv;
  try {
    conv = await Conv.findById(convId);
  } catch (err) {
    const error = new HttpError("Error with our DB", 500);
    return next(error);
  }
  console.log(conv);
  if (userId !== req.userData.userId || !conv.participants.includes(userId)) {
    const error = new HttpError("Your not allowed to send this message", 401);
    return next(error);
  }

  if (conv.lenght !== 0) {
    conv.messages.push({
      from: userId,
      date: new Date(),
      body: req.body.value,
    });
    conv.save();
    res.json({ message: "Your message has been sent" });
  } else {
    const error = new HttpError("Please, do not play that game with me", 401);
    return next(error);
  }
};

const getConvsByUserId = async (req, res, next) => {
  console.log("Demande de get convby userId");
  const userId = req.params.uid;
  if (userId !== req.userData.userId) {
    const error = new HttpError("Your not alloweeeed to see this conv", 401);
    return next(error);
  }
  let userwithconv;
  try {
    userwithconv = await User.findById(userId).populate("convs");
  } catch (err) {
    const error = new HttpError("Error with our DB", 500);
    return next(error);
  }
  if (!userwithconv) {
    const error = new HttpError("Error, cant find conv by userId", 401);
    return next(error);
  }
  if (userwithconv.convs.lenght === 0) {
    res.status(201).json({ convs: [] });
  } else {
    res.status(201).json({
      convs: userwithconv.convs.map((u) => u.toObject({ getters: true })),
    });
  }
};

const getConvById = async (req, res, next) => {
  console.log("Demande de getConvbyId...");

  const userId = req.userData.userId;
  const convId = req.params.convId;
  console.log(userId, convId);
  let conv;
  try {
    conv = await Conv.findById(convId);
  } catch (err) {
    const error = new HttpError("Error with our DB", 500);
    return next(error);
  }

  if (!conv.participants.includes(userId)) {
    const error = new HttpError("Your not allowed to see this conv", 401);
    return next(error);
  }
  if (conv) {
    res.json(conv);
  } else {
    const error = new HttpError("Conv doesn not exist", 404);
    return next(error);
  }
  console.log("Fin de getConvbyId...");
};

const isExistingConv = async (req, res, next) => {
  console.log("Demande de isExistingConv...");
  const { userId1, userId2 } = req.body;

  if (userId1 === userId2) {
    const error = new HttpError("Why created a couv with you?", 401);
    return next(error);
  }

  if (userId1 !== req.userData.userId) {
    const error = new HttpError("Your not allowed to see this conv", 401);
    return next(error);
  }
  let conv;
  try {
    conv = await Conv.findOne({ participants: { $all: [userId1, userId2] } });
  } catch (err) {
    const error = new HttpError("Error with our DB at conv", 500);
    return next(error);
  }
  let user1, user2;
  try {
    user1 = await User.findById(userId1);
    user2 = await User.findById(userId2);
  } catch (err) {
    const error = new HttpError("Error with our DB at user", 500);
    return next(error);
  }
  console.log(conv, user1, user2);
  console.log(conv, user1.image, user2.image);
  if (conv.length === 0) {
    const newconv = new Conv({
      participants: [userId1, userId2],
      messages: [],
      image: [user1.image, user2.image],
    });

    try {
      const sess = await Mongoose.startSession();
      sess.startTransaction();
      await newconv.save({ session: sess });
      user1.convs.push(newconv);
      user2.convs.push(newconv);
      await user1.save({ session: sess });
      await user2.save({ session: sess });
      await sess.commitTransaction();
    } catch (err) {
      const error = new HttpError("cannnnnot add place", 500);
      return next(error);
    }
    res.status(201).json({ conv: newconv });
  } else {
    console.log(conv);
    console.log(conv._id);

    res.json({ idconv: conv._id, new: false });
  }
};

exports.getConvById = getConvById; //
exports.getConvsByUserId = getConvsByUserId; //
exports.postmsg = postmsg;
exports.isExistingConv = isExistingConv; //

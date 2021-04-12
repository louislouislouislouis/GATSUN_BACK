const Demand = require("../model/demandes-model");
const User = require("../model/user-model");
const Mongoose = require("mongoose");
var ObjectId = require("mongoose").Types.ObjectId;
const nodemailer = require("nodemailer");
const { validationResult } = require("express-validator");
const HttpError = require("../model/http-err");

const newdemand = async (req, res, next) => {
  console.log(req.userData.userId);
  const errors = validationResult(req);
  //Recuperer l'utilisateur
  let user1;
  try {
    user1 = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError("Error with our DB at user", 500);
    return next(error);
  }
  console.log(user1);
  if (user1.role === "NC") {
    return next(
      new HttpError(
        "Seulement les membres ayant payé la cotisation peuvent faire des demandes",
        422
      )
    );
  }
  //validation de la demande en entrée
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(new HttpError("Error input", 422));
  }
  //recuperer tt les demandes de l'utilisateur
  let useralldemands;
  try {
    useralldemands = await Demand.find({
      from: req.userData.userId,
    });
  } catch (err) {
    console.log(err);
    const error = new HttpError("Error with our DB", 500);
    return next(error);
  }

  //check if user already have demands
  let continu = true;
  useralldemands.forEach((demand) => {
    if ((demand.status = "Waiting for validation")) {
      continu = false;
    }
  });
  if (!continu) {
    const error = new HttpError(
      "You already have one demand processing, please wait for Gatsun response before asking new demand",
      500
    );
    return next(error);
  }

  const {
    askingDate,
    askedDatebeg,
    askedDateend,
    message,
    paymentmethod,
  } = req.body;

  const newDemand = new Demand({
    from: req.userData.userId,
    body: message,
    type: "privatesession",
    askedDatebeg: askedDatebeg,
    askedDateend: askedDateend,
    askingDate: askingDate,
    paymentmethod: paymentmethod,
    status: "Waiting for validation",
  });

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL,
      pass: process.env.MAILMDP,
    },
  });

  let useraavertir;
  try {
    useraavertir = await User.find({
      $or: [{ role: "responsable" }, { role: "bureau" }, { role: "Master" }],
    });
  } catch (err) {
    const error = new HttpError("Error with our DB at user", 500);
    return next(error);
  }
  const time =
    -(
      new Date(newDemand.askedDatebeg).getTime() -
      new Date(newDemand.askedDateend).getTime()
    ) / 3600000;
  console.log(time);
  useraavertir.forEach((user, index) => {
    const mailOptions = {
      from: process.env.MAIL,
      to: user.email,
      subject: `DEMANDE DE SESSION PRIVÉE ${newDemand._id}`,
      html: `<div style="background-color:white"><h1 style="color: blue">DEMANDE DE SESSION PRIVÉE.</h1> 
      <p style="color: black">Il y a ${user1.firstname} ${user1.name} qui aimerait faire une session <br><b>INFO SESSION</b>:<br> <br>SESSION-ID: ${newDemand._id} <br>DEMANDEUR: ${user1.firstname} ${user1.name}<br>DATE DE DEBUT: ${newDemand.askedDatebeg}<br>DUREE: ${time}H<br>MESSAGE: ${newDemand.body}H<br>MODE DE PAIEMENT: ${newDemand.paymentmethod}<br><br><br> Message envoyée à ${user.firstname} ${user.name} en vue de son role chez gatsun</p></div>
      `,
    };
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        const error = new HttpError(
          "Il y a eu une demande dans l'envoie des mails, contacter l'équipe gatsun au plus vite",
          500
        );
        return next(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });
  });

  try {
    const sess = await Mongoose.startSession();
    sess.startTransaction();
    await newDemand.save({ session: sess });
    user1.demandes.push(newDemand);
    await user1.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    console.log(err);
    const error = new HttpError("cannnnnot add demand", 500);
    return next(error);
  }

  res.status(201).json({ newDemand });
};
const patchdemandbyid = async (req, res, next) => {
  console.log(req.userData.userId);
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log(errors);
    return next(new HttpError("Error input", 422));
  }
  const {
    askingDate,
    askedDatebeg,
    askedDateend,
    message,
    paymentmethod,
  } = req.body;

  const newDemand = new Demand({
    from: req.userData.userId,
    body: message,
    type: "privatesession",
    askedDatebeg: askedDatebeg,
    askedDateend: askedDateend,
    askingDate: askingDate,
    paymentmethod: paymentmethod,
  });

  try {
    await newDemand.save();
  } catch (err) {
    console.log(err);
    const error = new HttpError("cannot add demand", 500);
    return next(error);
  }

  res.status(201).json({ newDemand });
};
const getdemandbyuserId = async (req, res, next) => {
  console.log(req.userData.userId);
  let demanduser;
  try {
    demanduser = await Demand.find({ from: req.userData.userId });
  } catch (err) {
    const error = new HttpError("Error with our DB at demand", 500);
    return next(error);
  }

  res.status(201).json({ demanduser });
};
exports.newdemand = newdemand;
exports.getdemandbyuserId = getdemandbyuserId;

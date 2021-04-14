const Occupation = require("../model/occupation-model");
const Demand = require("../model/demandes-model");
const User = require("../model/user-model");
const Mongoose = require("mongoose");
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
    console.log(demand);
    if (
      demand.status === "Waiting for validation" ||
      demand.status === "En attente de paiement"
    ) {
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
    ownerdenomination: `${user1.firstname} ${user1.name}`,
    emaildemandeur: user1.email,
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
const validatepayment = async (req, res, next) => {
  console.log(req.userData.userId);
  let usermaster;
  try {
    usermaster = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError("Error with our DB at user", 500);
    return next(error);
  }
  if (
    usermaster.role !== "responsable" &&
    usermaster.role !== "bureau" &&
    usermaster.role !== "Master"
  ) {
    const error = new HttpError("You are not allowed to do this", 403);
    return next(error);
  }
  const { demand } = req.body;
  let demandbd;
  try {
    demandbd = await Demand.findById(demand);
  } catch (err) {
    const error = new HttpError("Error with our DB at demand", 500);
    return next(error);
  }
  if (!demandbd) {
    const error = new HttpError("Error non demanddb", 404);
    return next(error);
  }
  if (demandbd.status !== "En attente de paiement") {
    const error = new HttpError("Cette demande n'attends pas de paiement", 404);
    return next(error);
  }

  demandbd.status = "Confirmed - CB payed";
  demandbd.dateofclose = new Date();
  try {
    await demandbd.save();
  } catch (err) {
    const error = new HttpError("somethffing wrong", 500);
    return next(error);
  }
  res.status(201).json({ message: "Success" });
};
const getdemandalldemandmaster = async (req, res, next) => {
  console.log(req.userData.userId);
  let usermaster;
  try {
    usermaster = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError("Error with our DB at user", 500);
    return next(error);
  }
  if (
    usermaster.role !== "responsable" &&
    usermaster.role !== "bureau" &&
    usermaster.role !== "Master"
  ) {
    const error = new HttpError("You are not allowed to do this", 403);
    return next(error);
  }
  let alldemand;
  try {
    alldemand = await Demand.find({ status: "Waiting for validation" });
  } catch (err) {
    const error = new HttpError("Error with our DB at demand", 500);
    return next(error);
  }

  res.status(201).json({ alldemand });
};
const getdemandalldemandmasterpaimentwaitngs = async (req, res, next) => {
  console.log(req.userData.userId);
  let usermaster;
  try {
    usermaster = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError("Error with our DB at user", 500);
    return next(error);
  }
  if (
    usermaster.role !== "responsable" &&
    usermaster.role !== "bureau" &&
    usermaster.role !== "Master"
  ) {
    const error = new HttpError("You are not allowed to do this", 403);
    return next(error);
  }
  let alldemand;
  try {
    alldemand = await Demand.find({ status: "En attente de paiement" });
  } catch (err) {
    const error = new HttpError("Error with our DB at demand", 500);
    return next(error);
  }

  res.status(201).json({ alldemand });
};
const acceptordenydemand = async (req, res, next) => {
  console.log(req.userData.userId);
  let usermaster;
  try {
    usermaster = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError("Error with our DB at User", 500);
    return next(error);
  }
  if (
    usermaster.role !== "responsable" &&
    usermaster.role !== "bureau" &&
    usermaster.role !== "Master"
  ) {
    const error = new HttpError("You are not allowed to do this", 403);
    return next(error);
  }
  const { demand, result, date, message } = req.body;

  let demandbd;
  try {
    demandbd = await Demand.findById(demand);
  } catch (err) {
    const error = new HttpError("Error with our DB at demand", 500);
    return next(error);
  }
  if (!demandbd) {
    const error = new HttpError("Error non demanddb", 404);
    return next(error);
  }
  if (demandbd.status !== "Waiting for validation") {
    const error = new HttpError(
      "Cette demande n'attends pas de validation",
      404
    );
    return next(error);
  }

  let userconcern;
  try {
    userconcern = await User.findById(demandbd.from);
  } catch (err) {
    const error = new HttpError("Error with our DB at user", 500);
    return next(error);
  }
  console.log(userconcern);
  if (!userconcern) {
    const error = new HttpError("Error", 404);
    return next(error);
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL,
      pass: process.env.MAILMDP,
    },
  });

  demandbd.validateby = req.userData.userId;
  demandbd.feedbackdate = date;

  if (result) {
    if (demandbd.paymentmethod === "cash") {
      demandbd.dateofclose = date;
      demandbd.status = "Confirmed - Cash";
    } else {
      demandbd.status = "En attente de paiement";
      const time =
        -(
          new Date(demandbd.askedDatebeg).getTime() -
          new Date(demandbd.askedDateend).getTime()
        ) / 3600000;
      let link;
      if (time === 1) {
        link =
          "https://www.helloasso.com/associations/gatsun/evenements/session-privee-1h";
      } else if (time === 2) {
        link =
          "https://www.helloasso.com/associations/gatsun/evenements/session-privee-2h";
      } else if (time === 3) {
        link =
          "https://www.helloasso.com/associations/gatsun/evenements/session-privee-1h-1";
      } else if (time === 4) {
        link =
          "https://www.helloasso.com/associations/gatsun/evenements/session-privee-4h";
      } else if (time === 5 || time === 6) {
        link =
          "https://www.helloasso.com/associations/gatsun/evenements/session-privee-5h-et-plus";
      }
      const mailOptions = {
        from: process.env.MAIL,
        to: userconcern.email,
        subject: `LIEN DE PAIMENT`,
        html: `<div style="background-color:white"><h1 style="color: blue">DEMANDE DE SESSION PRIVÉE.</h1> 
        <p style="color: black">Bonjour ${userconcern.firstname} ${userconcern.name} voila le lien pour payer <br>${link}<br><b>INFO SESSION</b>:<br> <br>SESSION-ID: ${demandbd._id} <br>DEMANDEUR: ${userconcern.firstname} ${userconcern.name}<br>DATE DE DEBUT: ${demandbd.askedDatebeg}<br>DUREE: ${time}H<br>MESSAGE: ${demandbd.body}H<br>MODE DE PAIEMENT: ${demandbd.paymentmethod}<br><br><br></p></div>
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
    }
  } else {
    demandbd.feedback = message;
    demandbd.status = "Refusé";
    demandbd.dateofclose = date;
    demandbd.feedbackdate = date;
  }
  const newoccup = new Occupation({
    dateend: demandbd.askedDateend,
    datebegin: demandbd.askedDatebeg,
  });
  if (result) {
    try {
      const sess = await Mongoose.startSession();
      sess.startTransaction();
      await demandbd.save({ session: sess });
      await newoccup.save({ session: sess });
      await sess.commitTransaction();
    } catch (err) {
      console.log(err);
      const error = new HttpError("cannnnnot add demand", 500);
      return next(error);
    }
  } else {
    try {
      await demandbd.save();
    } catch (err) {
      console.log(err);
      const error = new HttpError("cannnnnot add demand", 500);
      return next(error);
    }
  }

  res.status(201).json({ message: "Success" });
};

exports.newdemand = newdemand;
exports.getdemandbyuserId = getdemandbyuserId;
exports.getdemandalldemandmaster = getdemandalldemandmaster;
exports.acceptordenydemand = acceptordenydemand;
exports.getdemandalldemandmasterpaimentwaitngs = getdemandalldemandmasterpaimentwaitngs;
exports.validatepayment = validatepayment;

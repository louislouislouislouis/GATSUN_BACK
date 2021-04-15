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
        "Seulement les membres ayant payé la cotisation peuvent faire des demandes. Voici le lien pour s'incrire 6 mois. https://www.helloasso.com/associations/gatsun/adhesions/bulletin-d-adhesion-gatsun",
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
    if (
      demand.status === "Waiting for validation" ||
      demand.status === "En attente de paiement" ||
      demand.status === "Waiting for keys"
    ) {
      continu = false;
    }
  });
  if (!continu) {
    const error = new HttpError(
      "You already have one demand processing, please wait for Gatsun response before asking new demand",
      402
    );
    return next(error);
  }

  const {
    askingDate,
    askedDatebeg,
    askedDateend,
    message,
    paymentmethod,
    type,
    key,
  } = req.body;
  if (
    user1.role !== "bureau" &&
    user1.role !== "responsable" &&
    user1.role !== "Master" &&
    type === "public"
  ) {
    const error = new HttpError(
      "Only a member at least responsable can order a public session",
      402
    );
    return next(error);
  }

  //define new demand
  let newDemand;
  if (type === "private") {
    console.log("eee");
    newDemand = new Demand({
      from: req.userData.userId,
      body: message,
      type: type,
      askedDatebeg: askedDatebeg,
      askedDateend: askedDateend,
      askingDate: askingDate,
      paymentmethod: paymentmethod,
      status: "Waiting for validation",
      ownerdenomination: `${user1.firstname} ${user1.name}`,
      emaildemandeur: user1.email,
    });
  } else if (type === "public" && key) {
    newDemand = new Demand({
      from: req.userData.userId,
      body: message,
      type: type,
      askedDatebeg: askedDatebeg,
      askedDateend: askedDateend,
      askingDate: askingDate,
      dateofclose: askingDate,
      status: "public validate",
      ownerdenomination: `${user1.firstname} ${user1.name}`,
      emaildemandeur: user1.email,
    });
  } else if (type === "public" && !key) {
    newDemand = new Demand({
      from: req.userData.userId,
      body: message,
      type: type,
      askedDatebeg: askedDatebeg,
      askedDateend: askedDateend,
      askingDate: askingDate,
      status: "Waiting for keys",
      ownerdenomination: `${user1.firstname} ${user1.name}`,
      emaildemandeur: user1.email,
    });
  } else {
    const error = new HttpError("type not good", 402);
    return next(error);
  }
  console.log("vezlv,orijnbpijnrzpibnizunbpiegnfd");
  console.log(newDemand);
  console.log("vezlv,orijnbpijnrzpibnizunbpiegnfd");
  //avertir par mail
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

  //lancer les mails si besoin de clefs ou si privée
  useraavertir.forEach((user, index) => {
    if (type === "private") {
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
    } else if (type === "public" && !key) {
      const mailOptions = {
        from: process.env.MAIL,
        to: user.email,
        subject: `DEMANDE DE SESSION PUBLIC ${newDemand._id}`,
        html: `<div style="background-color:white"><h1 style="color: blue">DEMANDE DE CLEFS.</h1> 
      <p style="color: black">Il y a ${user1.firstname} ${user1.name} qui aimerait organiser une session public. Il n'a pas les clefs. <br><b>INFO SESSION</b>:<br> <br>SESSION-ID: ${newDemand._id} <br>DEMANDEUR: ${user1.firstname} ${user1.name}<br>DATE DE DEBUT: ${newDemand.askedDatebeg}<br>DUREE: ${time}H<br>MESSAGE: ${newDemand.body}H<br><br><br><br> Message envoyée à ${user.firstname} ${user.name} en vue de son role chez gatsun</p></div>
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
  });
  //lancer les mails à tout le monde si session public
  let allusers;
  if (type === "public" && key) {
    try {
      allusers = await User.find({});
      allusers.forEach((user) => {
        const mailOptions = {
          from: process.env.MAIL,
          to: user.email,
          subject: `NOUVELLE SESSIO PUBLIC ${newDemand._id}`,
          html: `<div style="background-color:white"><h1 style="color: blue">Salut! </h1> 
        <p style="color: black">Il y a ${user1.firstname} ${user1.name} qui organise une session public <br><b>INFO SESSION</b>:<br> <br>SESSION-ID: ${newDemand._id} <br>DEMANDEUR: ${user1.firstname} ${user1.name}<br>DATE DE DEBUT: ${newDemand.askedDatebeg}<br>DUREE: ${time}H<br>MESSAGE: ${newDemand.body}H<br><br><br><br> Message envoyée à ${user.firstname} ${user.name}, inscrit(e) à Gatsun</p></div>
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
    } catch (err) {
      console.log(err);
      const error = new HttpError(
        "Fetching user failed, plaease try again later",
        500
      );
      return next(error);
    }
  }
  if (type === "public" && key) {
    const newoccup = new Occupation({
      dateend: demandbd.askedDateend,
      datebegin: demandbd.askedDatebeg,
    });
    try {
      const sess = await Mongoose.startSession();
      sess.startTransaction();
      await newDemand.save({ session: sess });
      await newoccup.save({ session: sess });
      user1.demandes.push(newDemand);
      await user1.save({ session: sess });
      await sess.commitTransaction();
    } catch (err) {
      console.log(err);
      const error = new HttpError("cannnnnot add demand", 500);
      return next(error);
    }
  } else {
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

  const newoccup = new Occupation({
    dateend: demandbd.askedDateend,
    datebegin: demandbd.askedDatebeg,
  });

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

  res.status(201).json({ message: "Success" });
};
const validatekeys = async (req, res, next) => {
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
  const { demand, result } = req.body;
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
  if (demandbd.status !== "Waiting for keys") {
    const error = new HttpError("Cette demande n'attends pas de clefs", 404);
    return next(error);
  }
  if (result) {
    demandbd.status = "Public - Confirmed";
    demandbd.dateofclose = new Date();
  } else {
    demandbd.status = "Public - Unconfirmed";
    demandbd.dateofclose = new Date();
  }

  if (result) {
    const newoccup = new Occupation({
      dateend: demandbd.askedDateend,
      datebegin: demandbd.askedDatebeg,
    });
    try {
      const sess = await Mongoose.startSession();
      sess.startTransaction();
      await demandbd.save({ session: sess });
      await newoccup.save({ session: sess });
      await sess.commitTransaction();
    } catch (err) {
      const error = new HttpError("somethffing wrong", 500);
      return next(error);
    }
    const time =
      -(
        new Date(demandbd.askedDatebeg).getTime() -
        new Date(demandbd.askedDateend).getTime()
      ) / 3600000;
    console.log(time);
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL,
        pass: process.env.MAILMDP,
      },
    });
    try {
      allusers = await User.find({});
      allusers.forEach((user) => {
        const mailOptions = {
          from: process.env.MAIL,
          to: user.email,
          subject: `NOUVELLE SESSIO PUBLIC ${demandbd._id}`,
          html: `<div style="background-color:white"><h1 style="color: blue">Salut! </h1> 
        <p style="color: black">Il y a ${demandbd.ownerdenomination} qui organise une session public <br><b>INFO SESSION</b>:<br> <br>SESSION-ID: ${demandbd._id} <br>DATE DE DEBUT: ${demandbd.askedDatebeg}<br>DUREE: ${time}H<br>MESSAGE: ${demandbd.body}H<br><br><br><br> Message envoyée à ${user.firstname} ${user.name}, inscrit(e) à Gatsun</p></div>
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
    } catch (err) {
      console.log(err);
      const error = new HttpError(
        "Fetching user failed, plaease try again later",
        500
      );
      return next(error);
    }
  } else {
    try {
      await demandbd.save();
    } catch (err) {
      const error = new HttpError("somethffing wrong", 500);
      return next(error);
    }
  }
  res.status(201).json({ message: "Success" });
};
const getdemandalldemandmasterkeys = async (req, res, next) => {
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
    alldemand = await Demand.find({ status: "Waiting for keys" });
  } catch (err) {
    const error = new HttpError("Error with our DB at demand", 500);
    return next(error);
  }

  res.status(201).json({ alldemand });
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
exports.getdemandalldemandmasterkeys = getdemandalldemandmasterkeys;
exports.validatekeys = validatekeys;

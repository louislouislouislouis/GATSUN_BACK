const { validationResult } = require("express-validator");
const Mongoose = require("mongoose");

const Occupation = require("../model/occupation-model");
const Demand = require("../model/demandes-model");
const User = require("../model/user-model");

const util = require("../Controllers/util");
const HttpError = require("../model/http-err");
const mailmanager = require("../MailModel/mailmanager");

const newdemand = async (req, res, next) => {
  //Recuperer l'utilisateur en vérifiant son role
  let user1;
  try {
    user1 = await util.checkrole(
      ["C-VA", "C-NVA", "responsable", "bureau", "Master"],
      req.userData.userId
    );
  } catch (err) {
    console.log(err);
    return next(err);
  }

  //validation de la demande en entrée
  const errors = validationResult(req);
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

  //stop if he has
  if (!continu) {
    const error = new HttpError(
      "You already have one demand processing, please wait for Gatsun response before asking new demand",
      402
    );
    return next(error);
  }

  //data from body
  const {
    askingDate,
    askedDatebeg,
    askedDateend,
    message,
    paymentmethod,
    type,
    key,
  } = req.body;

  //sanitycheck for public session
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
  newDemand = new Demand({
    from: req.userData.userId,
    body: message,
    type: type,
    askedDatebeg: askedDatebeg,
    askedDateend: askedDateend,
    askingDate: askingDate,
    paymentmethod: paymentmethod,
    ...(type === "public" && key && { dateofclose: askingDate }),
    status:
      type === "private"
        ? "Waiting for validation"
        : key
        ? "Public - Confirmed"
        : "Waiting for keys",
    ownerdenomination: `${user1.firstname} ${user1.name}`,
    emaildemandeur: user1.email,
  });

  //time for make easier to manipulate after
  const time =
    (new Date(newDemand.askedDateend).getTime() -
      new Date(newDemand.askedDatebeg).getTime()) /
    3600000;

  //si la demande est public et que le demandeur a les clefs on peut tout de suite occuper le stud
  if (type === "public" && key) {
    const newoccup = new Occupation({
      dateend: newDemand.askedDateend,
      datebegin: newDemand.askedDatebeg,
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
    //sinon on ne met pas l'occupation
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

  //Ici tout à été sauvegarder dans la BD, il faut avertir les utilisateurs
  //mail à envoyer en cas de succès
  const mymailmanager = new mailmanager();
  let useraavertir;
  let mailaenvoyer = [];
  if (type === "private") {
    try {
      await mymailmanager.sendmailpourdemandesessionpriv(newDemand);
    } catch (err) {
      return next(err);
    }
  } else if (type === "public") {
    if (key) {
      try {
        mymailmanager.sendmailpoursessionpublicattlemonde(newDemand);
      } catch (err) {
        return next(err);
      }
    } else {
      try {
        mymailmanager.sendmailpourdemandedeclefs(newDemand);
      } catch (err) {
        return next(err);
      }
    }
  }

  //envoyer le mail
  mymailmanager.sendMail(mailaenvoyer);

  //la réponse
  res.status(201).json({ newDemand: newDemand._id });
};

const getdemandbyuserId = async (req, res, next) => {
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
  //recupérer profil utilisateur et vérifier son role
  let usermaster;
  try {
    usermaster = await util.checkrole(
      ["responsable", "bureau", "Master"],
      req.userData.userId
    );
  } catch (err) {
    console.log(err);
    return next(err);
  }

  //recup data
  const { demand } = req.body;

  //recup demand in DB
  let demandbd;
  try {
    demandbd = await Demand.findById(demand);
  } catch (err) {
    const error = new HttpError("Error with our DB at demand", 500);
    return next(error);
  }

  // check demand is existing and waitings to be payed
  if (!demandbd) {
    const error = new HttpError("Error non demanddb", 404);
    return next(error);
  }
  if (demandbd.status !== "En attente de paiement") {
    const error = new HttpError("Cette demande n'attends pas de paiement", 404);
    return next(error);
  }

  //modify the demand
  demandbd.status = "Confirmed - CB payed";
  demandbd.dateofclose = new Date();

  //create an occupation for the stud
  const newoccup = new Occupation({
    dateend: demandbd.askedDateend,
    datebegin: demandbd.askedDatebeg,
  });

  //save in db the new state of demand AND occupation of stud
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

  //send rep
  res.status(201).json({ message: "Success" });
};

const validatekeys = async (req, res, next) => {
  //validation de la demande en entrée
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(new HttpError("Error input", 422));
  }

  //recupérer profil utilisateur et vérifier son role
  let usermaster;
  try {
    usermaster = await util.checkrole(
      ["responsable", "bureau", "Master"],
      req.userData.userId
    );
  } catch (err) {
    console.log(err);
    return next(err);
  }

  //recup data
  const { demand, result } = req.body;

  //recup demand in db
  let demandbd;
  try {
    demandbd = await Demand.findById(demand);
  } catch (err) {
    const error = new HttpError("Error with our DB at demand", 500);
    return next(error);
  }

  //check demand is existing and his status is wainting for key
  if (!demandbd) {
    const error = new HttpError("Error non demanddb", 404);
    return next(error);
  }
  if (demandbd.status !== "Waiting for keys") {
    const error = new HttpError("Cette demande n'attends pas de clefs", 404);
    return next(error);
  }

  //2 choices --> VAlidate or not
  if (result) {
    //change demand of DB
    demandbd.status = "Public - Confirmed";
    demandbd.dateofclose = new Date();

    //create an occupation for stud
    const newoccup = new Occupation({
      dateend: demandbd.askedDateend,
      datebegin: demandbd.askedDatebeg,
    });

    //save demand AND Occupation in DB
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

    //make things easier to manipulate after
    const time =
      (new Date(demandbd.askedDateend).getTime() -
        new Date(demandbd.askedDatebeg).getTime()) /
      3600000;

    //here all is save in DB - time to inform user with mail
    const mymailmanager = new mailmanager();
    try {
      mymailmanager.sendmailpoursessionpublicattlemonde(demandbd);
    } catch (err) {
      return next(err);
    }
  } else {
    //acyualise demand db and save it
    demandbd.status = "Public - Unconfirmed";
    demandbd.dateofclose = new Date();
    try {
      await demandbd.save();
    } catch (err) {
      const error = new HttpError("Don' work in demand", 500);
      return next(error);
    }
  }

  //send rep
  res.status(201).json({ message: "Success" });
};

const getdemandalldemandmasterkeys = async (req, res, next) => {
  //recup and check role user
  let usermaster;
  try {
    usermaster = await util.checkrole(
      ["responsable", "bureau", "Master"],
      req.userData.userId
    );
  } catch (err) {
    console.log(err);
    return next(err);
  }

  //get alldemand waitings for keys
  let alldemand;
  try {
    alldemand = await Demand.find({ status: "Waiting for keys" });
  } catch (err) {
    const error = new HttpError("Error with our DB at demand", 500);
    return next(error);
  }

  //send rep
  res.status(201).json({ alldemand });
};

const getdemandalldemandmaster = async (req, res, next) => {
  //recup and check role user
  let usermaster;
  try {
    usermaster = await util.checkrole(
      ["responsable", "bureau", "Master"],
      req.userData.userId
    );
  } catch (err) {
    console.log(err);
    return next(err);
  }

  //get alldemand waitings for validation
  let alldemand;
  try {
    alldemand = await Demand.find({ status: "Waiting for validation" });
  } catch (err) {
    const error = new HttpError("Error with our DB at demand", 500);
    return next(error);
  }

  //send rep
  res.status(201).json({ alldemand });
};

const getdemandalldemandmasterpaimentwaitngs = async (req, res, next) => {
  //recup and check role user
  let usermaster;
  try {
    usermaster = await util.checkrole(
      ["responsable", "bureau", "Master"],
      req.userData.userId
    );
  } catch (err) {
    console.log(err);
    return next(err);
  }

  //get alldemand waitings for payment
  let alldemand;
  try {
    alldemand = await Demand.find({ status: "En attente de paiement" });
  } catch (err) {
    const error = new HttpError("Error with our DB at demand", 500);
    return next(error);
  }

  //send rep
  res.status(201).json({ alldemand });
};

const acceptordenydemand = async (req, res, next) => {
  console.log(req.userData.userId);
  //Recuperer l'utilisateur en vérifiant son role
  let usermaster;
  try {
    usermaster = await util.checkrole(
      ["responsable", "bureau", "Master"],
      req.userData.userId
    );
  } catch (err) {
    console.log(err);
    return next(err);
  }

  //validation de la demande en entrée
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(new HttpError("Error input", 422));
  }

  //recup data from body
  const { demand, result, date, message } = req.body;

  //check in DB
  let demandbd;
  try {
    demandbd = await Demand.findById(demand);
  } catch (err) {
    const error = new HttpError("Error with our DB at demand", 500);
    return next(error);
  }

  //sanity validation for demand DB
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

  //preparer les mails
  const mymailmanager = new mailmanager();
  demandbd.validateby = req.userData.userId;
  demandbd.feedbackdate = date;

  if (result) {
    //only if we validate data
    if (demandbd.paymentmethod === "cash") {
      //uniquement si la demande est en cash
      demandbd.dateofclose = date;
      demandbd.status = "Confirmed - Cash";
    } else {
      //uniquement si la est en cb
      demandbd.status = "En attente de paiement";

      //Envoyer le mail
      mymailmanager.sendmailpourdemanderpaiement(demandbd);

      //creer une occupationd du studio
      const newoccup = new Occupation({
        dateend: demandbd.askedDateend,
        datebegin: demandbd.askedDatebeg,
      });

      //enregister dans la DB et en plus l'occup
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
    }
  } else {
    //only if on refuse la session
    demandbd.feedback = message;
    demandbd.status = "Refusé";
    demandbd.dateofclose = date;
    demandbd.feedbackdate = date;

    //enregister dasn la DB
    try {
      await demandbd.save();
    } catch (err) {
      console.log(err);
      const error = new HttpError("cannnnnot add demand", 500);
      return next(error);
    }
  }
  //fiannly send response
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

const HttpError = require("../model/http-err");
const axios = require("axios");
const User = require("../model/user-model");
const Demand = require("../model/demandes-model");

/* ... */
const fake = [
  {
    order: {
      id: 47192,
      date: "2021-03-01T21:36:22.1562791+00:00",
      formSlug: "session-privee",
      formType: "Event",
      organizationSlug: "gatsun",
    },
    payer: {
      email: "Boris.chardonneau@orange.fr",
      country: "FRA",
      firstName: "Boris",
      lastName: "Chardonneau",
    },
    payments: [[Object]],
    name: "1 heure avec assistance",
    user: { firstName: "Boris", lastName: "Chardonneau " },
    priceCategory: "Fixed",
    ticketUrl:
      "https://www.helloasso.com/associations/gatsun/evenements/session-privee/ticket?ticketId=20747192&ag=20747192",
    isCanceled: false,
    id: 20747192,
    amount: 500,
    type: "Registration",
    initialAmount: 500,
    state: "Processed",
  },
];
const getpayment = async (req, res, next) => {
  console.log(req.userData.userId);

  //verify identify of caller
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

  //Checkif we have attente alldemand is an array of demanding payement
  let alldemand;
  try {
    alldemand = await Demand.find({ status: "En attente de paiement" });
  } catch (err) {
    const error = new HttpError("Error with our DB at demand", 500);
    return next(error);
  }
  if (alldemand.length === 0) {
    const error = new HttpError("You have not waitings demand", 500);
    return next(error);
  }

  let changment = false;
  //Creating array for looping into hello Asso Service
  const arraydemanding = [];

  //dummy array to avoir repetitions
  const timetocheck = [];

  alldemand.forEach((el) => {
    const time =
      -(
        new Date(el.askedDatebeg).getTime() -
        new Date(el.askedDateend).getTime()
      ) / 3600000;

    //Pour faciliter la suite dans la recherche d'evenement car va que jusqu'à 5
    if (time === 6) {
      time = 5;
    }

    if (time === 1 && !timetocheck.includes(1)) {
      timetocheck.push(1);
      arraydemanding.push({ url: "session-privee-1h", time: 1 });
    }
    if (time === 2 && !timetocheck.includes(2)) {
      timetocheck.push(2);
      arraydemanding.push({ url: "session-privee-2h", time: 2 });
    }
    if (time === 3 && !timetocheck.includes(3)) {
      timetocheck.push(3);
      arraydemanding.push({ url: "session-privee-1h-1", time: 3 });
    }
    if (time === 4 && !timetocheck.includes(4)) {
      timetocheck.push(4);
      arraydemanding.push({ url: "session-privee-4h", time: 4 });
    }
    if (time === 5 && !timetocheck.includes(5)) {
      timetocheck.push(5);
      arraydemanding.push({ url: "session-privee-5h-et-plus", time: 5 });
    }
  });

  //Geting token for hello Asso service
  const params = new URLSearchParams();
  params.append("client_id", process.env.IDHELLOASSO);
  params.append("grant_type", "refresh_token");
  params.append("refresh_token", process.env.TOKENREFRESH);
  const config = {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  };
  const url = "https://api.helloasso.com/oauth2/token";
  let token;
  try {
    const rep = await axios.post(url, params, config);
    console.log(rep.data);
    token = rep.data.access_token;
  } catch (err) {
    console.log(err);
    const error = new HttpError("Error with Hello Asso contact master", 500);
    return next(error);
  }

  //looping into array to update demand if payed
  arraydemanding.forEach(async (element) => {
    //Etape 1: Récupérer toutes les données de payment liée à un Event situé dans l'array
    let repreq1;
    try {
      const rep = await axios.get(
        `https://api.helloasso.com/v5/organizations/gatsun/forms/Event/${element.url}/items/?retrieveAll=true`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      repreq1 = rep.data.data;
    } catch (err) {
      console.log(err);
      const error = new HttpError("Error with Hello Asso contact master", 500);
      return next(error);
    }

    //Etape 2: Rechercher parmi tous les payment d'un Event celui qui correspond au bon email
    if (repreq1) {
      repreq1.forEach(async (el) => {
        //on prend les info qui nous interesse
        let emailtofind = el.payer.email;
        let datepayement = el.order.date;

        //on recherche parmis notre tableau de demand à actualiser celui qui correspond au bon email
        const demandtoadapt = alldemand.find(
          (demand) => demand.emaildemandeur === emailtofind && demand
        );

        //seulement si l'email est  dans le tableau des valeur à actualiser et dans nos req

        if (demandtoadapt) {
          //sommes nous dans la boucle qui correspond au bon time duration?
          const demandtimewearelookingfor =
            -(
              new Date(demandtoadaptl.askedDatebeg).getTime() -
              new Date(demandtoadapt.askedDateend).getTime()
            ) / 3600000;

          if (demandtimewearelookingfor === element.time) {
            //La date de payment est-elle bonne?
            if (
              new Date(datepayement).getTime() -
                new Date(demand.askingDate).getTime() >
              0
            ) {
              //on cherche à quel élément de notre array de demand à actualiser cela correspond
              demandtoadapt.status = "Confirmed - CB";
              demandtoadapt.status = new Date();
              try {
                await demandtoadapt.save();
                changment = true;
              } catch (err) {
                const error = new HttpError("somethffing wrong", 500);
                return next(error);
              }
            }
          }
        }
      });
    }
  });

  res
    .status(201)
    .json({
      message: `${
        changment
          ? "La base de données à été actualiser"
          : "LA base de données ne s'est pas actualisé"
      }`,
    });
};

exports.getpayment = getpayment;

const nodemailer = require("nodemailer");
const User = require("../model/user-model");
const HttpError = require("../model/http-err");

class SSEManager {
  constructor() {
    /* On garde une liste de tous les clients connectés */

    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL,
        pass: process.env.MAILMDP,
      },
    });
  }
  sendMail(Mails) {
    Mails.forEach((mail) => {
      const mailOptions = {
        from: process.env.MAIL,
        to: mail.destinataire,
        subject: mail.objet,
        html: mail.text,
      };
      this.transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(error);
          throw error;
        } else {
          console.log("Email sent: " + info.response);
        }
      });
    });
  }
  async sendmailpourdemandesessionpriv(demand) {
    let useraavertir;
    try {
      useraavertir = await User.find({
        $or: [{ role: "responsable" }, { role: "bureau" }, { role: "Master" }],
      });
      const time =
        (new Date(demand.askedDateend).getTime() -
          new Date(demand.askedDatebeg).getTime()) /
        3600000;
      useraavertir.forEach((user) => {
        const mailOptions = {
          from: process.env.MAIL,
          to: user.email,
          subject: `DEMANDE DE SESSION PRIVÉE ${demand._id}`,
          html: `<div style="background-color:white">
          <p style="color: black">
          Bonjour ${user.firstname} ${user.name},
          <br>
          Il y a ${demand.ownerdenomination} qui aimerait faire une session privée
          <br>
          <b>INFO SESSION</b>:
          <br>
          <br>
          SESSION-ID: ${demand._id}
          <br>
          DEMANDEUR: ${demand.ownerdenomination}
          <br>
          DATE DE DEBUT: ${demand.askedDatebeg}
          <br>
          DUREE: ${time}H
          <br>
          MESSAGE: ${demand.body}
          <br>
          MODE DE PAIEMENT: ${demand.paymentmethod}
          <br>
          <br>
          <br>
          Message envoyée à ${user.email} en vue de son role de ${user.role} chez gatsun
          </p><
          </div>
          `,
        };
        this.transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.log(error);
            throw error;
          } else {
            console.log("Email sent: " + info.response);
          }
        });
      });
    } catch (err) {
      console.log(err);
      const error = new HttpError("Error with our DB at user", 500);
      throw error;
    }
  }
  async sendmailpoursessionpublicattlemonde(demand) {
    let useraavertir;
    try {
      useraavertir = await User.find({});
      const time =
        (new Date(demand.askedDateend).getTime() -
          new Date(demand.askedDatebeg).getTime()) /
        3600000;
      useraavertir.forEach((user) => {
        const mailOptions = {
          from: process.env.MAIL,
          to: user.email,
          subject: `SESSION PUBLIC!`,
          html: `<div style="background-color:white">
          <p style="color: black">
          Bonjour ${user.firstname} ${user.name},
          <br>
          Il y a ${demand.ownerdenomination} qui organise une session publique au stud!
          <br>
          <b>INFO SESSION</b>:
          <br>
          <br>
          SESSION-ID: ${demand._id}
          <br>
          ORGANISATEUR: ${demand.ownerdenomination}
          <br>
          DATE DE DEBUT: ${demand.askedDatebeg}
          <br>
          DUREE: ${time}H
          <br>
          MESSAGE: ${demand.body}
          <br>
          <br>
          <br>
          Message envoyée à ${user.email}, incrit sur le GATWEB
          </p><
          </div>
          `,
        };
        this.transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.log(error);
            throw error;
          } else {
            console.log("Email sent: " + info.response);
          }
        });
      });
    } catch (err) {
      console.log(err);
      const error = new HttpError("Error with our DB at user", 500);
      throw error;
    }
  }
  async sendmailpourdemandedeclefs(demand) {
    let useraavertir;
    try {
      useraavertir = await User.find({
        $or: [{ role: "responsable" }, { role: "bureau" }, { role: "Master" }],
      });
      const time =
        (new Date(demand.askedDateend).getTime() -
          new Date(demand.askedDatebeg).getTime()) /
        3600000;
      useraavertir.forEach((user) => {
        const mailOptions = {
          from: process.env.MAIL,
          to: user.email,
          subject: `DEMANDE DE CLEFS !`,
          html: `<div style="background-color:white">
          <p style="color: black">
          Bonjour ${user.firstname} ${user.name},
          <br>
          Il y a ${demand.ownerdenomination} qui aurait besoin des clefs pour organiser une session public au stud
          <br>
          <b>INFO SESSION</b>:
          <br>
          <br>
          SESSION-ID: ${demand._id}
          <br>
          ORGANISATEUR: ${demand.ownerdenomination}
          <br>
          DATE DE DEBUT: ${demand.askedDatebeg}
          <br>
          DUREE: ${time}H
          <br>
          MESSAGE: ${demand.body}
          <br>
          <br>
          <br>
          Message envoyée à ${user.email} en vue de son role de ${user.role} chez gatsun
          </p><
          </div>
          `,
        };
        this.transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.log(error);
            throw error;
          } else {
            console.log("Email sent: " + info.response);
          }
        });
      });
    } catch (err) {
      console.log(err);
      const error = new HttpError("Error with our DB at user", 500);
      throw error;
    }
  }
  sendmailpourdemanderpaiement(demand) {
    const time =
      (new Date(demand.askedDateend).getTime() -
        new Date(demand.askedDatebeg).getTime()) /
      3600000;
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
      to: demand.emaildemandeur,
      subject: `Confirmation session privée!`,
      html: `<div style="background-color:white">
          <p style="color: black">
          Bonjour ${demand.ownerdenomination} voila le lien pour payer
          <br>
          ${link}     
          <br>
          <b>INFO SESSION</b>:
          <br>
          <br>
          SESSION-ID: ${demand._id}
          <br>
          ORGANISATEUR: ${demand.ownerdenomination}
          <br>
          DATE DE DEBUT: ${demand.askedDatebeg}
          <br>
          DUREE: ${time}H
          <br>
          MESSAGE: ${demand.body}
          <br>
          MODE DE PAIEMENT: ${demand.paymentmethod}
          <br>
          <br>
          <br>
          Message envoyée à ${demand.emaildemandeur}, incrit sur le GATWEB
          </p><
          </div>
          `,
    };
    this.transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        throw error;
      } else {
        console.log("Email sent: " + info.response);
      }
    });
  }
}

module.exports = SSEManager;

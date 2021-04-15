const nodemailer = require("nodemailer");

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
}

module.exports = SSEManager;

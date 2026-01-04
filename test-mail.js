require("dotenv").config();
const nodemailer = require("nodemailer");
// SMTP_HOST = smtp.gmail.com
// SMTP_USER = contact@strikeo.com
// SMTP_PASSWORD = imoxbliwmgiqsrti
(async () => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    secure: false,
    port: 587,
    auth: {
      user: "contact@strikeo.com",
      pass: "imoxbliwmgiqsrti",
    },
  });

  await transporter.verify();
  console.log("✅ Gmail SMTP verified");

  await transporter.sendMail({
    from: `"LINKCAPS" <linkcaps.official@gmail.com>`,
    to: "shsohel.tc@gmail.com",
    subject: "Test Mail",
    text: "Gmail SMTP working!",
  });

  console.log("✅ Email sent");
})();

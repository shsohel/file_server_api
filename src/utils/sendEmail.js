const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  const transporter = await nodemailer.createTransport({
    service: process.env.SMTP_SERVICE,
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
    tls: {
      minVersion: "TLSv1.2",
    },
  });

  // Optional: verify at startup
  transporter
    .verify()
    .then(() => console.log("📧 SMTP ready"))
    .catch(console.error);
  // send mail with defined transport object
  const message = {
    from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    //text: options.message,
    html: options.message, // html body
  };

  const send = await transporter.sendMail(message);
  console.log("Message sent: %s", send);
};

module.exports = sendEmail;

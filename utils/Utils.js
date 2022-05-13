if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const User = require("../models/user");
const nodemailer = require("nodemailer");
var smtpTransport = nodemailer.createTransport({
  service: "Mail.ru",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS,
  },
});

module.exports.sendEmail = async (host, token, email) => {
  try {
    var mailOptions = {
      to: email,
      from: "musicapp2.0@mail.ru",
      subject: "Auth Verification",
      text:
        "Welcome To Sample Registration\n\n" +
        "Please click on the following link, or paste this into your browser to complete verification process:\n\n" +
        `https://${host}/register/${token}` +
        "\n\n" +
        "If you did not request this, please ignore this email please change your email account password.\n",
    };
    await smtpTransport.sendMail(mailOptions);
  } catch (error) {
    return error;
  }
};
module.exports.verifiedUser = async (req, res, next) => {
  const { username } = req.body;
  const user = await User.findOne({ username, confirmed: true });
  if (!user) {
    req.flash("error", "User Is not verified or doesn't exists");
    res.redirect("/login");
  }
  next();
};

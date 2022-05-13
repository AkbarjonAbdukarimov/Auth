const express = require("express");
const router = express.Router();
const passport = require("passport");
const Utils = require("../utils/Utils");
const crypto = require("crypto");
const User = require("../models/user");

router.route("/").get((req, res) => res.render("index"));
router
  .route("/register")
  .get((req, res) => res.render("register"))
  .post(async (req, res) => {
    try {
      const { email, username, password } = req.body;
      const token = await crypto.randomBytes(20).toString("hex");
      const user = await new User({
        email,
        username,
        token,
      });
      await User.register(user, password);
      Emailer.sendEmail(req.headers.host, token, email);
      req.flash(
        "success",
        "An e-mail has been sent to " +
          user.email +
          " with further instructions."
      );
      res.render("info");
    } catch (e) {
      req.flash("error", e.message);
      res.redirect("register");
    }
  });

router
  .route("/login")
  .get((req, res) => res.render("login"))
  .post(
    Utils.verifiedUser,
    passport.authenticate("local", {
      failureFlash: true,
      failureRedirect: "/login",
    }),
    (req, res) => {
      req.flash("success", "Welcome Back!");
      res.redirect("/");
    }
  );

router.route("/register/:token").get(async (req, res) => {
  const userVer = await User.findOneAndUpdate(
    {
      token: req.params.token,
      expireAt: { $gt: Date.now() },
    },
    { confirmed: true, token: null, expireAt: null }
  );
  if (!userVer) {
    req.flash(
      "error",
      "User not Found or Verification Link Has Expired. Try again!"
    );
    res.redirect("/register");
  }
  req.login(userVer, (err) => {
    if (err) {
      req.flash("error", err.message);
      return res.redirect("/register");
    }
    req.flash("success", "Welcome!");
    res.redirect("/");
  });
});
router.route("/logout").get((req, res) => {
  req.logOut();
  req.flash("success", "Bye!");
  res.redirect("/");
});
module.exports = router;

const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const session = require("express-session");
const flash = require("connect-flash");
const MongoStore = require("connect-mongo");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const User = require("./models/user");

const app = express();

app.set("view engine", "ejs");

const secret = "thisshouldbebettersecret!";

const dbURL =
  "mongodb+srv://MusicAppAdmin:MusicAppAdmin_6865@cluster0.bk9hd.mongodb.net/Users?retryWrites=true&w=majority";
mongoose.connect(dbURL);
const db = mongoose.connection;
db.on("error", console.log.bind(console, "connection error:"));
db.once("open", () => {
  console.log("DATABASE CONNECTED!");
});
var smtpTransport = nodemailer.createTransport({
  service: "Mail.ru",
  auth: {
    user: "musicapp2.0@mail.ru",
    pass: "p3wGfxSpn4dLGD9TdGGB",
  },
});

//session
const store = new MongoStore({
  mongoUrl: dbURL,
  secret,
  touchAfter: 24 * 3600,
});
store.on("error", function (e) {
  console.log("SESSION STRORE ERROR", e);
});
const sessionObject = {
  store,
  secret,
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    secure: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};

//middlewares
app.use(express.urlencoded({ extended: true }));
app.use(session(sessionObject));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  console.log(req.session);
  res.locals.currentUser = req.user;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  if (req.session.passport) {
    res.locals.currentUser = s.password.user;
  }
  if (req.session.flash) {
    res.locals.success = req.session.flash.success || null;
    res.locals.error = req.session.flash.error || null;
  }
  console.log("from middleware");
  console.log(req.user);
  next();
});
app.get("/", (req, res) => {
  res.render("index");
});
app.get("/login", (req, res) => res.render("login"));
app.post(
  "/login",
  passport.authenticate("local", {
    failureFlash: true,
    failureRedirect: "/login",
  }),
  (req, res) => {
    console.log("from login");
    console.log(req.user);
    req.flash("success", "Welcome Back!");
    res.redirect("/");
  }
);

app.get("/register", (req, res) => res.render("register"));
app.post("/register", async (req, res) => {
  try {
    const { email, username, password } = req.body;
    //  verification stuff
    const token = await crypto.randomBytes(20).toString("hex");

    const user = await new User({
      email,
      username,
      token,
    });
    const registeredUser = await User.register(user, password);
    console.log(registeredUser);
    var mailOptions = {
      to: email,
      from: "musicapp2.0@mail.ru",
      subject: "Auth Verification",
      text:
        "Welcome To Sample Registration\n\n" +
        "Please click on the following link, or paste this into your browser to complete verification process:\n\n" +
        `https://${req.headers.host}/register/${token}` +
        "\n\n" +
        "If you did not request this, please ignore this email please change your email account password.\n",
    };
    await smtpTransport.sendMail(mailOptions, function (err) {
      req.flash(
        "success",
        "An e-mail has been sent to " +
          user.email +
          " with further instructions."
      );
    });
    res.render("info");
  } catch (e) {
    req.flash("error", e.message);
    res.redirect("register");
  }
});
app.get("/register/:token", async (req, res) => {
  // const user = await User.findOneAndUpdate(
  //   {
  //     token: req.params.token,
  //     expiresAt: { $gt: Date.now() },
  //   },
  //   { confirmed: true, token: null, expiresAt: null }
  // );

  // req.login(user, (err) => {
  //   if (err) return next(err);
  //   req.flash("success", "Welcome!");
  //   res.redirect("/");
  // });
  const user = await User.findOne({
    token: req.params.token,
    expiresAt: { $gt: Date.now() },
  });
});

app.get("/logout", (req, res) => {
  req.logOut();
  req.flash("success", "Bye!");
  res.redirect("/");
});
app.listen(3000, () => console.log("runing on port 3000"));

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const session = require("express-session");
const flash = require("connect-flash");
const MongoStore = require("connect-mongo");
const crypto = require("crypto");
const User = require("./models/user");
const ejsMate = require("ejs-mate");
const path = require("path");
const app = express();

const userRoutes = require("./routes/users");

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const secret = process.env.SECRET;
const dbURL = process.env.DB_URL;
mongoose.connect(dbURL);
const db = mongoose.connection;
db.on("error", console.log.bind(console, "connection error:"));
db.once("open", () => {
  console.log("DATABASE CONNECTED!");
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
    secure: false,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};

//middlewares
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(session(sessionObject));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});
app.use("/", userRoutes);
// // app.get("/", (req, res) => {
// //   res.render("index");
// // });
// //app.get("/login", (req, res) => res.render("login"));
// app.post(
//   "/login",
//   passport.authenticate("local", {
//     failureFlash: true,
//     failureRedirect: "/login",
//   }),
//   (req, res) => {
//     req.flash("success", "Welcome Back!");
//     res.redirect("/");
//   }
// );

// app.get("/register", (req, res) => res.render("register"));
// app.post("/register", async (req, res) => {
//   try {
//     const { email, username, password } = req.body;
//     //  verification stuff
//     const token = await crypto.randomBytes(20).toString("hex");

//     const user = await new User({
//       email,
//       username,
//       token,
//     });
//     const registeredUser = await User.register(user, password);

//     Emailer.sendEmail(req.headers.host, token, email);
//     req.flash(
//       "success",
//       "An e-mail has been sent to " + user.email + " with further instructions."
//     );
//     res.render("info");
//   } catch (e) {
//     req.flash("error", e.message);
//     res.redirect("register");
//   }
// });
// app.get("/register/:token", async (req, res) => {
//   const userVer = await User.findOneAndUpdate(
//     {
//       token: req.params.token,
//       expiresAt: { $gt: Date.now() },
//     },
//     { confirmed: true, token: null, expiresAt: null }
//   );
//   if (!userVer) {
//     req.flash(
//       "error",
//       "User not Found or Verification Link Has Expired. Try again!"
//     );
//     res.redirect("/register");
//   }
//   req.login(userVer, (err) => {
//     if (err) {
//       req.flash("error", err.message);
//       return res.redirect("/register");
//     }
//     req.flash("success", "Welcome!");
//     res.redirect("/");
//   });
// });

// app.get("/logout", (req, res) => {
//   req.logOut();
//   req.flash("success", "Bye!");
//   res.redirect("/");
// });
app.listen(3000, () => console.log("runing on port 3000"));

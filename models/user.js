const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  confirmed: { type: Boolean, default: false },
  token: { type: String },
  created: { type: String, default: Date.now() },
  expireAt: {
    type: Date,
    default: Date.now() + 16 * 60 * 1000,
    expires: Date.now() + 16 * 60 * 1000,
  },
});
UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);

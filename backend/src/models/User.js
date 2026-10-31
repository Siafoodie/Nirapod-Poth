const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
      default: "", 
    },

    profileImage: {
      type: String,
      default: "",
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

       role: {
      type: String,
      enum: ["user", "police", "admin"],
      default: "user",
    },

    // Account gate (police must be approved)
    accountStatus: {
      type: String,
      enum: ["active", "pending_verification", "rejected"],
      default: "active",
    },

    policeRank: {
      type: String,
      enum: [
        "constable",
        "nayek",
        "assistant_sub_inspector",
        "sub_inspector",
        "inspector",
        "asp",
        "other",
      ],
    },

    // Current Unit / Police Station posting
    policeUnit: {
      type: String,
      trim: true,
      maxlength: 200,
    },

    // Official BP ID number
    policeId: {
      type: String,
      trim: true,
      sparse: true,
    },

    // Scanned Bangladesh Police Service ID card (path or URL)
    policeIdCardImage: {
      type: String,
      default: "",
    },

    verificationNote: {
      type: String, 
      default: "",
      maxlength: 500,
    },

    verifiedAt: {
      type: Date,
      default: null,
    }, 
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.models.User || mongoose.model("User", userSchema); 
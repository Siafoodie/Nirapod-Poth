const jwt = require("jsonwebtoken");
const User = require("../models/User");

const POLICE_EMAIL_DOMAINS = [
  "police.gov.bd",
  // "dmp.gov.bd",
];

function isOfficialPoliceEmail(email) {
  const normalized = String(email || "").trim().toLowerCase();
  const domain = normalized.split("@")[1] || "";
  return POLICE_EMAIL_DOMAINS.includes(domain);
}

const ALLOWED_POLICE_RANKS = [
  "constable",
  "nayek",
  "assistant_sub_inspector",
  "sub_inspector",
  "inspector",
  "asp",
  "other",
];

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role || "user",
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || "7d",
    }
  );
};

const publicUser = (user) => {
  const payload = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role || "user",
    accountStatus: user.accountStatus || "active",
  };

  if (user.role === "police") {
    payload.policeRank = user.policeRank || null;
    payload.policeUnit = user.policeUnit || null;
    // policeId / ID card image — not exposed on public client payload
  }

  return payload;
};

// REGISTER USER or POLICE
const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      policeRank,
      policeId,
      policeUnit,
      policeIdCardImage,
    } = req.body || {};

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    // Never allow admin via public register
    const normalizedRole = role === "police" ? "police" : "user";
    const normalizedEmail = email.trim().toLowerCase();

    // ----- Police-only rules (all required) -----
    let idCardPath = "";

    if (normalizedRole === "police") {
      // 1) Official email domain only
      if (!isOfficialPoliceEmail(normalizedEmail)) {
        return res.status(400).json({
          message:
            "Police accounts must use an official email (e.g. name@police.gov.bd). Gmail/Yahoo are not allowed.",
        });
      }

      // 2) Rank / designation
      if (
        typeof policeRank !== "string" ||
        !ALLOWED_POLICE_RANKS.includes(policeRank)
      ) {
        return res.status(400).json({
          message:
            "Valid police rank is required (constable, nayek, ASI, SI, inspector, ASP, other)",
        });
      }

      // 3) Current unit / police station
      if (typeof policeUnit !== "string" || !policeUnit.trim()) {
        return res.status(400).json({
          message: "Current unit / police station posting is required",
        });
      }

      // 4) Official BP ID
      if (typeof policeId !== "string" || !policeId.trim()) {
        return res.status(400).json({
          message: "Official BP ID number is required for police registration",
        });
      }

      // 5) ID card image — multer file OR body path/string
      idCardPath =
        (req.file && `/uploads/police-id/${req.file.filename}`) ||
        (typeof policeIdCardImage === "string" ? policeIdCardImage.trim() : "");

      if (!idCardPath) {
        return res.status(400).json({
          message:
            "Scanned copy of official Bangladesh Police ID card is required",
        });
      }
    }

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists with this email",
      });
    }

    const userPayload = {
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: normalizedRole,
      accountStatus: normalizedRole === "police" ? "pending_verification" : "active",
    };

    if (normalizedRole === "police") {
      userPayload.policeRank = policeRank;
      userPayload.policeId = policeId.trim();
      userPayload.policeUnit = policeUnit.trim();
      userPayload.policeIdCardImage = idCardPath;
    }

    const user = await User.create(userPayload);

    // Police stays locked until admin approves — no login token yet
    if (normalizedRole === "police") {
      return res.status(201).json({
        message:
          "Police registration received. Your account is locked until admin verifies your ID.",
        token: null,
        user: publicUser(user),
        requiresVerification: true,
      });
    }

    const token = generateToken(user);

    return res.status(201).json({
      message: "Account created successfully",
      token,
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Register Error:", error.code || error.name, error.message);

    if (error.code === 11000) {
      return res.status(400).json({
        message: "User already exists with this email",
      });
    }

    return res.status(500).json({
      message: "Server error while creating account",
    });
  }
};

// LOGIN USER
const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const passwordMatches = await user.comparePassword(password);

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Police must be admin-approved before login
    if (user.role === "police" && user.accountStatus !== "active") {
      return res.status(403).json({
        message:
          user.accountStatus === "pending_verification"
            ? "Your police account is pending admin verification."
            : "Your police account was rejected. Contact support.",
        accountStatus: user.accountStatus,
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      message: "Login successful",
      token,
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Login Error:", error.code || error.name);

    return res.status(500).json({
      message: "Server error while logging in",
    });
  }
};

module.exports = {
  register,
  login,
};  
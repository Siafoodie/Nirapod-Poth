const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const User = require("../models/User");
const Otp = require("../models/Otp");

const POLICE_EMAIL_DOMAINS = [
  "police.gov.bd",
];

function isOfficialPoliceEmail(email) {
  const normalized = String(email || "").trim().toLowerCase();
  const domain = normalized.split("@")[1] || "";
  return POLICE_EMAIL_DOMAINS.includes(domain);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
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
  }

  return payload;
};

const sendOtpEmail = async (email, otp) => {
  if (process.env.SMTP_HOST) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: "Your Nirapod Poth verification code",
      text: `Your OTP is ${otp}. It expires in 10 minutes.`,
    });
  } else {
    console.log(`[OTP] ${email} -> ${otp}`);
  }
};

// REGISTER USER or POLICE (step 1: send OTP)
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

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Invalid email address" });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const normalizedRole = role === "police" ? "police" : "user";
    const normalizedEmail = email.trim().toLowerCase();

    let idCardPath = "";

    if (normalizedRole === "police") {
      if (!isOfficialPoliceEmail(normalizedEmail)) {
        return res.status(400).json({
          message:
            "Police accounts must use an official email (e.g. name@police.gov.bd). Gmail/Yahoo are not allowed.",
        });
      }
      if (
        typeof policeRank !== "string" ||
        !ALLOWED_POLICE_RANKS.includes(policeRank)
      ) {
        return res.status(400).json({
          message:
            "Valid police rank is required (constable, nayek, ASI, SI, inspector, ASP, other)",
        });
      }
      if (typeof policeUnit !== "string" || !policeUnit.trim()) {
        return res.status(400).json({
          message: "Current unit / police station posting is required",
        });
      }
      if (typeof policeId !== "string" || !policeId.trim()) {
        return res.status(400).json({
          message: "Official BP ID number is required for police registration",
        });
      }
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

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        message: "User already exists with this email",
      });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const data = {
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: normalizedRole,
      policeRank,
      policeId: typeof policeId === "string" ? policeId.trim() : "",
      policeUnit: typeof policeUnit === "string" ? policeUnit.trim() : "",
      policeIdCardImage: idCardPath,
    };

    await Otp.deleteMany({ email: normalizedEmail });
    await Otp.create({ email: normalizedEmail, otp, expiresAt, data });

    await sendOtpEmail(normalizedEmail, otp);

    return res.status(200).json({
      message: "OTP sent to email. Verify to complete registration.",
      requiresOtp: true,
      email: normalizedEmail,
    });
  } catch (error) {
    console.error("Register Error:", error.code || error.name, error.message);
    return res.status(500).json({
      message: "Server error while creating account",
    });
  }
};

// VERIFY OTP (step 2: create account)
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body || {};
    if (typeof email !== "string" || !email.trim() || typeof otp !== "string") {
      return res.status(400).json({ message: "Email and OTP are required" });
    }
    const normalizedEmail = email.trim().toLowerCase();
    const record = await Otp.findOne({ email: normalizedEmail, otp: otp.trim() });
    if (!record || record.expiresAt < new Date()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const data = record.data || {};
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      await Otp.deleteMany({ email: normalizedEmail });
      return res.status(400).json({ message: "User already exists with this email" });
    }

    const userPayload = {
      name: data.name,
      email: normalizedEmail,
      password: data.password,
      role: data.role,
      accountStatus: data.role === "police" ? "pending_verification" : "active",
    };
    if (data.role === "police") {
      userPayload.policeRank = data.policeRank;
      userPayload.policeId = data.policeId;
      userPayload.policeUnit = data.policeUnit;
      userPayload.policeIdCardImage = data.policeIdCardImage;
    }

    const user = await User.create(userPayload);
    await Otp.deleteMany({ email: normalizedEmail });

    if (data.role === "police") {
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
    console.error("VerifyOtp Error:", error.code || error.name, error.message);
    if (error.code === 11000) {
      return res.status(400).json({ message: "User already exists with this email" });
    }
    return res.status(500).json({ message: "Server error while verifying OTP" });
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
  verifyOtp,
  login,
};

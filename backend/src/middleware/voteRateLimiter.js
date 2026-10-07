const { rateLimit } = require("express-rate-limit");

const voteRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 5, // Maximum 5 vote requests per minute per IP

  standardHeaders: "draft-8",
  legacyHeaders: false,

  message: {
    success: false,
    message: "Too many vote requests. Please try again later.",
  },
});

module.exports = voteRateLimiter;
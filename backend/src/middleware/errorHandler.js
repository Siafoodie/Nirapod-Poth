const errorHandler = (err, req, res, next) => {
  const rawStatusCode =
    err.statusCode ||
    err.status ||
    (err.name === "ValidationError" ||
    err.name === "CastError"
      ? 400
      : 500);

  const statusCode =
    Number.isInteger(rawStatusCode) &&
    rawStatusCode >= 400 &&
    rawStatusCode <= 599
      ? rawStatusCode
      : 500;

  // Log only safe diagnostic information.
  // Never log request body, tokens or full stack traces.
  console.error("API Error:", {
    type: err.name || "Error",
    statusCode,
  });

  // Do not expose internal error messages or stack traces.
  const message =
    statusCode === 400
      ? "Invalid request data"
      : statusCode === 401
      ? "Unauthorized"
      : statusCode === 403
      ? "Forbidden"
      : statusCode === 404
      ? "Resource not found"
      : statusCode === 429
      ? "Too many requests"
      : "Request could not be completed";

  return res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports = errorHandler;
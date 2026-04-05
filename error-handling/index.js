const { sendError } = require("../utils/error-response");

module.exports = (app) => {
  app.use((req, res, next) => {
    // this middleware runs whenever requested page is not available
    return sendError(res, 404, "This route does not exist", "ROUTE_NOT_FOUND");
  });

  app.use((err, req, res, next) => {
    // whenever you call next(err), this middleware will handle the error
    // always logs the error
    console.error("ERROR", req.method, req.path, err.message);

    // Handle JWT UnauthorizedError from express-jwt
    if (err.name === "UnauthorizedError") {
      return sendError(res, 401, "Invalid or missing token", "AUTH_INVALID_TOKEN");
    }

    // Mongoose validation/cast errors should be client errors, not 500.
    if (err.name === "ValidationError") {
      return sendError(
        res,
        400,
        "Validation error",
        "VALIDATION_ERROR",
        Object.values(err.errors).map((e) => e.message)
      );
    }

    if (err.name === "CastError") {
      return sendError(
        res,
        400,
        `Invalid ${err.path}: ${err.value}`,
        "INVALID_INPUT",
        [`${err.path} has an invalid value`]
      );
    }

    if (err.code === 11000) {
      const duplicateFields = Object.keys(err.keyPattern || {});
      const isGuestIdentityConflict =
        duplicateFields.includes("email") || duplicateFields.includes("document");

      return sendError(
        res,
        409,
        isGuestIdentityConflict
          ? "Guest already exists with the same email or ID/passport"
          : "Duplicate value detected",
        isGuestIdentityConflict ? "GUEST_DUPLICATE" : "DUPLICATE_RESOURCE",
        duplicateFields
      );
    }

    // only render if the error ocurred before sending the response
    if (!res.headersSent) {
      return sendError(
        res,
        500,
        "Internal server error. Check the server console",
        "INTERNAL_SERVER_ERROR"
      );
    }
  });
};

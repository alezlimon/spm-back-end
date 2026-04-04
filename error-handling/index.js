module.exports = (app) => {
  app.use((req, res, next) => {
    // this middleware runs whenever requested page is not available
    res.status(404).json({ message: "This route does not exist" });
  });

  app.use((err, req, res, next) => {
    // whenever you call next(err), this middleware will handle the error
    // always logs the error
    console.error("ERROR", req.method, req.path, err.message);

    // Handle JWT UnauthorizedError from express-jwt
    if (err.name === "UnauthorizedError") {
      return res.status(401).json({ message: "Invalid or missing token" });
    }

    // Mongoose validation/cast errors should be client errors, not 500.
    if (err.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation error",
        details: Object.values(err.errors).map((e) => e.message),
      });
    }

    if (err.name === "CastError") {
      return res.status(400).json({ message: `Invalid ${err.path}: ${err.value}` });
    }

    if (err.code === 11000) {
      const duplicateFields = Object.keys(err.keyPattern || {});
      const isGuestIdentityConflict =
        duplicateFields.includes("email") || duplicateFields.includes("document");

      return res.status(409).json({
        message: isGuestIdentityConflict
          ? "Guest already exists with the same email or ID/passport"
          : "Duplicate value detected",
        fields: duplicateFields,
      });
    }

    // only render if the error ocurred before sending the response
    if (!res.headersSent) {
      res.status(500).json({
        message: "Internal server error. Check the server console",
      });
    }
  });
};

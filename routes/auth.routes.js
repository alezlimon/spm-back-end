const express = require("express");
const router = express.Router();

// ℹ️ Handles password encryption
const bcrypt = require("bcrypt");

// ℹ️ Handles password encryption
const jwt = require("jsonwebtoken");

// Require the User model in order to interact with the database
const User = require("../models/User.model.js");
const { sendError } = require("../utils/error-response");

// Require necessary (isAuthenticated) middleware in order to control access to specific routes
const { isAuthenticated } = require("../middleware/jwt.middleware.js");

// POST /auth/signup  - Creates a new user in the database
router.post("/signup", (req, res, next) => {
  // Public signup is disabled for admin-panel-only access.
  return sendError(
    res,
    403,
    "Signup is disabled. Contact an administrator.",
    "AUTH_SIGNUP_DISABLED"
  );
});

// POST  /auth/login - Verifies email and password and returns a JWT
router.post("/login", (req, res, next) => {
  const { email, password } = req.body;

  // Check if email or password are provided as empty string
  if (email === "" || password === "") {
    return sendError(
      res,
      400,
      "Provide email and password.",
      "AUTH_LOGIN_REQUIRED_FIELDS",
      ["email is required", "password is required"]
    );
  }

  // Check the users collection if a user with the same email exists
  User.findOne({ email })
    .then(async (foundUser) => {
      if (!foundUser) {
        // If the user is not found, send an error response
        return sendError(res, 401, "User not found.", "AUTH_INVALID_CREDENTIALS");
      }

      // Soft migration path for older users created before role existed.
      if (!foundUser.role) {
        const adminEmails = ["alejandro.perez@reva.com", "luana.aguilo@reva.com"];
        foundUser.role = adminEmails.includes(foundUser.email) ? "admin" : "staff";
        await foundUser.save();
      }

      // Compare the provided password with the one saved in the database
      const passwordCorrect = bcrypt.compareSync(password, foundUser.password);

      if (passwordCorrect) {
        // Deconstruct the user object to omit the password
        const { _id, email, name, role } = foundUser;

        // Create an object that will be set as the token payload
        const payload = { _id, email, name, role };

        // Create a JSON Web Token and sign it
        const authToken = jwt.sign(payload, process.env.TOKEN_SECRET, {
          algorithm: "HS256",
          expiresIn: "6h",
        });

        // Send the token as the response
        res.status(200).json({ authToken: authToken });
      } else {
        return sendError(
          res,
          401,
          "Unable to authenticate the user",
          "AUTH_INVALID_CREDENTIALS"
        );
      }
    })
    .catch((err) => next(err)); // In this case, we send error handling to the error handling middleware.
});

// GET  /auth/verify  -  Used to verify JWT stored on the client
router.get("/verify", isAuthenticated, (req, res, next) => {
  // If JWT token is valid the payload gets decoded by the
  // isAuthenticated middleware and is made available on `req.payload`
  console.log(`req.payload`, req.payload);

  // Send back the token payload object containing the user data
  res.status(200).json(req.payload);
});

module.exports = router;

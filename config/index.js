const express = require("express");
const logger = require("morgan");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const FRONTEND_URL = process.env.ORIGIN || [
  "http://localhost:3000",
  "http://localhost:5177",
  "https://spm-front-end-git-main-alezlimons-projects.vercel.app"
];

module.exports = (app) => {
  app.set("trust proxy", 1);

  app.use(
    cors({
      origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        if (FRONTEND_URL.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error("Not allowed by CORS"));
      },
      credentials: true
    })
  );

  app.use(logger("dev"));

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());
};
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const apiRoutes = require("./routes/index");
const errorHandler = require("./middlewares/errorHandler");
const requestLogger = require("./middlewares/requestLogger");
const { UPLOADS_DIR } = require("./config/paths");

const app = express();

app.use(express.json());
app.use(cookieParser());

const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : [];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      if (process.env.NODE_ENV !== 'production' || origin.startsWith('http://localhost:')) {
          return callback(null, true);
      }
      callback(new Error('CORS policy: Access denied'));
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));

app.use("/uploads", express.static(UPLOADS_DIR));
app.use(requestLogger);

require("./cron/expireEvents");
require("./cron/deleteUser");

app.use("/", apiRoutes);
app.use(errorHandler);

module.exports = app;

const express = require("express");
const helmet = require("helmet");

const routes = require("./routes");

const rateLimitMiddleware = require("./middlewares/rateLimitMiddleware");

const errorMiddleware = require("./middlewares/errorMiddleware");

const notFoundMiddleware = require("./middlewares/notFoundMiddleware");

const app = express();

app.use(helmet());

app.use(express.json({
  limit: "10kb"
}));

app.use(rateLimitMiddleware);

app.use(routes);

app.use(notFoundMiddleware);

app.use(errorMiddleware);

module.exports = app;
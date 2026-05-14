const path = require("path");
const express = require("express");
const pinoHttp = require("pino-http");
const logger = require("./lib/logger");
const postRouter = require("./routes/quiz");
const authRouter  = require("./routes/auth");
const errorHandler = require("./middleware/errorHandler");

const app = express();
app.use(pinoHttp({logger, autoLogging:{ignore:(req)=>req.url.startsWith("/uploads")}}));

app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

app.use("/api/auth", authRouter);
app.use("/api/quiz", postRouter);

app.use((req, res) => res.status(404).json({ message: "Not found" }));


app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error"});
});

app.use(errorHandler);

module.exports = app;
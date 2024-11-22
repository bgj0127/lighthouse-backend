const express = require("express");

const app = express();
const cors = require("cors");
const bp = require("body-parser");

const swaggerFile = require("./swagger-output.json");
const swaggerUI = require("swagger-ui-express");

const signRouter = require("./routes/signRouter");
const scheduleRouter = require("./routes/scheduleRouter");
const examRouter = require("./routes/examRouter");
const pointRouter = require("./routes/pointRouter");
const challengeRouter = require("./routes/challengeRouter");
const profileRouter = require("./routes/profileRouter");

app.use(cors({ origin: "*" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use("/sign", signRouter);
app.use("/schedule", scheduleRouter);
app.use("/exam", examRouter);
app.use("/point", pointRouter);
app.use("/challenge", challengeRouter);
app.use("/profile", profileRouter);

app.use("/docs", swaggerUI.serve, swaggerUI.setup(swaggerFile, { explorer: true }));

app.get("/", (req, res) => {
  res.json({ message: "^^V" });
});

app.listen(3080);

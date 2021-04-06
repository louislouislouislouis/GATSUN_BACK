const express = require("express");
const bodyParser = require("body-parser");

const convRoutes = require("./Routes/ConvRoutes");
const userRoutes = require("./Routes/UserRoutes");
const liveRoutes = require("./Routes/LiveRoutes");

const SSEManager = require("./LiveModel/ssemanager");
const HttpError = require("./model/http-err");
const mongoose = require("mongoose");

const app = express();
app.use(bodyParser.json());
const sseManager = new SSEManager();
/* On enregistre notre instance dans notre application Express, il sera lors possible
   de récupérer celle-ci via la méthode "get"
*/
app.set("sseManager", sseManager);

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");
  next();
});

app.use("/api/conv", convRoutes);
app.use("/api/user", userRoutes);
app.use("/api/live", liveRoutes);

app.use((req, res, next) => {
  const error = new HttpError("Could note find this route", 404);
  throw error;
});
app.use((error, req, res, next) => {
  console.log(error.message);
  res.status(error.code || 500);
  res.json({ message: error.message || "An unknow error appears" });
});

mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.t8mdl.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`
  )
  .then(() => {
    console.log("connet");
    app.listen(process.env.PORT || 5000);
  })
  .catch((err) => {
    console.log(err);
  });

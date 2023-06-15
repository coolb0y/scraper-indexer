
const express = require("express");
const app = express();
const morgan = require("morgan");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();
// Used to log everything like GET, POST, etc requests
app.use(morgan("dev"));
console.log("process.env.MONGODB_URI", process.env.MONGODB_URI);
// It ensures that we prevent Cross-Origin Resource Sharing(CORS) errors
// If client made req on localhost:4000, and received res from server which
// has localhost:3000 req will fail. It is always the case with RESTful APIs
// So, we attach headers from servers to client to tell browser that it's OK
app.use(cors());

global.scandataval = {
  nofiles:0,
  nofolders:0,

};
global.indexdataval = {
  noindexed:0
};
// extended: true allows to parse extended body with rich data in it
// We will use false only allows simple bodies for urlencoded data
app.use(bodyParser.urlencoded({ extended: false }));
// Extracts json data and makes it easy readable to us
app.use(bodyParser.json());
mongoose.set("strictQuery", false);
mongoose
  .connect("mongodb://127.0.0.1:27017/chipster", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((res) => {
    console.log("connected to database");
  });

app.use("/", (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});
// To make uploads folder publically available with '/api/videos' route

app.use("/api/scanDir",require("./routes/scanLinear"));
app.use('/api/indexOpensearch',require('./indexOpencopy'));
app.use('/api/home',require('./routes/home'));
app.use('/api/scandata',require('./routes/scanningdata'));
app.use('/api/indexdata',require('./routes/indexingdata'));
//  this api was created for meilisearch indexing not required as of now
//app.use("/api/indexJson",require("./routes/indexMongo"));
// Routes

module.exports = app;


const express = require("express");
const app = express();
const morgan = require("morgan");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();
const logger = require("./loggerProject");
// Used to log everything like GET, POST, etc requests
app.use(morgan("dev"));
//console.log("process.env.MONGODB_URI", process.env.MONGODB_URI);
// It ensures that we prevent Cross-Origin Resource Sharing(CORS) errors
// If client made req on localhost:4000, and received res from server which
// has localhost:3000 req will fail. It is always the case with RESTful APIs
// So, we attach headers from servers to client to tell browser that it's OK
app.use(cors());

const path = require('path');
path.join(__dirname, `./node_modules/pdf-parse/lib/pdf.js/v1.10.100/build/pdf.js`);
path.join(__dirname, `./node_modules/pdf-parse/lib/pdf.js/v1.10.100/build/pdf.worker.js`);
path.join(__dirname, `./node_modules/pdf-parse/lib/pdf.js/v1.10.100/build/pdf.worker.js.map`);
path.join(__dirname, `./node_modules/pdf-parse/lib/pdf.js/v1.10.100/build/pdf.js.map`);

const argument = process.argv[2]; // The first element is the Node.js executable, and the second is the script file
global.rootProjectName =  argument || "chipsterProject";


global.scandataval = {
  nofiles:0,
  nofolders:0,

};
global.indexdataval = {
  noindexed:0
};

const apilogging = (req, res, next) => {
  const apiRoute = req.originalUrl; // Get the full URL
  logger.info(`Request received for ${apiRoute}`);
  next();
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
    logger.info("Connected to Database")
    
  }).catch((err) => {
    logger.error("Error connecting to Database, Please check if mongodb is running and reachable at port 27017")
    throw json.stringify(err);
  })
  



app.use("/", (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});


app.use("/api/scanDir",apilogging,require("./scanLinear"));
app.use('/api/home',apilogging,require('./routes/home'));
app.use('/api/scandata',apilogging,require('./routes/scanningdata'));
app.use('/api/indexdata',apilogging,require('./routes/indexingdata'));
app.use('/api/pathexists',apilogging,require('./routes/checkpath'));
app.use('/api/projectexists',apilogging,require('./projectnamecheck'));


module.exports = app;

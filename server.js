var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");
var hdbrs = require("express-handlebars");



//Scraping tools
var axios = require("axios");
var cheerio = require("cheerio");

//Require all models
 var db = require("./model");

var port =3000;

//Initialize express
var app =express();
// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

// Connect to the Mongo DB
mongoose.connect("mongodb://localhost/unit18Populater", { useNewUrlParser: true });

// Routes

// A GET route for scraping the echoJS website
app.get("/scrape", function(req, res) {
  // First, we grab the body of the html with axios
  axios.get("http://www.florida.adl.org/").then(function(response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);

    // Now, we grab every h2 within an article tag, and do the following:
    $("article h2").each(function(i, element) {
      // Save an empty result object
      var result = {};
    });





});

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "3000");
});







});
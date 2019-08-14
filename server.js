var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");
var hdbrs = require("express-handlebars");
var bodyParser = require("body-parser");
var axios = require("axios");
var cheerio = require("cheerio");

//Require all models
 var db = require("./models");

var PORT = process.env.PORT || 3000;

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

 var mongoDB = "mongodb://orlando:darryl621@ds253537.mlab.com:53537/heroku_0c7dwjlr";

 mongoose.connect(mongoDB,{ useNewUrlParser: true } );



// Routes

// A GET route for scraping the npr websites
app.get("/scrape", function(req, res) {
  // First, we grab the body of the html with axios
  axios.get("https://www.npr.org/sections/technology/").then(function(response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);

    // Now, we grab every title within an article tag, and do the following:
    $("article .title").each(function(i, element) {
      // Save an empty result object
      var result = {};
      //Add the text and href of every link, save them ss properties of the result
      result.title = $(this).children("a").text();

      result.link = $(this)
      .children("a")
      .attr("href");

      console.log(result);
      //Create a new Article using the result object built from scraping
      db.Article.create(result)
      .then(function(dbArticle){
        console.log(dbArticle);
      })
      .catch(function(err){
        // if error occured, log it
       console.log(err);
      });
    });
    //send message to the client
    res.send("Scrape Complete");
  });
});
// Route for getting all Articles from the db
app.get("/articles", function(req, res) {
  // Grab every document in the Articles collection
  db.Article.find({})
    .then(function(dbArticle) {
      // If we were able to successfully find Articles, send them back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});
// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  db.Article.findOne({ _id: req.params.id })
    // ..and populate all of the notes associated with it
    .populate("note")
    .then(function(dbArticle) {
      // If we were able to successfully find an Article with the given id, send it back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});
// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(req, res) {
  // Create a new note and pass the req.body to the entry
  db.Note.create(req.body)
    .then(function(dbNote) {
      // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
      // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
      // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function(dbArticle) {
      // If we were able to successfully update an Article, send it back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});

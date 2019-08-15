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
//use body-parser for handling submissions
app.use(bodyParser.json({
  type: "application/json"
}));
// Parse request body as JSON
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

// Connect to the Mongo DB

 var mongoDB = "mongodb://orlando:darryl621@ds253537.mlab.com:53537/heroku_0c7dwjlr";

 mongoose.connect(mongoDB,{ useNewUrlParser: true } );

// use handlebars
// app.engine("handlebars", exphbs({
//   defaultLayout: "main"
// }));
app.engine("handlebars", hdbrs({
  defaultlayout: "main"
}));
app.set("view engine", "handlebars");

// Hook mongojs configuration to the db variable
var db = require("./models");

// get all articles from the database that are not saved
app.get("/", function(req, res) {

  db.Article.find({
      saved: false
    },

    function(error, dbArticle) {
      if (error) {
        console.log(error);
      } else {
        res.render("index", {
          articles: dbArticle
        });
      }
    });
});
// use cheerio to scrape stories from TechCrunch and store them
app.get("/scrape", function(req, res) {
  request("https://www.npr.org/sections/technology/", function(error, response, html) {
    // Load the html body from request into cheerio
    var $ = cheerio.load(html);
    $("div.post-block").each(function(i, element) {

      // trim() removes whitespace because the items return \n and \t before and after the text
      var title = $(element).find("a.post-block__title__link").text().trim();
      var link = $(element).find("a.post-block__title__link").attr("href");
      var intro = $(element).children(".post-block__content").text().trim();

      // if these are present in the scraped data, create an article in the database collection
      if (title && link && intro) {
        db.Article.create({
            title: title,
            link: link,
            intro: intro
          },
          function(err, inserted) {
            if (err) {
              // log the error if one is encountered during the query
              console.log(err);
            } else {
              // otherwise, log the inserted data
              console.log(inserted);
            }
          });
        // if there are 10 articles, then return the callback to the frontend
        console.log(i);
        if (i === 10) {
          return res.sendStatus(200);
        }
      }
    });
  });
});

// route for retrieving all the saved articles
app.get("/saved", function(req, res) {
  db.Article.find({
      saved: true
    })
    .then(function(dbArticle) {
      // if successful, then render with the handlebars saved page
      res.render("saved", {
        articles: dbArticle
      });
    })
    .catch(function(err) {
      // If an error occurs, send the error back to the client
      res.json(err);
    });

});

// route for setting an article to saved
app.put("/saved/:id", function(req, res) {
  db.Article.findByIdAndUpdate(
      req.params.id, {
        $set: req.body
      }, {
        new: true
      })
    .then(function(dbArticle) {
      res.render("saved", {
        articles: dbArticle
      });
    })
    .catch(function(err) {
      res.json(err);
    });
});

// route for saving a new note to the db and associating it with an article
app.post("/submit/:id", function(req, res) {
  db.Note.create(req.body)
    .then(function(dbNote) {
      var articleIdFromString = mongoose.Types.ObjectId(req.params.id);
      return db.Article.findByIdAndUpdate(articleIdFromString, {
        $push: {
          notes: dbNote._id
        }
      });
    })
    .then(function(dbArticle) {
      res.json(dbNote);
    })
    .catch(function(err) {
      // If an error occurs, send it back to the client
      res.json(err);
    });
});

// route to find a note by ID
app.get("/notes/article/:id", function(req, res) {
  db.Article.findOne({"_id":req.params.id})
    .populate("notes")
    .exec (function (error, data) {
        if (error) {
            console.log(error);
        } else {
          res.json(data);
        }
    });        
});


app.get("/notes/:id", function(req, res) {

  db.Note.findOneAndRemove({_id:req.params.id}, function (error, data) {
      if (error) {
          console.log(error);
      } else {
      }
      res.json(data);
  });
});

// Routes

// A GET route for scraping the npr websites
// app.get("/scrape", function(req, res) {
//   // First, we grab the body of the html with axios
//   axios.get("https://www.npr.org/sections/technology/").then(function(response) {
//     // Then, we load that into cheerio and save it to $ for a shorthand selector
//     var $ = cheerio.load(response.data);

//     // Now, we grab every title within an article tag, and do the following:
//     $("article .title").each(function(i, element) {
//       // Save an empty result object
//       var result = {};
//       //Add the text and href of every link, save them ss properties of the result
//       result.title = $(this).children("a").text();

//       result.link = $(this)
//       .children("a")
//       .attr("href");

//       console.log(result);
//       //Create a new Article using the result object built from scraping
//       db.Article.create(result)
//       .then(function(dbArticle){
//         console.log(dbArticle);
//       })
//       .catch(function(err){
//         // if error occured, log it
//        console.log(err);
//       });
//     });
//     //send message to the client
//     res.send("Scrape Complete");
//   });
// });
// // Route for getting all Articles from the db
// app.get("/articles", function(req, res) {
//   // Grab every document in the Articles collection
//   db.Article.find({})
//     .then(function(dbArticle) {
//       // If we were able to successfully find Articles, send them back to the client
//       res.json(dbArticle);
//     })
//     .catch(function(err) {
//       // If an error occurred, send it to the client
//       res.json(err);
//     });
// });
// // Route for grabbing a specific Article by id, populate it with it's note
// app.get("/articles/:id", function(req, res) {
//   // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
//   db.Article.findOne({ _id: req.params.id })
//     // ..and populate all of the notes associated with it
//     .populate("note")
//     .then(function(dbArticle) {
//       // If we were able to successfully find an Article with the given id, send it back to the client
//       res.json(dbArticle);
//     })
//     .catch(function(err) {
//       // If an error occurred, send it to the client
//       res.json(err);
//     });
// });
// app.put("/saved/:id", function(req, res) {
//   db.Article.findByIdAndUpdate(
//       req.params.id, {
//         $set: req.body
//       }, {
//         new: true
//       })
//     .then(function(dbArticle) {
//       res.render("saved", {
//         articles: dbArticle
//       });
//     })
//     .catch(function(err) {
//       res.json(err);
//     });
// });

// // Route for saving/updating an Article's associated Note
// app.post("/articles/:id", function(req, res) {
//   // Create a new note and pass the req.body to the entry
//   db.Note.create(req.body)
//     .then(function(dbNote) {
//       // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
//       // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
//       // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
//       return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
//     })
//     .then(function(dbArticle) {
//       // If we were able to successfully update an Article, send it back to the client
//       res.json(dbArticle);
//     })
//     .catch(function(err) {
//       // If an error occurred, send it to the client
//       res.json(err);
//     });
// });
// app.get("/comments/article/:id", function(req, res) {
//   db.Article.findOne({"_id":req.params.id})
//     .populate("comments")
//     .exec (function (error, data) {
//         if (error) {
//             console.log(error);
//         } else {
//           res.json(data);
//         }
//     });        
// });

// app.get("/comments/:id", function(req, res) {

//   db.Comment.findOneAndRemove({_id:req.params.id}, function (error, data) {
//       if (error) {
//           console.log(error);
//       } else {
//       }
//       res.json(data);
//   });
// });
// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});

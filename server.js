var express = require("express");
var mongoose = require("mongoose");
var axios = require("axios");
var cheerio = require("cheerio");
var mongojs = require("mongojs");
var PORT = 3000;
var db = require("./models");
// var Article = require("./article.js")
var app = express();

// ===============================
// MONGO CONNECTION STUFF
//lets require/import the mongodb native drivers.
var mongodb = require('mongodb');

//We need to work with "MongoClient" interface in order to connect to a mongodb server.
var MongoClient = mongodb.MongoClient;

// Connection URL. This is where your mongodb server is running.

//(Focus on This Variable)
var url = 'mongodb://localhost:27017/my_database_name';      
//(Focus on This Variable)

// Use connect method to connect to the Server
  MongoClient.connect(url, function (err, db) {
  if (err) {
    console.log('Unable to connect to the mongoDB server. Error:', err);
  } else {
    console.log('Connection established to', url);

    // do some work here with the database.

    //Close connection
    db.close();
  }
});
//====================================

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/nytscraper";
mongoose.connect(MONGODB_URI);

// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));


// Database configuration
var databaseUrl = "nytscraper";
var collections = ["scrapedData"]
var db = mongojs(databaseUrl, collections)
db.on("error", function (error) {
    console.log("Database Error:", error);
})

mongoose.connect("mongodb://localhost/nytscraper", { useNewUrlParser: true });

app.get("/", function () {
    db.scrapedData.find({}).then(function (err, result) {
        res.render("index.html")
    })
})

app.get("/scrape", function (req, res) {
    axios.get("https://www.nytimes.com/section/world/").then(function (response) {

        var $ = cheerio.load(response.data)

        $("ol.story-menu").each(function (i, element) {
            var result = {};

            result.link = $(element).children("li").children("article.story")
                .children("div.story-body").children("h2.headline").children("a").attr("href");
            result.title = $(element).children("li").children("article.story")
                .children("div.story-body").children("h2.headline").children("a").text()
            result.summary = $(element).children("li").children("article.story")
                .children("div.story-body").children("p.summary").text();

            // var link = $(element).children("li"). children("article.story")
            //     .children("div.story-body").children("h2.headline").children("a").attr("href");
            // var title = $(element).children("li").children("article.story")
            //     .children("div.story-body").children("h2.headline").children("a").text()
            // var summary = $(element).children("li").children("article.story")
            //     .children("div.story-body").children("p.summary").text();

            db.scrapedData.insert({
                link: result.link,
                title: result.title,
                summary: result.summary
            }, function (err, inserted) {
                if (err) {
                    console.log(err)
                } else {
                    console.log(inserted)
                }
            })
        })
        res.send("Scrape Complete!")
    })
})


// API Routes
// All scraped articles
app.get("/articles", function (req, res) {
    db.scrapedData.find({}, function (err, data) {
        if (err) {
            throw err
        } else {
            res.json(data)
        }
    })
})

// All saved articles
app.get("api/saved", function (req, res) {
    db.scrapedData.find({}, function (err, data) {
        if (err) {
            throw err
        } else {
            res.json(data)
        }
    })
})


app.listen(3000, function () {
    console.log("App running on port 3000!");
})

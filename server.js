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


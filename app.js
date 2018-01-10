//init express               /*require like include in java*/
var express = require("express"),  //init express
	bodyParser = require("body-parser"),  //init bodyParser
	mongoose = require("mongoose"), 	//init mongoose
	flash = require("connect-flash"),
	passport = require("passport"),
	LocalStrategy = require("passport-local"),
	methodOverride = require("method-override"),
	Campground = require("./models/campground"),//campground data models
	Comment = require("./models/comment"),
	User = require("./models/user"),
	seedDB = require("./seeds");


//Require routes
var commentRoutes = require("./routes/comments"),
	campgroundRoutes = require("./routes/campgrounds"),
	indexRoutes = require("./routes/index");


//get rid of warnings
mongoose.Promise = global.Promise;
var app = express();
//connect database Yelp_camp
var url = process.env.DATABASEURL || "mongodb://localhost/yelp_camp";
//mongoose.connect("mongodb://localhost/yelp_camp", {useMongoClient: true}); //for local use
mongoose.connect(url, {useMongoClient: true});
//mongodb://<dbuser>:<dbpassword>@ds163294.mlab.com:63294/db_yelpcamp

//use bodyparser
app.use(bodyParser.urlencoded({extended: true}));
//set view engine, make .ejs file as default
app.set("view engine", "ejs");
//use style file
app.use(express.static(__dirname + "/public"));
//use method override
app.use(methodOverride("_method"));
//use connect flash
app.use(flash());
//moment js ---record time after post
app.locals.moment = require("moment");



//Seed the database
//seedDB();

//PASSPORT CONFIGURATION
app.use(require("express-session")({
	secret: "Random sentence for generate ciphertext",
	resave: false,
	saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//use this function in every single route, and combine user information with every req
app.use(function(req, res, next){
	res.locals.currentUser = req.user;
	res.locals.error = req.flash("error"); //error flash message
	res.locals.success = req.flash("success"); //success flash message
	next();
});


//use routes
app.use(indexRoutes);
app.use("/campgrounds/:id/comments", commentRoutes);
app.use("/campgrounds",campgroundRoutes);


//listen to port, start server
app.listen(process.env.PORT || 3000, process.env.IP, function(){
	console.log("The YelpCamp Server Has Started!");
})
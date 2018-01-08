var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user");
var Campground = require("../models/campground");
var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");

//root page
router.get("/", function(req, res){
	res.render("landing");
});

//======================
//    AUTH ROUTES
//======================

//show register form
router.get("/register", function(req, res){
	res.render("register", {page: "register"});
});
//handle sign up logic
router.post("/register", function(req, res){
	var newUser = new User({
		username: req.body.username, 
		firstName: req.body.firstName,
		lastName: req.body.lastName,
		email: req.body.email,
		avatar: req.body.avatar
		});
	if(req.body.adminCode === "secretcode123"){ // Admin code here, use env to hide in future
		newUser.isAdmin = true;
	}
	User.register(newUser, req.body.password, function(err, user){
		if(err){
			console.log(err);
			return res.render("register", {error: err.message});
		}
		passport.authenticate("local")(req, res, function(){
			req.flash("success", "Welcome to YelpCamp " + user.username);
			res.redirect("/campgrounds");
		});
	});
});

//show login form
router.get("/login", function(req, res){
	res.render("login", {page: "login"});
});

//handle login logic ## app.post(targetURL, middleware, callback)
router.post("/login", passport.authenticate("local",
	{
		successRedirect: "/campgrounds",
		failureRedirect: "/login"
	}), function(req, res){
	//nothing need to do
});

//logout route
router.get("/logout", function(req, res){
	req.logout();
	req.flash("success", "Logged you out!");
	res.redirect("/campgrounds");
});

//forgot password
router.get("/forgot", function(req, res){
	res.render("forgot");
});

router.post("/forgot", function(req, res, next){
	async.waterfall([
		function(done){
			crypto.randomBytes(20, function(err, buf){
				var token = buf.toString("hex");
				done(err, token);
			});
		},
		function(token, done){
			User.findOne({email: req.body.email}, function(err, user){
				if(!user){
					req.flash("error", "No account with that email address exists");
					return res.redirect("/forgot");
				}

				user.resetPasswordToken = token;
				user.resetPasswordExpires = Date.now() + 600000; //10min expires

				user.save(function(err){
					done(err, token, user);
				});
			});
		},
		function(token, user, done){
			var smtpTransport = nodemailer.createTransport({
				service: "Gmail",
				auth: {
					user: "magicservicefromxl@gmail.com",
					pass: process.env.GMAILPW
				}
			});
			var mailOptions = {
				to: user.email,
				from: "magicservicefromxl@gmail.com",
				subject: "YelpCamp Password Reset Service",
				text: "You are receiving this email because you (or someone else) have requested the reset password service for your YelpCamp account \n\n" + 
					  "Please click on the following link, or paste this into your borwser to complete the process \n" +
					  "http://" + req.headers.host + "/reset/" + token + "\n" +
					  "This URL will expires after 10 minutes \n\n" +
					  "If you did not request this, please ignore this email and your password will remain unchange"
			};
			smtpTransport.sendMail(mailOptions, function(err){
				console.log("mail sent");
				req.flash("success", "An email has been sent to " + user.email + "with futher instructions.");
				done(err, "done");
			});
		}
	], function(err){
		if(err){
			return next(err);
		}
		res.redirect("/forgot");
	});
});

//handle reset request
router.get("/reset/:token", function(req, res){
	User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: {$gt: Date.now()}}, function(err, user){
		if(!user){
			req.flash("error", "Password reset token is invalid or has expired");
			return res.redirect("/forgot");
		}
		res.render("reset", {token: req.params.token});
	});
});

router.post("/reset/:token", function(req, res){
	var useremail = "";
	async.waterfall([
			function(done){
				User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: {$gt: Date.now()}}, function(err, user){
					if(!user){
						req.flash("error", "Password reset toekn is invalid or has expired");
						return res.redirect("back");
					}
					if(req.body.password === req.body.confirm){
						user.setPassword(req.body.password, function(err){
							user.resetPasswordToken = undefined;
							user.resetPasswordExpires = undefined;

							user.save();
							useremail = user.email;
							done(err, "done");
						})
					}else{
						req.flash("error", "Password do not match");
						return res.redirect("back");
					}
				});
			},
			function(user, done){
				var smtpTransport = nodemailer.createTransport({
					service: "Gmail",
					auth: {
						user: "magicservicefromxl@gmail.com",
						pass: process.env.GMAILPW
					}
				});
				var mailOptions = {
					to: useremail,
					from: "magicservicefromxl@gmail.com",
					subject: "Your password has been changed",
					text: "Hello, \n\n" + 
						  "This is a confirmation that the password for your account " + user.email + " has just been changed"
				};
				smtpTransport.sendMail(mailOptions, function(err){
					console.log("Confirm mail sent " + user.email);
					req.flash("success", "Success! Your password has been changed");
					done(err);
				});
			}
		], function(err){
			res.redirect("/campgrounds");
		});
});

// user profiles
router.get("/users/:id", function(req, res){
	User.findById(req.params.id, function(err, foundUser){
		if(err){
			req.flash("error", "Sorry, target user doesn't exist anymore");
			res.redirect("/campgrounds");
		}
		Campground.find().where("author.id").equals(foundUser._id).exec(function(err, campgrounds){
			if(err){
				req.flash("error", "Something went wrong");
				res.redirect("/campgrounds");
			}
			res.render("users/show", {user: foundUser, campgrounds: campgrounds});
		});
	});
});

// user profile edit
// TODO

module.exports = router;
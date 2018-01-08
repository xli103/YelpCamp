var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
var middleware = require("../middleware");
var geocoder = require("geocoder");
var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'dzi9oazgw', 
  api_key: 927883369424729, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

//campground page
// INDEX - show all campgrounds
// router.get("/", function(req, res){
// 	//Get all campgrounds from DB
// 	var perPage = 8;
// 	var pageQuery = parseInt(req.query.page);
// 	var pageNumber = pageQuery ? pageQuery : 1;
// 	var noMatch = null;
// 	if(req.query.search){
// 		const regex = new RegExp(escapeRegex(req.query.search), 'gi');
// 		Campground.find({name: regex}, function(err, allCampgrounds){
// 			if(err){
// 				console.log(err);
// 				res.redirect("back");
// 			}else{
// 				if(allCampgrounds.length < 1){
// 					noMatch = "No campgrounds found, please try again!";
// 				}
// 				res.render("campgrounds/index", {
// 					campgrounds: allCampgrounds, 
// 					page: "campgrounds", 
// 					noMatch: noMatch,
// 					search: req.query.search
// 				});
// 			}
// 		});
// 	}else{
// 		Campground.find({}, function(err, allCampgrounds){
// 			if(err){
// 				console.log(err);
// 			}else{
// 				res.render("campgrounds/index", {campgrounds: allCampgrounds, page: "campgrounds", noMatch: noMatch});
// 			}
// 		});
//	}
//});

router.get("/", function(req, res){
    var perPage = 8;
    var pageQuery = parseInt(req.query.page);
    var pageNumber = pageQuery ? pageQuery : 1;
    var noMatch = null;
    if(req.query.search) {
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        Campground.find({name: regex}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function (err, allCampgrounds) {
            Campground.count({name: regex}).exec(function (err, count) {
                if (err) {
                    console.log(err);
                    res.redirect("back");
                } else {
                    if(allCampgrounds.length < 1) {
                        noMatch = "No campgrounds match that query, please try again.";
                    }
                    res.render("campgrounds/index", {
                        campgrounds: allCampgrounds,
                        current: pageNumber,
                        pages: Math.ceil(count / perPage),
                        noMatch: noMatch,
                        search: req.query.search
                    });
                }
            });
        });
    } else {
        // get all campgrounds from DB
        Campground.find({}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function (err, allCampgrounds) {
            Campground.count().exec(function (err, count) {
                if (err) {
                    console.log(err);
                } else {
                    res.render("campgrounds/index", {
                        campgrounds: allCampgrounds,
                        current: pageNumber,
                        pages: Math.ceil(count / perPage),
                        noMatch: noMatch,
                        search: false
                    });
                }
            });
        });
    }
});

	


//CREATE - Add new Campgrounds
router.post("/", middleware.isLoggedIn, upload.single("image"), function(req, res) {
	//get data from form and add to campground array
	geocoder.geocode(req.body.location, function(err, data){
		req.body.campground.lat = data.results[0].geometry.location.lat;
		req.body.campground.lng = data.results[0].geometry.location.lng;
		req.body.campground.location = data.results[0].formatted_address;
		req.body.campground.author = {
		id: req.user._id,
		username: req.user.username
		};
		cloudinary.uploader.upload(req.file.path, function(result) {
			// add cloudinary url for the image to the campground object under image property
  			req.body.campground.image = result.secure_url;
			//Create a new campground and save to DB
			Campground.create(req.body.campground, function(err, newlyCreated){
				if(err){
					req.flash("error", err.message);
					res.redirct("back");
				}else{
					//redirct to campgrounds page
					res.redirect("/campgrounds");
				}
			});
		});
	});
});

//NEW - show form to create new campground
router.get("/new", middleware.isLoggedIn, function(req, res){
	res.render("campgrounds/new");
});

//use :id order matters!!!
//SHOW - shows more info about one campground
router.get("/:id", function(req, res){
	//find the campground with provided ID
	Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
		if(err || !foundCampground){
			req.flash("error", "Campground not found");
			res.redirect("back");
		}else{
			//console.log(foundCampground);
			//render show template with that campground 
			res.render("campgrounds/show", {campground: foundCampground});
		}
	});
});

//EDIT CAMPGROUND ROUTE
router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req, res){
		Campground.findById(req.params.id, function(err, foundCampground){
			res.render("campgrounds/edit", {campground: foundCampground});
		});
		
});

//UPDATE CAMPGROUND ROUTE
router.put("/:id", middleware.checkCampgroundOwnership, upload.single("image"), function(req, res){
	//find and update the correct campground
	geocoder.geocode(req.body.location, function(err, data){
		req.body.campground.lat = data.results[0].geometry.location.lat;
		req.body.campground.lng = data.results[0].geometry.location.lng;
		req.body.campground.location = data.results[0].formatted_address;
		cloudinary.uploader.upload(req.file.path, function(result) {
			// add cloudinary url for the image to the campground object under image property
  			req.body.campground.image = result.secure_url;
  			//update
  			Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, updatedCampground){
				if(err){
					req.flash("error", err.message);
					res.redirect("back");
				}else{
					req.flash("success", "Successfully Updated!");
					res.redirect("/campgrounds/" + req.params.id);
				}
			});
  		});
	});
});

// DESTORY CAMPGROUND ROUTE
router.delete("/:id", middleware.checkCampgroundOwnership, function(req,res){
	Campground.findByIdAndRemove(req.params.id, function(err){
		if(err){
			res.redirect("/campgrounds");
		}else{
			res.redirect("/campgrounds");
		}
	});
});

function escapeRegex(text){
	return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

module.exports = router;
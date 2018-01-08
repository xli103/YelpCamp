var mongoose = require("mongoose");
var Campground = require("./models/campground");
var Comment = require("./models/comment");

var data=[
	{
		name: "Cloud's Rest",
		image: "https://images.unsplash.com/photo-1476610182048-b716b8518aae?auto=format&fit=crop&w=2027&q=80",
		description: "The traditional view of a summer camp as a woody place with hiking, canoeing, and campfires is changing, with greater acceptance of newer types summer camps that offer a wide variety of specialized activities. For example, there are camps for the performing arts, music, magic, computer programming, language learning, mathematics, children with special needs, and weight loss. In 2006, the American Camp Association reported that 75 percent of camps added new programs. This is largely to counter a trend in decreasing enrollment in summer camps, which some argue to have been brought about by smaller family sizes and the growth in supplemental educational programs. There are also religiously affiliated summer camps, such as those run by Christian groups and various denominations of Judaism."
	},
	{
		name: "Great Lake",
		image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1650&q=80",
		description: "The traditional view of a summer camp as a woody place with hiking, canoeing, and campfires is changing, with greater acceptance of newer types summer camps that offer a wide variety of specialized activities. For example, there are camps for the performing arts, music, magic, computer programming, language learning, mathematics, children with special needs, and weight loss. In 2006, the American Camp Association reported that 75 percent of camps added new programs. This is largely to counter a trend in decreasing enrollment in summer camps, which some argue to have been brought about by smaller family sizes and the growth in supplemental educational programs. There are also religiously affiliated summer camps, such as those run by Christian groups and various denominations of Judaism."
	},
	{
		name: "Only mountains",
		image: "https://images.unsplash.com/photo-1495312040802-a929cd14a6ab?auto=format&fit=crop&w=1789&q=80",
		description: "The traditional view of a summer camp as a woody place with hiking, canoeing, and campfires is changing, with greater acceptance of newer types summer camps that offer a wide variety of specialized activities. For example, there are camps for the performing arts, music, magic, computer programming, language learning, mathematics, children with special needs, and weight loss. In 2006, the American Camp Association reported that 75 percent of camps added new programs. This is largely to counter a trend in decreasing enrollment in summer camps, which some argue to have been brought about by smaller family sizes and the growth in supplemental educational programs. There are also religiously affiliated summer camps, such as those run by Christian groups and various denominations of Judaism."
	}
]

function seedDB(){
	//Remove all campgrounds
	Campground.remove({}, function(err){
		if(err){
			console.log(err);
		}else{
			//add a few campgrounds
			data.forEach(function(seed){
				Campground.create(seed, function(err, campground){
					if(err){
						console.log(err);
					}else{
						console.log("added a campground");
						//create a comment
						Comment.create({
							text: "This place is great, but i wish there was internet",
							author: "Homer"
						}, function(err, comment){
							if(err){
								console.log(err);
							}else{
								campground.comments.push(comment);
								campground.save();
								console.log("Created new comment");
							}
						});
					}
				});
			});
		}
	});


}

module.exports = seedDB;
var mongoose = require("mongoose");

var commentSchema = mongoose.Schema({
	text: String,
	createdAt:{ type: Date, default: Date.now},
	//we don't need all uesr information here, just store what we need
	author: {
		id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User"
		},
		username: String
	}
});

module.exports = mongoose.model("Comment", commentSchema);
/** @format */

require("dotenv").config();
const dns = require("node:dns");
const bodyParser = require("body-parser");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));

mongoose.connect(process.env.MONGO_URI, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
});

const counterSchema = new mongoose.Schema({
	_id: {
		type: String,
		required: true,
	},
	seq: {
		type: Number,
		default: 0,
	},
});

const counterModel = mongoose.model("counter", counterSchema);

const urlSchema = new mongoose.Schema({
	url: {
		type: String,
		required: true,
		unique: true,
	},
	seqId: {
		type: String,
		unique: true,
	},
});

const urlModel = mongoose.model("urlModel", urlSchema);

urlSchema.pre("save", function (next) {
	counterModel.findByIdAndUpdate(
		{ _id: "entityId" },
		{ $inc: { seq: 1 } },
		function (err, counterModel) {
			if (err) return next(err);
			this.seqId = counterModel.seq;
			next();
		}
	);
});

const checkUrl = (req, res, next) => {
	let theAddress = req.body.url;
	urlModel.findOne({ url: theAddress }, function (err, obj) {
		if (err) return console.error(err);
		if (obj === {}) {
			addUrl(theUrl);
		}
	});
	urlModel.findOne({ url: theUrl }, function (err, obj) {
		if (err) {
			return console.error(err);
		} else {
			console.log(obj);
			return { original_url: obj.url, short_url: obj.seqId };
		}
	});
};

const addUrl = (req, res, next) => {
	let newUrl = new urlModel({ url: theUrl });
	newUrl.save(function (err, data) {
		if (err) return console.error(err);
		console.log("url added");
		done(null, data);
	});
};

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
	res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
	res.json({ greeting: "hello API" });
});

app.post("/api/shorturl", function (req, res, next) {
	let theAddress = req.body.url;
	if (!theAddress.match(/^https:\/\/www.+/)) {
		res.json({ error: "Invalid URL" });
	} else {
		dns.lookup(theAddress.slice(8), function (err, address) {
			if (err) {
				res.json({ error: "Invalid URL" });
			} else {
				next();
			}
		});
	}
});

app.post("/api/shorturl", checkUrl());

app.listen(port, function () {
	console.log(`Listening on port ${port}`);
});

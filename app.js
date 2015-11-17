var express = require('express');
var fs = require('fs');
var bodyParser = require('body-parser');
var multipart = require('connect-multiparty');
var mongoose = require('mongoose');
var os = require('os');
var sizeOf = require('image-size');

var networkInterfaces = os.networkInterfaces();

var app = express();

app.use(bodyParser.urlencoded({ 
	extended: true }));
app.use(bodyParser.json());
app.use(multipart());

app.listen(3000, function () {
	console.log("Server started at port 3000");
});

var getIpAddress = function(networkInterfaces) {
	var en1 = networkInterfaces.en1;
	for(var i = 0; i < en1.length; i++) {
		if (en1[i].family == 'IPv4') {
			return en1[i].address;
		}
	}
}

var SERVER_IP = getIpAddress(networkInterfaces);
console.log(SERVER_IP);
console.log(__dirname);
console.log(process.cwd());

/*
 * set mongodb
 */
mongoose.connect('mongodb://localhost/kumdo');

var writingsSchema = mongoose.Schema({
	name: String,
	email: String,
	sentence: String,
	words: String,
	imageUrl: String,
	imageSize: Array,
	category: { type: Number, min: 0, max: 10 },
	date: String
}, { collection: 'writings' });

var writings = mongoose.model('writings', writingsSchema);


// respond with "hello world" when a GET request is made to the homepage
app.get('/', function(req, res) {
  res.send('hello world');
});

app.get('/best', function(req, res) {
	console.log("I received from GET /best a request ");
	console.log("category : ", req.query.category);

	if(req.query.category == -1) {
		writings.find().sort({date : -1}).exec(function (err, docs) {
			console.log(docs);
			res.json(docs);
		});
	} else {
		writings.find({category : req.query.category}).sort({date : -1}).exec(function (err, docs) {
			console.log(docs);
			res.json(docs);
		});
	}
	
});

app.get('/mylist/:email', function(req, res) {
	console.log("I received from GET /mylist a request : ", req.params.email);
	writings.find({ email : req.params.email }).sort({date : -1 }).exec(function (err, docs) {
		console.log(docs);
		res.json(docs);
	});
});

app.get('/image/:file', function (req, res){
	console.log("I received from GET /image/ ", req.params.file);
    file = req.params.file;
    var img = fs.readFileSync(__dirname + "/uploads/" + file);
    res.writeHead(200, {'Content-Type': 'image/jpg' });
    res.end(img, 'binary');
});

app.post('/upload', function (req, res) {
	console.log('this : ', req.files);
	console.log(req.body, req.files.image);

	var imageName = req.body.date + "_" + req.files.image.name;
	var imageUrl = "http://" + SERVER_IP + ":3000/image/" + imageName 
	var imagePath = __dirname + "/uploads/" + imageName
	fs.readFile(req.files.image.path, function (err, data) {
		/// If there's an error
		if(!imageName){
			console.log("There was an error");
			res.status(500);
			res.send(fail);
		} else {

		  /// write file to uploads/fullsize folder
		  fs.writeFile(imagePath, data, function (err, written, string) {
		  	var dimensions = sizeOf(imagePath);
		  	console.log(dimensions.width, dimensions.height);
		  	var imageWidth = dimensions.width;
		  	var imageHeight = dimensions.height;

		  	console.log(err);
		  	if (err == null) {
		  		var writing = {
					name : req.body.name,
					email : req.body.email,					
					sentence : req.body.sentence,
					words : req.body.words,
					category : req.body.category,
					imageUrl : imageUrl,
					imageSize : [imageWidth, imageHeight],
					date : req.body.date
				}

				writings.create(writing, function(err, doc) {
					console.log(doc);
				});
			}
		  });
		}
	});	

	res.send(imageUrl);
});
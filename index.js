const express = require("express");
const app = express();
const mongoose = require("mongoose");
const multer = require("multer");
const { GridFsStorage } = require("multer-gridfs-storage");
const methodOverride = require("method-override");
const Grid = require("gridfs-stream");
const port = process.env.PORT || 5000;
const path = require("path");
require("dotenv").config();

// middleware
// to parse json content
app.use(express.json());
app.use(methodOverride("_method"));
app.set("view engine", "ejs");
// parse body from URL
app.use(
  express.urlencoded({
    extended: false,
  })
);

// config files for multer file upload
// const multerConfig = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "File_U");
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split("/")[1];
//     cb(null, `video-${Date.now()}.${ext}`);
//   },
// });

// checking the file type

const isVideo = (req, file, cb) => {
  if (file.mimetype === "video/mp4" || file.mimetype === "video/webm") {
    cb(null, true);
  } else {
    cb(new Error("Only mp4/webm Video format is Allowed"));
  }
};

// const upload = multer({
//   // dest: "File_U",
//   storage: multerConfig,
//   fileFilter: isVideo,
// });
// connect the database

const mongouri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tzgvu.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

try {
  mongoose.connect(
    mongouri,
    {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    },
    console.log("connected to database")
  );
} catch (err) {
  handleError(err);
}
process.on("unhandledRejection", (err) => {
  console.log("unhandledRejection", err.message);
});

// init gfs
let gfs;

// creating bucket

let bucket;

mongoose.connection.on("database connected", () => {
  let db = mongoose.connections[0].db;
  bucket = new mongoose.mongo.GridFSBucket(db, {
    bucketName: "newBucket",
  });
  console.log(bucket);
});

// configuration for the file storage
const storage = new GridFsStorage({
  url: mongouri,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      const ext = path.extname(file.originalname);
      const filename =
        file.originalname.replace(ext, "").toLowerCase().split(" ").join("-") +
        "-" +
        Date.now();
      const fileInfo = {
        filename: filename + ext,
        bucketName: "uploads",
      };
      resolve(fileInfo);
    });
  },
});

const upload = multer({ storage });
// file post route
app.post("/upload", upload.single("video"), (req, res) => {
  console.log(req.file);
  res.status(200).json({
    success: "Success",
  });
});

app.get("/", (req, res) => {
  res.status(200).json("Welcome to video server");
});
app.listen(port, () => {
  console.log("Server is running on port " + port);
});

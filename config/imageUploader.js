const AWS = require("aws-sdk");
const multer = require("multer");
const multerS3 = require("multer-s3");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

AWS.config.update({
  region: "ap-northeast-2",
  accessKeyId: process.env.AWS_KEY,
  secretAccessKey: process.env.AWS_SECRET,
});

const s3 = new AWS.S3();

const allowedExtensions = [".png", ".jpg", ".jpeg", ".bmp"];

const imageUplaoder = multer({
  storage: multerS3({
    s3: s3,
    bucket: "lighthouse-project-storage",
    key: (req, file, callback) => {
      console.log(req.query.userId);
      const userId = req.query.userId;
      const uploadDirectory = req.query.directory ?? "";
      const extension = path.extname(file.originalname);
      if (!allowedExtensions.includes(extension)) {
        return callback(new Error("wrong extension"));
      }
      callback(null, `${uploadDirectory}/${userId}.png`);
    },
    acl: "public-read-write",
  }),
});

module.exports = imageUplaoder;

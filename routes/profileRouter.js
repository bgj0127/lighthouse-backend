const express = require("express");
const imageUplaoder = require("../config/imageUploader");
const dotenv = require("dotenv");
const router = express.Router();

const db = require("../config/mysql");
const conn = db.init();

dotenv.config();

router.get("/user-profile", (req, res) => {
  const userId = req.body.userId;
  const sql = "select user_name, user_image, user_point from tb_user where user_id = ?";
  conn.query(sql, [userId], (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send({ message: "server error" });
    }
    res.send(result[0]);
  });
});

router.post("/upload-image", imageUplaoder.single("image"), (req, res) => {
  res.send({ message: "success" });
});

module.exports = router;

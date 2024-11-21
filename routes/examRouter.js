const express = require("express");
const router = express.Router();
const axios = require("axios");

const db = require("../config/mysql");
const conn = db.init();

router.get("/", (req, res) => {
  res.json({ message: "Score Router" });
});

router.get("/recommended-exams", async (req, res) => {
  const { license, section, keyword } = req.body;

  await axios
    .post("http://localhost:5678/webhook/recommended-items", {
      question: "저장공간",
    })
    .then((result) => {
      console.log(result.data);
    })
    .catch((err) => {
      console.log(err);
    });
  res.end();
});

// 문제풀이 후 결과(점수, 포인트)
router.get("/result", (req, res) => {
  res.json({ score: 100, point: 73 });
});

module.exports = router;
